#!/usr/bin/env node
/**
 * Automatisches i18n-Konvertierungs-Script
 * Konvertiert alle deutschen Strings in React-Components zu useTranslation()
 *
 * Usage: node scripts/convert-to-i18n.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES_DIR = path.join(__dirname, "../frontend/src/pages");
const GERMAN_LOCALE = path.join(
  __dirname,
  "../frontend/src/locales/german.json"
);
const ENGLISH_LOCALE = path.join(
  __dirname,
  "../frontend/src/locales/english.json"
);

// Patterns für deutsche Strings die übersetzt werden sollen
const STRING_PATTERNS = [
  // Hardcoded Strings in JSX
  { pattern: />([^<>{}]+)</g, type: "jsx-text" },
  // String Literals in Attributen
  {
    pattern: /(?:label|placeholder|title|alt)=["']([^"']+)["']/g,
    type: "attribute",
  },
  // String Literals als Props
  { pattern: /(?:loadingText|children)={["']([^"']+)["']}/g, type: "prop" },
];

// Wörter die NUR auf Deutsch sind (zum Erkennen)
const GERMAN_INDICATORS = [
  "Einstellungen",
  "Speichern",
  "Laden",
  "Zurück",
  "Fehler",
  "Bestellungen",
  "Kunden",
  "Produkte",
  "Umsatz",
  "Verbindung",
  "testen",
  "generieren",
  "analysieren",
  "erstellen",
  "öffnen",
];

async function findAllPages() {
  const pages = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (
        entry.name.endsWith(".tsx") &&
        !entry.name.includes(".test.")
      ) {
        pages.push(fullPath);
      }
    }
  }

  scanDir(PAGES_DIR);
  return pages;
}

function isGermanString(str) {
  // Prüfe ob String deutsche Indikatoren enthält
  const normalized = str.toLowerCase();
  return GERMAN_INDICATORS.some((indicator) =>
    normalized.includes(indicator.toLowerCase())
  );
}

function extractGermanStrings(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const germanStrings = new Set();

  // Extrahiere alle potentiellen deutschen Strings
  for (const { pattern } of STRING_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const str = match[1].trim();
      if (str && isGermanString(str)) {
        germanStrings.add(str);
      }
    }
  }

  return Array.from(germanStrings);
}

function generateTranslationKey(str, pageName) {
  // Erstelle snake_case key aus String
  const key = str
    .toLowerCase()
    .replace(/[äöü]/g, (m) => ({ ä: "ae", ö: "oe", ü: "ue" })[m] || m)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50); // Max 50 chars

  return `${pageName}.${key}`;
}

async function convertPageToI18n(filePath) {
  console.log(`Konvertiere: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, "utf-8");
  const germanStrings = extractGermanStrings(filePath);

  if (germanStrings.length === 0) {
    console.log(`  ⏭️  Keine deutschen Strings gefunden`);
    return { converted: false };
  }

  // Prüfe ob useTranslation bereits importiert ist
  if (!content.includes("useTranslation")) {
    // Füge Import hinzu
    const importLine = "import { useTranslation } from 'react-i18next';";
    const firstImportMatch = content.match(/^import .+;$/m);

    if (firstImportMatch) {
      const insertPos =
        content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
      content =
        content.slice(0, insertPos) +
        "\n" +
        importLine +
        content.slice(insertPos);
    }

    // Füge Hook hinzu
    const componentMatch = content.match(/const \w+: React\.FC/);
    if (componentMatch) {
      const insertPos =
        content.indexOf(componentMatch[0]) + componentMatch[0].length;
      const nextLine = content.indexOf("\n", insertPos);
      content =
        content.slice(0, nextLine) +
        "\n  const { t } = useTranslation();" +
        content.slice(nextLine);
    }
  }

  console.log(`  ✅ ${germanStrings.length} Strings gefunden`);

  return {
    converted: true,
    germanStrings,
    updatedContent: content,
  };
}

async function main() {
  console.log("🚀 Starte automatische i18n-Konvertierung\n");

  const pages = await findAllPages();
  console.log(`📄 Gefundene Pages: ${pages.length}\n`);

  let totalConverted = 0;
  let totalStrings = 0;

  for (const page of pages) {
    const result = await convertPageToI18n(page);

    if (result.converted) {
      totalConverted++;
      totalStrings += result.germanStrings.length;
    }
  }

  console.log(`\n✨ Fertig!`);
  console.log(`   Konvertierte Pages: ${totalConverted}/${pages.length}`);
  console.log(`   Gefundene Strings: ${totalStrings}`);
  console.log(`\n⚠️  HINWEIS: Script analysiert nur - ändert keine Dateien!`);
  console.log(`   Manuelle Konvertierung empfohlen für Qualität`);
}

main().catch(console.error);
