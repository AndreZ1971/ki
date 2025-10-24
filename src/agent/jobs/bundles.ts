// src/agent/jobs/bundles.ts
// Node-Builtins: –
// External: –
// Local:
import { wooPost } from '../../tools/woo.js';

type WooId = number;

export async function createBundle_SocialMediaStarter(): Promise<{
  id: WooId;
}> {
  const res = await wooPost('/products', {
    name: 'Social Media Starter Bundle',
    slug: 'social-media-starter-bundle',
    type: 'simple',
    status: 'publish',
    virtual: true,
    downloadable: true,
    regular_price: '59',
    catalog_visibility: 'visible',
    categories: [{ id: 52 }], // Bundles
    tags: [
      { name: 'Bundle' },
      { name: 'Social Media' },
      { name: 'Prompt-Pack' },
      { name: 'Template' },
    ],
  }) as { id: WooId };

  const id: WooId = res?.id;

  const short_description =
    'Starterpaket für KI-gestützten Social-Content: Prompts, Planner & Mini-Guide zum Bundle-Preis.';
  const description = `
<h2>🎁 Social Media Starter Bundle</h2>
<p>Starte in <strong>Stunden statt Wochen</strong>: Prompts, Planung &amp; Leitfaden in einem Paket.</p>
<ul>
  <li>🧩 <strong>Social Media Prompt Pack</strong> (50+ Prompts)</li>
  <li>🗓️ <strong>Notion Content Planner</strong> (Redaktionsplanung)</li>
  <li>📘 <strong>Mini-Guide:</strong> KI-Content-Strategie in 3 Tagen</li>
</ul>
<p>Du sparst <strong>25 %</strong> ggü. Einzelkauf. <strong>Sofort-Download</strong> nach Kauf.</p>
`;
  await wooPost(`/products/${id}`, { short_description, description });

  return { id };
}

export async function createBundlesSeed(): Promise<{
  bundles: { id: WooId; name: string }[];
}> {
  const a = await createBundle_SocialMediaStarter();
  return { bundles: [{ id: a.id, name: 'Social Media Starter Bundle' }] };
}

export default createBundlesSeed;
