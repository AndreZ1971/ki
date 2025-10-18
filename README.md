# README

## Projektüberblick

Dieses Repo automatisiert den **Freebie-Workflow** für einen WooCommerce/WordPress-Shop:

- ZIP & Cover in die **WP-Mediathek** hochladen  
- **WooCommerce-Produkt** (0 €, virtual + downloadable) erstellen  
- Downloads sauber am Produkt hinterlegen

**Tech-Stack:** Node.js (TypeScript), tsx, Axios, WooCommerce/WordPress REST API.

---

## Voraussetzungen

- **Node.js** ≥ 18 (LTS empfohlen)  
- **npm** ≥ 9  
- **Git**  
- **WooCommerce** ≥ 7, **WordPress** ≥ 6  
- WordPress: **Application Password** für einen Benutzer mit ausreichenden Rechten  
- WooCommerce: **Consumer Key/Secret (CK/CS)** mit `read/write`  

Optional (Deployment): **PM2**

---

## Installation & Setup

```bash
git clone <REPO_URL> ki
cd ki
npm ci
```

### .env

Erstelle eine `.env` im Projektroot:

```dotenv
# WordPress Basis-URL (ohne /wp-json am Ende)
WP_URL=https://example.com

# WordPress Basic Auth per Application Password
WP_USERNAME=admin@example.com
WP_APP_PASSWORD=ab12 ab34 cd56 ef78 gh90

# WooCommerce REST-Basis (ohne /wp-json am Ende)
WC_API_URL=https://example.com

# WooCommerce REST Keys
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# (Optional) OpenAI
OPENAI_API_KEY=sk-...

# (Optional) GitHub Token
GITHUB_TOKEN=ghp_...

# Job-Runner
JOB=createFreebie
JOB_MODE=once         # 'once' | 'interval'
JOB_INTERVAL_MS=900000
```

**Wichtig:**

- `WP_URL`/`WC_API_URL` **ohne** Doppel-`/wp-json/...`  
- Bei fehlenden Permalinks ggf. `WC_API_URL=https://example.com/index.php`  
- Application Passwords sind **Basic Auth** (User/Pass)  
- **Secrets niemals commiten**

---

## Skripte

```bash
npm run lint
npm run lint -- --fix
npm run dev
npm run freebie
```

### Job-Runner

- **Einmalig:**

  ```bash
  JOB=createFreebie JOB_MODE=once npm run dev
  ```

- **Intervall:**

  ```bash
  JOB=createFreebie JOB_MODE=interval JOB_INTERVAL_MS=900000 npm run dev
  ```

---

## Freebie anlegen (CLI)

```bash
npm run freebie --   --zip "./assets/freebie.zip"   --cover "./assets/cover.jpg"   --category 15   --name "Super Freebie"   --slug "super-freebie"   --short "Kurzbeschreibung <strong>HTML</strong> erlaubt."   --long "<p>Lange Beschreibung …</p>"   --tags "freebie,download"
```

Die Kernlogik liegt in `src/agent/jobs/createFreebie.ts`.

---

## WordPress / WooCommerce Hinweise

- **Rollen:** REST + Medien-Upload + Produkt-Erstellung  
- **REST-Endpoints:**
  - Medien: `POST /wp-json/wp/v2/media`  
  - Produkt: `POST /wp-json/wc/v3/products`
- **Base-URL:**
  - Mit Permalinks: `https://example.com`  
  - Ohne Permalinks: `https://example.com/index.php`

---

## E2E-Test (Shop)

1. Freebie erzeugen
2. Produkt sichtbar? publish, Preis 0, downloadable
3. Checkout (0,00 €)
4. Download-Link in Bestellbestätigung
5. ZIP & Cover öffnen
6. Kategorie & Slug prüfen

---

## Troubleshooting

**401 Unauthorized:** Application Password oder Rolle prüfen  
**404 Not Found:** Base-URL korrekt? Kein doppeltes `/wp-json`  
**413 Payload Too Large:** PHP/NGINX Upload-Limits erhöhen  
**5xx / Timeout:** Server-Limits oder CDN? Keep-Alive aktiv  
**Linting:** `.eslintignore` löschen, `eslint.config.mjs` nutzen

---

## Sicherheit

- **DB-Pass rotieren** und `wp-config.php` aktualisieren
- **Application Password** neu erzeugen, alte deaktivieren
- **Woo CK/CS** neu generieren, alte revoken
- **WP Salts** erneuern
- **.env** nie ins Repo!

---

## Deployment (PM2)

```js
module.exports = {
  apps: [
    {
      name: "ki-agent",
      script: "node",
      args: "node_modules/tsx/dist/cli.mjs src/index.ts",
      env: {
        NODE_ENV: "production",
        JOB: "createFreebie",
        JOB_MODE: "interval",
        JOB_INTERVAL_MS: "900000"
      }
    }
  ]
};
```

Start:

```bash
pm2 start ecosystem.config.cjs
pm2 logs ki-agent
pm2 restart ki-agent
```

---

## Changelog / Contributing

- Lint-Regeln beibehalten (Pre-commit grün halten)  
- PRs mit sprechenden Commits  
- Keine Secrets in PRs oder Beispielen

---

## Dev-Tipps (Windows PowerShell)

```powershell
Set-Location C:\Entwicklung\neuer-git-ordner\ki
npm run lint -- --fix
Rename-Item eslint.config.js eslint.config.mjs
```

---

## Technikübersicht

- **`src/tools/wp.ts`** – Upload, Keep-Alive, Fehlertexte  
- **`src/agent/jobs/createFreebie.ts`** – strikte Typisierung, robustes Upload-Handling  
- **`src/agent/jobs/index.ts`** – Job-Bootstrap (once/interval), Logging
