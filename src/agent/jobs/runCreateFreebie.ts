import "dotenv/config";   // <-- NEU

import minimist from "minimist";

import { createDownloadFreebie } from "./createFreebie";


async function main() {
  const args = minimist(process.argv.slice(2), {
    string: ["name","zip","cover","tags","slug","short","long","category","categoryId"],
  });

  // Fallbacks aus Positionsargumenten (args._)
  const [
    posName,       // 0
    posCategory,   // 1
    posZip,        // 2
    posCover,      // 3
    posTags,       // 4
    posSlug        // 5
  ] = args._ as string[];

  const name = args.name ?? posName;
  const categoryId = Number(args.category ?? args.categoryId ?? posCategory);
  const zipPath = args.zip ?? posZip;
  const coverPath = args.cover ?? posCover;
  const tags = (args.tags ?? posTags ?? "")
    .toString().split(",").map(s => s.trim()).filter(Boolean);
  const slug = args.slug ?? posSlug;

  const shortDesc = (args.short as string) ?? `Kostenloses Wallpaper-Bundle (Dark & Light) als ZIP-Download.`;
  const longDesc = (args.long as string) ?? `<p>Minimalistische Wallpaper in 4K/1440p/1080p + Mobile-Formate. ZIP enthalten.</p>`;

  if (!name || !categoryId || !zipPath) {
    console.error("Fehler: --name, --category, --zip sind Pflichtparameter.");
    console.error("Erhaltene Args:", { flags: args, positionals: args._ });
    process.exit(1);
  }

  const product = await createDownloadFreebie({
    name, categoryId, zipPath, coverPath, tags, slug, shortDesc, longDesc,
  });

  console.log("✅ Produkt erstellt:", { id: product?.id, name: product?.name, slug: product?.slug });
}

main().catch(e => {
  console.error("❌ Fehler in runCreateFreebie:", e);
  process.exit(1);
});

