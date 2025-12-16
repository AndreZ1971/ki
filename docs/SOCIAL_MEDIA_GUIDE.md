# 📣 Social Media – Konsolidierte Anleitung & API

Version: 1.0.0
Letzte Aktualisierung: Dezember 2025

---

## Überblick

Dieses Dokument vereint Setup, Berechtigungen, Umgebungsvariablen und Test-APIs für Facebook/Instagram (Meta) und TikTok.

- Meta: Facebook Page Posting, Instagram Business Publishing
- TikTok: Video Publishing über Business API

Gesamtfluss: Entwickler-Konten → App anlegen → Berechtigungen → OAuth/Token → Credentials in `.env` → Test-APIs

---

## Setup – Meta (Facebook + Instagram)

1. Meta Developer Account: developers.facebook.com → My Apps → Create App (Business)
2. Settings → Basic: App ID, App Secret, App Domains (`kaufe-es.eu`), Website
3. Produkte hinzufügen:
   - Facebook Login → Valid OAuth Redirect URIs:
     - https://kaufe-es.eu/api/auth/facebook/callback
     - http://localhost:3000/api/auth/facebook/callback
   - Instagram → Business Account verknüpfen, Facebook Page auswählen
4. Permissions beantragen:
   - instagram_basic, instagram_content_publish
   - pages_read_engagement, pages_manage_posts
5. App Review: Gründe erläutern, Formulare ausfüllen, Approval abwarten
6. Page Access Token generieren (Graph API Explorer), Instagram Business Account ID notieren

---

## Setup – TikTok for Business

1. developers.tiktok.com → My Apps → Create App
2. App Infos: Name, Kategorie (Marketing), Website
3. Credentials: Client Key, Client Secret
4. OAuth Redirect URI: https://kaufe-es.eu/api/auth/tiktok/callback
5. Scopes: user.info.basic, video.publish, video.list
6. Review mit Beschreibung, Use Case, Screenshots

---

## Konfiguration – `.env` (Backend)

Meta (Facebook + Instagram):
- META_APP_ID
- META_APP_SECRET
- FACEBOOK_PAGE_ID
- FACEBOOK_PAGE_ACCESS_TOKEN
- INSTAGRAM_BUSINESS_ACCOUNT_ID

TikTok:
- TIKTOK_CLIENT_KEY
- TIKTOK_CLIENT_SECRET
- TIKTOK_REDIRECT_URI (https://kaufe-es.eu/api/auth/tiktok/callback)

Callbacks:
- OAUTH_CALLBACK_BASE_URL (z. B. https://kaufe-es.eu)

---

## Test-APIs

Facebook Post:
curl -X POST http://localhost:3000/api/marketing/social/post -H "Content-Type: application/json" -d '{"platform":"facebook","message":"Test Post 🚀","link":"https://kaufe-es.eu"}'

Instagram Post:
curl -X POST http://localhost:3000/api/marketing/social/post -H "Content-Type: application/json" -d '{"platform":"instagram","caption":"Neues Produkt! 🛍️ #kaufees","image_url":"https://kaufe-es.eu/images/product.jpg"}'

TikTok Video:
curl -X POST http://localhost:3000/api/marketing/social/post -H "Content-Type: application/json" -d '{"platform":"tiktok","video_url":"https://kaufe-es.eu/videos/promo.mp4","caption":"Check out Kaufe.es! #shopping"}'

Hinweise:
- Für Instagram ist ein öffentlich erreichbares Bild (`image_url`) erforderlich.
- Für TikTok muss das Video den Plattform-Richtlinien entsprechen.

---

## Troubleshooting

- 401/403 bei Meta: Prüfe App Review, Permissions und Token Gültigkeit.
- Instagram Publish schlägt fehl: Business Account verknüpft? Richtige Permissions? Bild-URL erreichbar?
- TikTok OAuth Fehler: Redirect URI exakt wie registriert, Scopes gesetzt.
- Rate Limits: API Antworten prüfen, Backoff/Retry implementieren.

---

## Nächste Schritte

- Credentials eintragen, Backend neu starten, Test-Posts durchführen.
- Automatisches Social Posting aus Produkt-Workflows integrieren.
- Logging/Alerts für fehlgeschlagene Publishes in `backend/error-handling` nutzen.

Siehe auch:
- docs/README.md → API-Übersicht
- docs/TIKTOK_PROMPTS.md → Content-Ideen
