// src/agent/jobs/premiumAudit.ts
// Node-Builtins: –
// External: –
// Local:
import { wooPost } from '../../tools/woo.js';

export type WooId = number;

export async function createPremiumAudit(): Promise<{
  created: { id: WooId; permalink?: string; status?: string };
  updated: { id: WooId; name?: string };
}> {
  // 1) Produkt anlegen
  const createRes = (await wooPost('/products', {
    name: 'Premium-Audit',
    slug: 'premium-audit',
    type: 'simple',
    status: 'publish',
    virtual: true,
    downloadable: false,
    manage_stock: false,
    regular_price: '250',
    catalog_visibility: 'visible',
    categories: [{ id: 51 }], // Audits
    tags: [
      { name: 'Premium-Audit' },
      { name: 'Website-Audit' },
      { name: 'SEO-Check' },
      { name: 'UX-Review' },
      { name: 'Performance-Analyse' },
      { name: 'Conversion-Optimierung' },
      { name: 'Social-Media-Audit' },
    ],
  })) as any;

  const id: WooId = createRes?.id;

  // 2) Beschreibung setzen
  const short_description =
    'Tiefenprüfung inkl. Wettbewerbs-Abgleich, Tracking/Funnel-Check und 10–20 priorisierten Maßnahmen. Lieferung in 5–7 Werktagen + Abschluss-Call.';
  const description = `
<h2>🥇 Premium-Audit – Tiefenprüfung mit Roadmap &amp; Call</h2>
<p>Die umfassendste Analyse inkl. <strong>Wettbewerbs-Abgleich</strong>, <strong>Tracking/Funnel-Check</strong> und <strong>10–20 Maßnahmen</strong> mit Aufwandsschätzung.</p>
<h3>🔍 Was wir prüfen</h3>
<ul>
  <li><strong>UX in Tiefe:</strong> Nutzerpfade, Informationsarchitektur, Micro-Interactions.</li>
  <li><strong>Content &amp; Messaging:</strong> Value Proposition, Content-Lücken, interne Verlinkung.</li>
  <li><strong>Technik &amp; Performance:</strong> Core Web Vitals, Caching/CDN, Fehlerseiten &amp; Redirects.</li>
  <li><strong>Onpage-SEO (erweitert):</strong> Meta, Headings, Indexierbarkeit, Sitemaps, Canonicals, Schema-Überblick.</li>
  <li><strong>Barrierefreiheit (Baseline):</strong> Kontraste, Alternativtexte, Fokus, Keyboard-Support.</li>
  <li><strong>Conversion-Funnel:</strong> Trust, Social Proof, Checkout/Leadflows.</li>
  <li><strong>Tracking &amp; Analytics:</strong> GA4/Matomo-Basics, Ereignisse/Conversions, Consent-Hinweise.</li>
  <li><strong>Wettbewerbs-Abgleich:</strong> 2–3 direkte Mitbewerber bzgl. USPs, UX-Stärken/Schwächen.</li>
</ul>
<h3>📦 Was du erhältst</h3>
<ul>
  <li><strong>10–20 priorisierte Empfehlungen</strong> inkl. <strong>Roadmap</strong> (Quick Wins → Mid-Term → Nice-to-Have).</li>
  <li><strong>PDF-Report</strong>, optional Screencast.</li>
  <li><strong>Abschluss-Call (30–45 Min.)</strong>.</li>
  <li><strong>Lieferzeit:</strong> 5–7 Werktage.</li>
</ul>
`;

  const updateRes = (await wooPost(`/products/${id}`, {
    short_description,
    description,
  })) as any;

  return {
    created: { id, permalink: createRes?.permalink, status: createRes?.status },
    updated: { id, name: updateRes?.name },
  };
}

export default createPremiumAudit;
