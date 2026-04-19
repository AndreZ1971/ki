const express = require('express');
const https = require('https');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const crypto = require('node:crypto');
const dotenv = require('dotenv');

dotenv.config();

const execFileAsync = promisify(execFile);

const config = {
  port: Number(process.env.PORT || 3001),
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  baseDomain: process.env.BASE_DOMAIN || 'ari-system.de',
  tenantImage: process.env.TENANT_IMAGE || 'ghcr.io/andrez1971/ari:latest',
  portainerUrl: (process.env.PORTAINER_URL || '').replace(/\/$/, ''),
  portainerApiToken: process.env.PORTAINER_API_TOKEN || '',
  workerEndpointId: process.env.PORTAINER_WORKER_ENDPOINT_ID || '',
  workerSshHost: process.env.WORKER_SSH_HOST || '',
  workerSshPort: Number(process.env.WORKER_SSH_PORT || 22),
  workerSshUser: process.env.WORKER_SSH_USER || 'root',
  workerSshPrivateKey: process.env.WORKER_SSH_PRIVATE_KEY || '',
  traefikDynamicDir: process.env.TRAEFIK_DYNAMIC_DIR || '/data/compose/4/dynamic',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || ''
};

const app = express();
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

function safeEqual(a, b) {
  const aa = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (aa.length !== bb.length) {
    return false;
  }
  return crypto.timingSafeEqual(aa, bb);
}

function isValidWooSignature(req) {
  if (!config.webhookSecret) {
    return true;
  }

  const signature = req.header('x-wc-webhook-signature');
  if (!signature) {
    return false;
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha256', config.webhookSecret).update(rawBody).digest('base64');
  return safeEqual(signature, expected);
}

function isValidManualSecret(req) {
  if (!config.webhookSecret) {
    return true;
  }

  const providedSecret = req.header('x-ari-webhook-secret');
  return Boolean(providedSecret && safeEqual(providedSecret, config.webhookSecret));
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40);
}

function makeTenantSlug(payload) {
  const source = payload.tenantSlug
    || payload.customerName
    || payload.company
    || payload.email
    || payload.orderId
    || payload.id
    || payload.number
    || `tenant-${Date.now()}`;
  const slug = slugify(source);
  return slug || `tenant-${Date.now()}`;
}

function buildStackName(tenantSlug) {
  return `ari-${tenantSlug}`;
}

function buildTenantCompose(tenantSlug) {
  return `version: "3.8"
services:
  ari-app:
    image: ${config.tenantImage}
    container_name: ari-${tenantSlug}
    restart: always
    environment:
      - NODE_ENV=production
      - HUSKY=0
    volumes:
      - /opt/ari/${tenantSlug}:/app/data:rw
    healthcheck:
      test: ["CMD-SHELL", "node healthcheck.js"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    networks:
      - web

networks:
  web:
    external: true
    name: ari-proxy_web
`;
}

function buildTraefikDynamicFile(tenantSlug) {
  return `http:
  routers:
    ${tenantSlug}:
      rule: "Host(\`${tenantSlug}.${config.baseDomain}\`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: ${tenantSlug}-svc

  services:
    ${tenantSlug}-svc:
      loadBalancer:
        servers:
          - url: "http://ari-${tenantSlug}:3000"
`;
}

async function createPortainerStack({ stackName, composeContent }) {
  if (!config.portainerUrl || !config.portainerApiToken || !config.workerEndpointId) {
    throw new Error('Portainer config missing: PORTAINER_URL, PORTAINER_API_TOKEN, PORTAINER_WORKER_ENDPOINT_ID');
  }

  // Validate token format
  const tokenMasked = maskedValue(config.portainerApiToken);
  const tokenLength = config.portainerApiToken.length;
  const tokenStart = config.portainerApiToken.slice(0, 5);
  const tokenEnd = config.portainerApiToken.slice(-5);
  
  console.log(`[PROVISION] Token validation: length=${tokenLength}, start=${tokenStart}, end=${tokenEnd}, masked=${tokenMasked}`);
  console.log(`[PROVISION] Token trimmed length: ${config.portainerApiToken.trim().length} (original: ${tokenLength})`);
  
  // Check for whitespace issues
  if (config.portainerApiToken !== config.portainerApiToken.trim()) {
    console.warn(`[PROVISION] ⚠️  Token has leading/trailing whitespace!`);
  }

  const url = `${config.portainerUrl}/api/stacks/create/standalone/string?endpointId=${encodeURIComponent(config.workerEndpointId)}`;

  const payload = {
    Name: stackName,
    StackFileContent: composeContent,
    FromAppTemplate: false
  };

  // Use https.Agent to ignore self-signed certificate
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  const authHeader = `Bearer ${config.portainerApiToken}`;
  console.log(`[PROVISION] Authorization header: Bearer ${maskedValue(config.portainerApiToken)}`);
  console.log(`[PROVISION] Posting to: ${url}`);

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    httpsAgent,
    timeout: 30000
  });

  return response.data;
}

