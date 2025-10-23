// src/agent/jobs/standardAudit.ts
// Node-Builtins: –
// External: –
// Local:
import { wooPost } from "../../tools/woo.js";

export type WooId = number;

export async function createStandardAudit(): Promise<{
  created: { id: WooId; permalink?: string; status?: string };
  updated: { id: WooId; name?: string };
}> {
  // 1) Produkt anlegen
  const createRes = (await wooPost("/products", {
    name: "Standard-Audit",
    slug: "standard-audit",
    type: "simple",
    status: "publish",
    virtual: true,
    downloadable: false,
    manage_stock: false,
    regular_price: "150",
    catalog_visibility: "visible",
    categories: [{ id: 51 }], // Audits
    tags: [
      { name: "Standard-Audit" },
      { name: "Website-Audit" },
      { name: "SEO-Check" },
      { name: "UX-Review" },
      { name: "Performance-Analyse" },
      { name: "Conversion-Optimierung" },
      { name: "Social-Media-Audit" },
    ],
  })) as any;

  const id: WooId = createRes?.id;

  // 2) Beschreibung setzen
  const short_description =
    "Vertiefte Analyse deiner Website inkl. 6–10 priorisierten Maßnahmen. Lieferung in 3–5 Werktagen.";
  const description = `
<h2>⭐ Standard-Audit – Vertieft, strukturiert, umsetzbar</h2>
<p>Du erhältst eine fundierte Analyse mit <strong>6–10 priorisierten Maßnahmen</strong>, klaren nächsten Schritten und kurzen Aufwandsschätzungen.</p>
<h3>🔍 Was wir prüfen</h3>
<ul>
  <li><strong>Design &amp; UX:</strong> Navigationslogik, Above-the-Fold, Microcopy, mobile Patterns.</li>
  <li><strong>Content &amp; Messaging:</strong> Value Proposition, CTAs, interne Verlinkung.</li>
  <li><strong>Technik &amp; Performance:</strong> Ladezeiten, Bild-/Font-Optimierung, Fehlerseiten.</li>
  <li><strong>Onpage-SEO (Basis):</strong> Meta-Daten, Headings, Indexierbarkeit, strukturierte Daten (Überblick).</li>
  <li><strong>Conversion-Potenziale:</strong> Trust-Signale, Formular-Reibung, Social Proof.</li>
  <li><strong>Social-Profile (optional):</strong> Marken-Konsistenz, Profil-Optimierung.</li>
</ul>
<h3>📦 Was du erhältst</h3>
<ul>
  <li><strong>6–10 priorisierte Empfehlungen</strong> mit To-dos und Aufwand.</li>
  <li><strong>PDF-Report</strong> (optional: kurzer Screencast).</li>
  <li><strong>Lieferzeit:</strong> 3–5 Werktage.</li>
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

export default createStandardAudit;
