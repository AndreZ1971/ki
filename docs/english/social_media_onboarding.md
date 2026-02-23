# 🌀 Social Media API Onboarding Guide

This document serves as a technical guide for setting up API interfaces to publish automated posts on the major social media platforms.

---

## 🔗 1. LinkedIn (Professional Networking)
**Goal:** Share posts on behalf of a user or organization.

### Procedure:
1.  **Portal:** Go to [LinkedIn Developers](https://www.linkedin.com/developers/).
2.  **App Setup:** Create an app and link it to a verified company page.
3.  **Products:** Add the **"Share on LinkedIn"** product.
4.  **Auth Configuration:** Set a `Redirect URL` (e.g., `http://localhost:3000`).
5.  **Obtain Token:**
    * Use the [OAuth Token Generator](https://www.linkedin.com/developers/tools/oauth).
    * Select the scope `w_member_social`.
    * Click "Request Access Token".

---

## 🎵 2. TikTok (Text Generation)

**Status:** TikTok is currently only used for AI text generation. Videos can be exported via copy-to-clipboard.

### How it works:
1. **Text Generation:** A.R.I. automatically generates viral-optimized TikTok captions
2. **Export Button:** "📋 Copy" copies the text to clipboard
3. **Manual Publishing:** User opens TikTok app and publishes manually
4. **No API Limits:** No OAuth configuration required

### Why Copy-to-Clipboard?
- TikTok API requires separate subdomain registration per shop (unscalable)
- Copy-to-Clipboard is reliable and without limitations
- User maintains full control over publishing

---

## 📸 3. Instagram (Text Generation)

**Status:** Instagram is currently only used for AI text generation. Content can be exported via copy-to-clipboard.

### How it works:
1. **Text Generation:** A.R.I. automatically generates engagement-optimized Instagram captions with hashtags
2. **Export Button:** "📋 Copy" copies the text to clipboard
3. **Manual Publishing:** User opens Instagram app and publishes manually
4. **No API Limits:** No OAuth configuration required

### Why Copy-to-Clipboard?
- Instagram API requires Business Account + Facebook Page linking + App Review (3-6 months)
- Meta App Review process is complex and time-consuming for end customers
- Copy-to-Clipboard is reliable and available without waiting
- User maintains full control over publishing

---

## 🐦 4. X (Twitter)
**Goal:** Text-based posts and media sharing.

### Procedure:
1.  **Portal:** Sign in at [X Developer Portal](https://developer.x.com/).
2.  **Permissions:** Go to App Settings → "User authentication settings". Change app permission from "Read" to **"Read and Write"**.
3.  **App Info:** Mandatory: add a Website URL and Callback URL.
4.  **Keys & Tokens:**
    * Generate the `API Key`, `API Key Secret` under "Keys and Tokens".
    * Generate the `Access Token` and `Access Token Secret`.
5.  **API Version:** Ensure your code uses the **v2 API** (`/2/tweets`).

---

## 💙 5. Facebook (Pages)
**Goal:** Post status updates and media on business pages.

### Procedure:
1.  **Portal:** [Meta Developer Portal](https://developers.facebook.com/).
2.  **Scopes:** Add `pages_manage_posts` and `pages_read_engagement`.
3.  **Obtain Token:**
    * Open the **Graph API Explorer**.
    * Select the specific Facebook Page under "User or Page".
    * Generate the **Page Access Token**.
4.  **Permanence:** Exchange the User Token for a long-lived token so the Page Token doesn't lose validity.

---

## 🎥 6. YouTube (Video Content)
**Goal:** Video uploads, auto-metadata generation, and channel management.

### Procedure:
1.  **Portal:** [Google Cloud Console](https://console.cloud.google.com/).
2.  **API:** Enable the **"YouTube Data API v3"**.
3.  **OAuth Screen:** Set up the OAuth consent screen and add your email as a test user.
4.  **Credentials:** Create an "OAuth 2.0 Client ID" for a desktop application.
5.  **Redirect URI (IMPORTANT!):** Enter in your OAuth credentials:
    * `http://localhost:3000` (for local development)
    * `https://your-domain.com` (for production)
6.  **Obtain Token:**
    * Use the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
    * Scope: `https://www.googleapis.com/auth/youtube.force-ssl`.
    * Click "Authorize" and exchange the code for the `Access Token` and **`Refresh Token`**.

### 🆕 YouTube Video Upload (Phase 1 - Phase 2 coming)
**New in v6.3:**
- **Video Upload**: Upload videos directly from the Social Media Poster UI
- **Auto-Metadata**: Title, tags, and description are automatically generated from your content
- **Video Validation**: Supported formats (MP4, MOV, AVI, etc.)
- **Resumable Upload**: Upload large files in chunks

**Configuration** (in `connection.json`):
```json
{
  "youtube": {
    "enabled": true,
    "clientId": "your-client-id.apps.googleusercontent.com",
    "clientSecret": "your-client-secret",
    "redirectUri": "http://localhost:3000",
    "accessToken": "auto-saved",
    "refreshToken": "auto-saved",
    "channelId": "auto-saved"
  }
}
```

**Metadata Auto-Generation**:
- **Title**: First line of your content text
- **Tags**: Automatically extracted hashtags from your text
- **Description**: Full content text

**Highlights**:
- Phase 1: Manual text input + video upload
- Phase 2 (planned): Auto-generate videos from text + AI video editing

---
## Updated on: January 18, 2026
