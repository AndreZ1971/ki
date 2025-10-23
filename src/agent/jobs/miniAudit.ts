// src/agent/jobs/miniAudit.ts
// Node-Builtins: –
// External: –
// Local:
import { wooPost } from "../../tools/woo.js";

export type WooId = number;

export async function createMiniAudit(): Promise<{
  created: { id: WooId; permalink?: string; status?: string };
  updated: { id: WooId; name?: string };
}> {
  // 1) Produkt anlegen
  const createRes = (await wooPost("/products", {
    name: "Mini-Audit",
    slug: "mini-audit",
    type: "simple",
    status: "publish",
    virtual: true,
    downloadable: false,
    manage_stock: false,
    regular_price: "50",
    catalog_visibility: "visible",
    categories: [{ id: 51 }], // Audits
    tags: [
      { name: "Mini-Audit" },
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
    "Kompakte Analyse deiner Website & Social-Profile – 3–5 konkrete Optimierungsschritte. Lieferung in 2 Werktagen.";
  const description = `
<h2>🌟 Mini-Audit – Kleine Analyse, große Wirkung</h2>
<p>Finde schnell heraus, wie du deine Website und Social-Media-Profile nachhaltig verbessern kannst!
Unser Mini-Audit ist eine kompakte Profianalyse, die sich auf das Wesentliche konzentriert und dir
konkrete Optimierungsschritte liefert. Ideal für Selbstständige, kleine Unternehmen und Kreative, die
ohne großen Aufwand besser werden wollen.</p>

<h3>🔍 Was wir prüfen</h3>
<ul>
  <li><strong>Design &amp; User Experience:</strong> Start-/Landing-Page, Menüführung, Mobile-Darstellung.</li>
  <li><strong>Inhalte &amp; Messaging:</strong> Klarheit der Botschaft, CTAs, Microcopy.</li>
  <li><strong>Technik &amp; Performance:</strong> Ladezeit, Responsiveness, kritische Fehler/Links.</li>
  <li><strong>Conversion-Potenziale:</strong> Trust-Elemente, Formulare, Social Proof.</li>
  <li><strong>Grobe SEO-Checkpoints:</strong> Meta-Titel, Struktur, Indexierbarkeit (Quick-Scan).</li>
  <li><strong>Basis-Analyse Social-Media (optional):</strong> Marken­konsistenz, Engagement-Hinweise.</li>
</ul>

<h3>📦 Was du erhältst</h3>
<ul>
  <li><strong>3–5 konkrete, priorisierte Empfehlungen</strong> als strukturierter PDF-Report.</li>
  <li><strong>Schnelle Lieferung:</strong> innerhalb von 2 Werktagen.</li>
  <li><strong>Plattform-agnostisch:</strong> WordPress, Wix, Shopify, Squarespace, …</li>
</ul>

<h3>📧 So läuft’s ab</h3>
<ol>
  <li><strong>Kauf &amp; Kurzformular:</strong> Du teilst uns URL, Social-Links und Ziele mit.</li>
  <li><strong>Analyse:</strong> Wir prüfen nach obigen Kriterien.</li>
  <li><strong>Ergebnisse:</strong> Report als PDF (optional Kommentar/Screencast).</li>
</ol>

<p>Starte jetzt deinen Mini-Audit – <strong>kleiner Aufwand, große Wirkung!</strong></p>
`.trim();

  const updateRes = (await wooPost(`/products/${id}`, {
    short_description,
    description,
  })) as any;

  return {
    created: { id, permalink: createRes?.permalink, status: createRes?.status },
    updated: { id, name: updateRes?.name },
  };
}

export default createMiniAudit;
