const express = require('express');
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
  const source = payload.tenantSlug || payload.customerName || payload.company || payload.email || payload.orderId || `tenant-${Date.now()}`;
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

  const url = `${config.portainerUrl}/api/stacks/create/standalone/string?endpointId=${encodeURIComponent(config.workerEndpointId)}`;

  const payload = {
    Name: stackName,
    StackFileContent: composeContent,
    FromAppTemplate: false
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${config.portainerApiToken}`,
      'Content-Type': 'application/json'
    },
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
    if (config.webhookSecret && !isValidWooSignature(req) && !isValidManualSecret(req)) {
      return res.status(401).json({ ok: false, error: 'invalid webhook signature/secret' });
    }

    const payload = req.body || {};
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

    const stackResult = await createPortainerStack({ stackName, composeContent });
    const routeResult = await writeTraefikRouteFile({ tenantSlug, fileContent: routeContent });
    const emailResult = await sendProvisioningMail({
      email: customerEmail,
      tenantSlug,
      orderId
    });

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
  console.log(`ari-provisioning listening on :${config.port}`);
});
