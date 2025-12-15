import config from '../config';

export type Ticket = {
  id: number | string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  created?: string;
  resolved?: string | null;
  link?: string;
};

async function fetchJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url} - ${text?.slice(0, 200)}`);
  }
  return res.json();
}

function buildBasicAuth(user?: string, password?: string) {
  if (!user || !password) return undefined;
  const auth = Buffer.from(`${user}:${password}`).toString('base64');
  return { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };
}

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/$/, '');
  return path.startsWith('http') ? path : `${b}${path.startsWith('/') ? '' : '/'}${path}`;
}

function withPerPage(urlStr: string, perPage: number) {
  try {
    const u = new URL(urlStr);
    u.searchParams.set('per_page', String(perPage));
    return u.toString();
  } catch {
    return `${urlStr}${urlStr.includes('?') ? '&' : '?'}per_page=${perPage}`;
  }
}

export async function getTickets(): Promise<Ticket[]> {
  const wpUrl = process.env.WORDPRESS_URL || config.wordpress?.url;
  const wpUser = process.env.WORDPRESS_USER || config.wordpress?.username;
  const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD || config.wordpress?.appPassword;
  const perPageEnv = process.env.SUPPORT_PER_PAGE ? Number(process.env.SUPPORT_PER_PAGE) : undefined;
  const perPage = Math.max(1, Number(perPageEnv ?? config.support?.perPage ?? 20));

  if (!wpUrl) throw new Error('WORDPRESS_URL fehlt in Konfiguration');
  const wpBase = wpUrl as string;
  const headers = buildBasicAuth(wpUser, wpAppPassword) || { 'Content-Type': 'application/json' };

  const providerEnv = (process.env.SUPPORT_PROVIDER || '').trim();
  const provider = (providerEnv as any) || config.support?.provider || 'auto';
  const results: Ticket[] = [];

  async function tryAwesomeSupport(): Promise<Ticket[] | null> {
    const endpoint = process.env.SUPPORT_TICKETS_ENDPOINT || config.support?.ticketsEndpoint;
    const configured = endpoint ? joinUrl(wpBase, endpoint as string) : null;
    const endpoints = [
      ...(configured ? [configured] : []),
      // Awesome Support offizielle REST API (wpas-api) - Priorität!
      `${wpBase}/wp-json/wpas-api/v1/tickets`,
      `${wpBase}/wp-json/awesome-support/v1/tickets`,
      `${wpBase}/wp-json/wp/v2/ticket`,
      `${wpBase}/wp-json/wp/v2/tickets`,
      `${wpBase}/wp-json/wp/v2/wpas_ticket`,
      `${wpBase}/wp-json/wp/v2/as_ticket`,
      `${wpBase}/wp-json/ari/v1/tickets`,
    ].map((e) => withPerPage(e, perPage));

    for (const ep of endpoints) {
      try {
        const raw = await fetchJson(ep, headers);
        const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (!Array.isArray(items)) continue;
        return items.map((ticket: any) => {
          // Mappe Awesome Support API Response auf Ticket-Interface
          // title: { rendered: string }, content: { rendered: string }, ticket_priority, state, date, etc.
          const title = ticket.title?.rendered || ticket.title || `Ticket #${ticket.id || ticket.ID}`;
          const description = ticket.content?.rendered || ticket.content || '';
          const status = ticket.status || ticket.post_status || ticket.state || 'open';
          const priority = ticket['ticket_priority'] || ticket.priority || (ticket.meta?.priority) || 'normal';
          const created = ticket.date || ticket.post_date || ticket.date_gmt;
          const resolved = ticket.date_resolved || ticket.meta?.date_resolved || null;
          const link = ticket.link || `${wpBase}/?post_type=ticket&p=${ticket.id}`;
          
          return {
            id: ticket.id || ticket.ID,
            title,
            description,
            status,
            priority: priority || 'normal',
            created,
            resolved,
            link,
          } as Ticket;
        });
      } catch (_e) {
        continue;
      }
    }
    return null;
  }

  async function tryWpCpt(): Promise<Ticket[] | null> {
    const slug = process.env.SUPPORT_CPT_SLUG || config.support?.cptSlug || 'ticket';
    const ep = withPerPage(`${wpBase}/wp-json/wp/v2/${slug}`, perPage);
    try {
      const items = await fetchJson(ep, headers);
      if (!Array.isArray(items)) return null;
      return items.map((p: any) => ({
        id: p.id || p.ID,
        title: (p.title?.rendered ?? p.title) || `Ticket #${p.id || p.ID}`,
        description: (p.content?.rendered ?? p.content) || '',
        status: p.status || p.post_status || 'open',
        created: p.date || p.post_date,
        resolved: p.meta?.date_resolved || null,
        link: p.link,
      } as Ticket));
    } catch {
      return null;
    }
  }

  async function tryWooOrderNotes(): Promise<Ticket[] | null> {
    const wooUrl = process.env.WOOCOMMERCE_URL || process.env.WOO_URL || config.woocommerce?.url;
    const consumerKey = process.env.CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || config.woocommerce?.consumerKey;
    const consumerSecret = process.env.CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || config.woocommerce?.consumerSecret;
    if (!wooUrl || !consumerKey || !consumerSecret) return null;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const wooHeaders = { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };

    try {
      const ordersEp = withPerPage(`${wooUrl}/wp-json/wc/v3/orders`, perPage);
      const orders = await fetchJson(ordersEp, wooHeaders);
      if (!Array.isArray(orders) || orders.length === 0) return [];
      const tickets: Ticket[] = [];
      for (const order of orders) {
        try {
          const notesEp = `${wooUrl}/wp-json/wc/v3/orders/${order.id}/notes`;
          const notes = await fetchJson(notesEp, wooHeaders);
          if (Array.isArray(notes)) {
            for (const n of notes) {
              tickets.push({
                id: `order-${order.id}-note-${n.id}`,
                title: `Bestell-Notiz #${n.id} (Order ${order.id})`,
                description: n.note || '',
                status: order.status || 'open',
                created: n.date_created || order.date_created,
                priority: 'normal',
                link: `${wooUrl}/wp-admin/post.php?post=${order.id}&action=edit`,
                resolved: null,
              });
            }
          }
        } catch {
          continue;
        }
      }
      return tickets;
    } catch {
      return null;
    }
  }

  // Provider-Auswahl (Woo-Order-Notes standardmäßig deaktiviert, außer explizit erlaubt)
  const allowNotesEnv = process.env.SUPPORT_ALLOW_ORDER_NOTES_FALLBACK;
  const allowNotes = typeof allowNotesEnv === 'string'
    ? ['1','true','yes','on'].includes(allowNotesEnv.toLowerCase())
    : (config.support?.allowOrderNotesFallback === true);
  const order: (typeof provider)[] = provider === 'auto'
    ? (allowNotes ? ['awesome-support', 'wp-cpt', 'woo-order-notes'] : ['awesome-support', 'wp-cpt']) as any
    : [provider];

  for (const p of order) {
    let out: Ticket[] | null = null;
    if (p === 'awesome-support') out = await tryAwesomeSupport();
    if (!out && p === 'wp-cpt') out = await tryWpCpt();
    if (!out && p === 'woo-order-notes') out = await tryWooOrderNotes();
    if (Array.isArray(out)) return out;
  }

  return results; // leer wenn nichts verfügbar
}
