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

## 🎵 2. TikTok (Short-form Video)
**Goal:** Direct publishing of videos to user feed.

### Procedure:
1.  **Portal:** Register at [TikTok for Developers Portal](https://developers.tiktok.com/).
2.  **App Creation:** Create a new app and add the **"Content Posting API"**.
3.  **Review Process:** Fill out required information and submit the app for review.
4.  **Scopes:** Ensure `video.publish` is enabled.
5.  **Obtain Token:**
    * Execute the OAuth flow: Redirect user to TikTok auth page.
    * Exchange the `Authorization Code` for an `Access Token` and `Refresh Token`.

---

## 📸 3. Instagram (Visual Media)
**Goal:** Automated posting of images, Reels, and carousels.

### Procedure:
1.  **Prerequisite:** Instagram Business/Creator Account + link to Facebook Page.
2.  **Portal:** Use the [Meta Developer Portal](https://developers.facebook.com/).
3.  **App Type:** Select "Business" and add **"Instagram Graph API"**.
4.  **Scopes:** You need `instagram_basic` and `instagram_content_publish`.
5.  **Obtain Token:**
    * Generate a User Token in the **Graph API Explorer**.
    * Select your Instagram ID.
    * Extend the token via the Access Token Tool to a **Long-lived Token** (60 days).

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
**Goal:** Video uploads and channel management.

### Procedure:
1.  **Portal:** [Google Cloud Console](https://console.cloud.google.com/).
2.  **API:** Enable the **"YouTube Data API v3"**.
3.  **OAuth Screen:** Set up the OAuth consent screen and add your email as a test user.
4.  **Credentials:** Create an "OAuth 2.0 Client ID" for a desktop application.
5.  **Obtain Token:**
    * Use the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
    * Scope: `https://www.googleapis.com/auth/youtube.force-ssl`.
    * Click "Authorize" and exchange the code for the `Access Token` and **`Refresh Token`**.

---
## Created on: December 22, 2025
