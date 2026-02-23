# 🌀 Social Media API Onboarding Guide

Dieses Dokument dient als technischer Leitfaden für die Einrichtung von API-Schnittstellen, um automatisierte Beiträge auf den wichtigsten Social-Media-Plattformen zu veröffentlichen.

---

## 🔗 1. LinkedIn (Professional Networking)
**Ziel:** Beiträge im Namen eines Nutzers oder einer Organisation teilen.

### Vorgehensweise:
1.  **Portal:** Gehe zu [LinkedIn Developers](https://www.linkedin.com/developers/).
2.  **App Setup:** Erstelle eine App und verknüpfe sie mit einer verifizierten Unternehmensseite.
3.  **Produkte:** Füge das Produkt **"Share on LinkedIn"** hinzu.
4.  **Auth-Konfiguration:** Hinterlege eine `Redirect URL` (z.B. `http://localhost:3000`).
5.  **Token-Erhalt:**
    * Nutze den [OAuth Token Generator](https://www.linkedin.com/developers/tools/oauth).
    * Wähle den Scope `w_member_social`.
    * Klicke auf "Request Access Token".

---

## 🎵 2. TikTok (Text-Generierung)

**Status:** TikTok wird aktuell nur für KI-Text-Generierung verwendet. Videos können per Copy-to-Clipboard exportiert werden.

### Funktionsweise:
1. **Text-Generierung:** A.R.I. generiert automatisch viral-optimierte TikTok-Captions
2. **Export-Button:** "📋 Copy" kopiert den Text in die Zwischenablage
3. **Manuelle Veröffentlichung:** Nutzer öffnet TikTok-App und veröffentlicht manuell
4. **Keine API-Limits:** Keine OAuth-Konfiguration erforderlich

### Warum Copy-to-Clipboard?
- TikTok API erfordert separate Subdomain-Registrierung pro Shop (unscalable)
- Copy-to-Clipboard ist zuverlässig und limitierungslos
- Nutzer behält volle Kontrolle über Veröffentlichung

---

## 📸 3. Instagram (Text-Generierung)

**Status:** Instagram wird aktuell nur für KI-Text-Generierung verwendet. Inhalte können per Copy-to-Clipboard exportiert werden.

### Funktionsweise:
1. **Text-Generierung:** A.R.I. generiert automatisch engagement-optimierte Instagram-Captions mit Hashtags
2. **Export-Button:** "📋 Copy" kopiert den Text in die Zwischenablage
3. **Manuelle Veröffentlichung:** Nutzer öffnet Instagram-App und veröffentlicht manuell
4. **Keine API-Limits:** Keine OAuth-Konfiguration erforderlich

### Warum Copy-to-Clipboard?
- Instagram API erfordert Business Account + Facebook Page Verknüpfung + App Review (3-6 Monate)
- Meta App Review Prozess ist komplex und zeitaufwändig für Endkunden
- Copy-to-Clipboard ist zuverlässig und ohne Wartezeit verfügbar
- Nutzer behält volle Kontrolle über Veröffentlichung

---

## 🐦 4. X (Twitter)
**Ziel:** Textbasierte Posts und Medienteilung.

### Vorgehensweise:
1.  **Portal:** Melde dich im [X Developer Portal](https://developer.x.com/) an.
2.  **Berechtigungen:** Gehe zu den App-Einstellungen -> "User authentication settings". Ändere die App-Berechtigung von "Read" auf **"Read and Write"**.
3.  **App-Info:** Hinterlege zwingend eine Website-URL und eine Callback-URL.
4.  **Keys & Tokens:**
    * Generiere unter "Keys and Tokens" den `API Key`, `API Key Secret`.
    * Generiere den `Access Token` und das `Access Token Secret`.
5.  **API Version:** Stelle sicher, dass dein Code die **v2 API** (`/2/tweets`) anspricht.

---

## 💙 5. Facebook (Pages)
**Ziel:** Status-Updates und Medien auf Unternehmensseiten posten.

### Vorgehensweise:
1.  **Portal:** [Meta Developer Portal](https://developers.facebook.com/).
2.  **Scopes:** Füge `pages_manage_posts` und `pages_read_engagement` hinzu.
3.  **Token-Erhalt:**
    * Öffne den **Graph API Explorer**.
    * Wähle unter "User or Page" die spezifische Facebook-Seite aus.
    * Generiere den **Page Access Token**.
4.  **Permanenz:** Tausche den User-Token in einen langlebigen Token um, damit der Page-Token seine Gültigkeit nicht verliert.

---

## 🎥 6. YouTube (Video Content)
**Ziel:** Video-Uploads, Auto-Metadaten-Generierung und Kanal-Management.

### Vorgehensweise:
1.  **Portal:** [Google Cloud Console](https://console.cloud.google.com/).
2.  **API:** Aktiviere die **"YouTube Data API v3"**.
3.  **OAuth Screen:** Richte den OAuth-Zustimmungsbildschirm ein und füge deine E-Mail als Test-Nutzer hinzu.
4.  **Credentials:** Erstelle eine "OAuth 2.0 Client ID" für eine Desktop-Anwendung.
5.  **Redirect URI (WICHTIG!):** Trage in den OAuth-Credentials ein:
    * `http://localhost:3000` (für lokale Entwicklung)
    * `https://deine-domain.com` (für Production)
6.  **Token-Erhalt:**
    * Nutze den [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
    * Scope: `https://www.googleapis.com/auth/youtube.force-ssl`.
    * Klicke auf "Authorize" und tausche den Code gegen den `Access Token` und den **`Refresh Token`** aus.

### 🆕 YouTube Video Upload (Phase 1 - Phase 2 folgt)
**Neu in 1.0.0:**
- **Video Upload**: Lade Videos direkt aus der Social Media Poster UI hoch
- **Auto-Metadaten**: Titel, Tags und Beschreibung werden automatisch aus deinem Content generiert
- **Video-Validierung**: Unterstützte Formate (MP4, MOV, AVI, etc.)
- **Resumable Upload**: Große Dateien in Chunks hochladen

**Konfiguration** (in `connection.json`):
```json
{
  "youtube": {
    "enabled": true,
    "clientId": "deine-client-id.apps.googleusercontent.com",
    "clientSecret": "dein-client-secret",
    "redirectUri": "http://localhost:3000",
    "accessToken": "wird-automatisch-gespeichert",
    "refreshToken": "wird-automatisch-gespeichert",
    "channelId": "wird-automatisch-gespeichert"
  }
}
```

**Metadata-Auto-Generierung**:
- **Titel**: Erste Zeile deines Content-Textes
- **Tags**: Automatisch extrahierte Hashtags aus dem Text
- **Beschreibung**: Vollständiger Content-Text

**Besonderheiten**:
- Phase 1: Manuelle Text-Eingabe + Video-Upload
- Phase 2 (geplant): Auto-Generierung von Videos aus Text + AI Video-Editing

---
## Aktualisiert am: 18. Januar 2026