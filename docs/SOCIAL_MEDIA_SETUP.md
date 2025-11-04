# 🚀 Social Media API Setup Guide

## 📋 Übersicht

Dieses Dokument führt dich Schritt-für-Schritt durch die Integration von:
- ✅ **Facebook Business** (742 Follower)
- ✅ **Instagram Business** (52 Follower)
- ✅ **TikTok Business** (2098 Follower)

**Gesamt-Reichweite: 2892 Follower**

---

## 1️⃣ Meta (Facebook + Instagram)

### Schritt 1: Meta Developer Account
1. Gehe zu: https://developers.facebook.com/
2. Klicke auf **"My Apps"**
3. Klicke auf **"Create App"**
4. Wähle **"Business"** als App-Typ
5. App-Name: `Kaufe.es Social Manager`
6. Contact Email: `info@kaufe-es.eu`
7. Business Account: Wähle dein Kaufe.es Business Account

### Schritt 2: Facebook Settings
1. In deiner neuen App → **"Settings" → "Basic"**
2. Notiere:
   - **App ID**: `___________________`
   - **App Secret**: (Click "Show") `___________________`
3. **App Domains**: `kaufe-es.eu`
4. **Website**: `https://kaufe-es.eu`

### Schritt 3: Facebook Graph API aktivieren
1. **"Add Product"** → **"Facebook Login"** → **"Set Up"**
2. **Valid OAuth Redirect URIs**:
   ```
   https://kaufe-es.eu/api/auth/facebook/callback
   http://localhost:3000/api/auth/facebook/callback
   ```
3. Save Changes

### Schritt 4: Instagram Graph API aktivieren
1. **"Add Product"** → **"Instagram"** → **"Set Up"**
2. In Instagram Settings:
   - Verknüpfe deinen Instagram Business Account (@kaufe.es)
   - Wähle deine Facebook Page (Kaufe.es)
3. **Permissions** hinzufügen:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_manage_posts`

### Schritt 5: App überprüfen lassen
1. **App Review** → **Permissions and Features**
2. Beantrage folgende Permissions:
   - `pages_manage_posts`
   - `instagram_content_publish`
   - `pages_read_engagement`
3. Fülle Fragebogen aus (warum du die API brauchst)
4. Warte auf Approval (1-3 Tage)

### Schritt 6: Access Token generieren
1. **Tools** → **Graph API Explorer**
2. Wähle deine App
3. **Permissions** auswählen:
   - `pages_manage_posts`
   - `instagram_content_publish`
4. **Generate Access Token**
5. Kopiere den **Page Access Token**
6. Notiere:
   - **Page Access Token**: `___________________`
   - **Instagram Business Account ID**: `___________________`

---

## 2️⃣ TikTok for Business

### Schritt 1: TikTok Developer Account
1. Gehe zu: https://developers.tiktok.com/
2. **Sign Up** mit deinem TikTok Business Account
3. Bestätige E-Mail

### Schritt 2: App erstellen
1. **"My Apps"** → **"Create App"**
2. App Information:
   - **App Name**: `Kaufe.es Social Manager`
   - **Category**: `Marketing & Advertising`
   - **Website**: `https://kaufe-es.eu`
3. Submit

### Schritt 3: Credentials holen
1. In deiner App → **"Basic Information"**
2. Notiere:
   - **Client Key**: `___________________`
   - **Client Secret**: (Click "Show") `___________________`

### Schritt 4: OAuth Settings
1. **"Manage Apps"** → Deine App → **"Basic Information"**
2. **Redirect URI**:
   ```
   https://kaufe-es.eu/api/auth/tiktok/callback
   ```
3. **Scopes** aktivieren:
   - `user.info.basic`
   - `video.publish`
   - `video.list`

### Schritt 5: Verifizierung
1. TikTok erfordert **App Review**
2. Fülle aus:
   - App Beschreibung
   - Use Case: "Social Media Management für E-Commerce"
   - Screenshots deiner App
3. Submit für Review (1-5 Tage)

---

## 3️⃣ Credentials in .env eintragen

Wenn du alle Credentials hast, trage sie in `backend/.env` ein:

```env
# --- Meta (Facebook + Instagram) ---
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
FACEBOOK_PAGE_ID=your_page_id_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_id_here

# --- TikTok ---
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=https://kaufe-es.eu/api/auth/tiktok/callback

# --- OAuth Callback URLs ---
OAUTH_CALLBACK_BASE_URL=https://kaufe-es.eu
```

---

## 4️⃣ Testing

### Test Facebook Post:
```bash
curl -X POST http://localhost:3000/api/marketing/social/post \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "message": "Test Post von Kaufe.es! 🚀",
    "link": "https://kaufe-es.eu"
  }'
```

### Test Instagram Post:
```bash
curl -X POST http://localhost:3000/api/marketing/social/post \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "caption": "Neues Produkt! 🛍️ #kaufees",
    "image_url": "https://kaufe-es.eu/images/product.jpg"
  }'
```

### Test TikTok Post:
```bash
curl -X POST http://localhost:3000/api/marketing/social/post \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "tiktok",
    "video_url": "https://kaufe-es.eu/videos/promo.mp4",
    "caption": "Check out Kaufe.es! #shopping"
  }'
```

---

## 🎯 Nächste Schritte

1. [ ] Meta Developer Account erstellen
2. [ ] Facebook App erstellen + Credentials notieren
3. [ ] Instagram Business Account verknüpfen
4. [ ] TikTok Developer Account + App erstellen
5. [ ] Alle Credentials in `.env` eintragen
6. [ ] Backend neu starten
7. [ ] Test-Posts durchführen

---

## 📞 Support

Bei Fragen oder Problemen:
- Meta Support: https://developers.facebook.com/support/
- TikTok Support: https://developers.tiktok.com/support
- Oder melde dich bei mir!

---

**Status:** 🟡 In Progress
**Letzte Aktualisierung:** 2. November 2025