async function writeTraefikRouteFile({ tenantSlug, fileContent }) {
  if (!config.workerSshHost || !config.workerSshPrivateKey) {
    return {
      written: false,
      reason: 'SSH not configured (WORKER_SSH_HOST / WORKER_SSH_PRIVATE_KEY missing)'
    };
  }

  const targetFile = `${config.traefikDynamicDir}/${tenantSlug}.yml`;
  const escapedContent = fileContent.replace(/'/g, `'\\''`);
  const remoteCommand = `mkdir -p ${config.traefikDynamicDir} && cat > ${targetFile} << 'EOF'\n${escapedContent}\nEOF`;

  const args = [
    '-o',
    'StrictHostKeyChecking=no',
    '-p',
    String(config.workerSshPort),
    `${config.workerSshUser}@${config.workerSshHost}`,
    remoteCommand
  ];

  const env = { ...process.env, SSH_PRIVATE_KEY: config.workerSshPrivateKey };

  const helperScript = `
set -eu
KEY_FILE=$(mktemp)
trap 'rm -f "$KEY_FILE"' EXIT
printf "%s" "$SSH_PRIVATE_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"
exec ssh -i "$KEY_FILE" "$@"
`;

  await execFileAsync('sh', ['-lc', helperScript, 'x', ...args], { env, timeout: 30000 });

  return {
    written: true,
    path: targetFile
  };
}

function buildMailer() {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.smtpFrom) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });
}

const mailer = buildMailer();

function maskedValue(value) {
  if (!value) {
    return '(missing)';
  }
  const str = String(value);
  if (str.length <= 6) {
    return '***';
  }
  return `${str.slice(0, 3)}***${str.slice(-2)}`;
}

function logStartupConfig() {
  const summary = {
    portainerUrl: config.portainerUrl || '(missing)',
    workerEndpointId: config.workerEndpointId || '(missing)',
    portainerToken: config.portainerApiToken ? `(set, length=${config.portainerApiToken.length})` : '(missing)',
    portainerTokenMasked: maskedValue(config.portainerApiToken),
    workerSshHost: config.workerSshHost || '(missing)',
    workerSshUser: config.workerSshUser || '(missing)',
    workerSshKey: config.workerSshPrivateKey ? '(set)' : '(missing)',
    smtpHost: config.smtpHost || '(missing)',
    smtpUser: config.smtpUser || '(missing)',
    smtpFrom: config.smtpFrom || '(missing)',
    webhookSecret: maskedValue(config.webhookSecret),
    baseDomain: config.baseDomain
  };

  console.log('[STARTUP] Provisioning config summary:', summary);

  // Detailed token check
  if (config.portainerApiToken) {
    if (config.portainerApiToken !== config.portainerApiToken.trim()) {
      console.warn('[STARTUP] ⚠️  PORTAINER_API_TOKEN has leading/trailing whitespace!');
    }
    if (!config.portainerApiToken.startsWith('ptr_')) {
      console.warn('[STARTUP] ⚠️  PORTAINER_API_TOKEN does not start with "ptr_"');
    }
  }

  const missingProvisioning = [];
  if (!config.portainerUrl) missingProvisioning.push('PORTAINER_URL');
  if (!config.portainerApiToken) missingProvisioning.push('PORTAINER_API_TOKEN');
  if (!config.workerEndpointId) missingProvisioning.push('PORTAINER_WORKER_ENDPOINT_ID');

  if (missingProvisioning.length > 0) {
    console.warn('[STARTUP] Missing required Portainer config:', missingProvisioning.join(', '));
  }

  const missingSmtp = [];
  if (!config.smtpHost) missingSmtp.push('SMTP_HOST');
  if (!config.smtpUser) missingSmtp.push('SMTP_USER');
  if (!config.smtpPass) missingSmtp.push('SMTP_PASS');
  if (!config.smtpFrom) missingSmtp.push('SMTP_FROM');

  if (missingSmtp.length > 0) {
    console.warn('[STARTUP] Missing SMTP config (mail disabled):', missingSmtp.join(', '));
  }
}

async function sendProvisioningMail({ email, tenantSlug, orderId }) {
  if (!mailer || !email) {
    return { sent: false, reason: 'SMTP or recipient missing' };
  }

  const appUrl = `https://${tenantSlug}.${config.baseDomain}`;

  await mailer.sendMail({
    from: config.smtpFrom,
    to: email,
    subject: `Dein ARI-Zugang ist bereit (${tenantSlug})`,
    text: `Hallo,\n\ndein Shop wurde eingerichtet.\n\nURL: ${appUrl}\nOrder: ${orderId || 'n/a'}\n\nViele Grüße\nARI-Team`
  });

  return { sent: true, url: appUrl };
}

app.get('/health', async (_req, res) => {
  res.json({ ok: true, service: 'ari-provisioning' });
});

app.post('/api/provision/order', async (req, res) => {
  try {
    const webhookTopic = req.header('x-wc-webhook-topic') || '';
    const webhookEvent = req.header('x-wc-webhook-event') || '';

    if (config.webhookSecret && !isValidWooSignature(req) && !isValidManualSecret(req)) {
      console.warn('[PROVISION] Validation failed:', { webhookTopic, webhookEvent });
      return res.status(401).json({ ok: false, error: 'invalid webhook signature/secret' });
    }

    const payload = req.body || {};
    const orderStatus = String(payload?.status || '').toLowerCase();

    if (webhookTopic && webhookTopic !== 'order.created' && webhookTopic !== 'order.updated') {
      console.log('[PROVISION] Skipping webhook topic:', webhookTopic);
      return res.status(202).json({ ok: true, skipped: true, reason: `topic ${webhookTopic} not handled` });
    }

    if (orderStatus && !['processing', 'completed'].includes(orderStatus)) {
      console.log('[PROVISION] Skipping order status:', orderStatus);
      return res.status(202).json({ ok: true, skipped: true, reason: `status ${orderStatus} not provisioned` });
    }

    const customerName = payload.customerName
      || payload.company
      || [payload?.billing?.first_name, payload?.billing?.last_name].filter(Boolean).join(' ')
      || payload?.billing?.company
      || payload?.customer?.name;
    const customerEmail = payload.email
      || payload.customerEmail
      || payload?.billing?.email
      || payload?.customer?.email;
    const orderId = payload.orderId || payload.id || payload.number;

    const tenantSlug = makeTenantSlug(payload);
    const stackName = buildStackName(tenantSlug);
    const composeContent = buildTenantCompose(tenantSlug);
    const routeContent = buildTraefikDynamicFile(tenantSlug);

    console.log('[PROVISION] Start:', {
      webhookTopic,
      webhookEvent,
      orderId,
      orderStatus,
      tenantSlug,
      stackName,
      customerEmail
    });

    console.log('[PROVISION] Creating Portainer stack:', stackName);
    const stackResult = await createPortainerStack({ stackName, composeContent });
    console.log('[PROVISION] Portainer stack created');

    console.log('[PROVISION] Writing Traefik route file for:', tenantSlug);
    const routeResult = await writeTraefikRouteFile({ tenantSlug, fileContent: routeContent });
    console.log('[PROVISION] Traefik route result:', routeResult);

    console.log('[PROVISION] Sending mail to:', customerEmail || '(missing)');
    const emailResult = await sendProvisioningMail({
      email: customerEmail,
      tenantSlug,
      orderId
    });
    console.log('[PROVISION] Mail result:', emailResult);

    return res.json({
      ok: true,
      tenantSlug,
      stackName,
      customerName,
      customerEmail,
      orderId,
      domain: `${tenantSlug}.${config.baseDomain}`,
      stack: stackResult,
      route: routeResult,
      email: emailResult
    });
  } catch (error) {
    console.error('[PROVISION] Failed:', {
      message: error?.message,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data
    });
    const message = error?.response?.data || error?.message || 'unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/provision/test-mail', async (req, res) => {
  try {
    const email = req.body?.email;
    if (!email) {
      return res.status(400).json({ ok: false, error: 'email is required' });
    }

    const result = await sendProvisioningMail({
      email,
      tenantSlug: 'test-tenant',
      orderId: 'test-order'
    });

    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'mail failed' });
  }
});

app.listen(config.port, () => {
  logStartupConfig();
  console.log(`ari-provisioning listening on :${config.port}`);
});
