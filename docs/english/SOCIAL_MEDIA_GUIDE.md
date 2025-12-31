# 📣 Social Media – Consolidated Guide & API

Version: 1.0.0
Last Updated: December 2025

---

## Overview

This document combines setup, permissions, environment variables, and test APIs for Facebook/Instagram (Meta) and TikTok.

- Meta: Facebook Page Posting, Instagram Business Publishing
- TikTok: Video Publishing via Business API

Complete flow: Developer Accounts → Create App → Permissions → OAuth/Token → Credentials in `.env` → Test APIs

---

## Setup – Meta (Facebook + Instagram)

1. Meta Developer Account: developers.facebook.com → My Apps → Create App (Business)
2. Settings → Basic: App ID, App Secret, App Domains (`kaufe-es.eu`), Website
3. Add Products:
   - Facebook Login → Valid OAuth Redirect URIs:
     - https://kaufe-es.eu/api/auth/facebook/callback
     - http://localhost:3000/api/auth/facebook/callback
   - Instagram → Link Business Account, Select Facebook Page
4. Request Permissions:
   - instagram_basic, instagram_content_publish
   - pages_read_engagement, pages_manage_posts
5. App Review: Explain purposes, Fill out forms, Await Approval
6. Generate Page Access Token (Graph API Explorer), Note Instagram Business Account ID

---

## Setup – TikTok for Business

1. developers.tiktok.com → My Apps → Create App
2. App Info: Name, Category (Marketing), Website
3. Credentials: Client Key, Client Secret
4. OAuth Redirect URI: https://kaufe-es.eu/api/auth/tiktok/callback
5. Scopes: user.info.basic, video.publish, video.list
6. Review with Description, Use Case, Screenshots

---

## Configuration – `.env` (Backend)

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
- OAUTH_CALLBACK_BASE_URL (e.g. https://kaufe-es.eu)

---

## Test APIs

Facebook Post:
curl -X POST http://localhost:3000/api/marketing/social/post -H "Content-Type: application/json" -d '{"platform":"facebook","message":"Test Post 🚀","link":"https://kaufe-es.eu"}'

Instagram Post:
curl -X POST http://localhost:3000/api/marketing/social/post -H "Content-Type: application/json" -d '{"platform":"instagram","caption":"New Product! 🛍️ #kaufees","image_url":"https://kaufe-es.eu/images/product.jpg"}'

TikTok Video:
curl -X POST http://localhost:3000/api/marketing/social/post -H "Content-Type: application/json" -d '{"platform":"tiktok","video_url":"https://kaufe-es.eu/videos/promo.mp4","caption":"Check out Kaufe.es! #shopping"}'

Notes:
- For Instagram, a publicly accessible image (`image_url`) is required.
- For TikTok, the video must comply with platform guidelines.

---

## Troubleshooting

- 401/403 with Meta: Check App Review, Permissions, and Token validity.
- Instagram Publish fails: Business Account linked? Correct Permissions? Image URL accessible?
- TikTok OAuth Error: Redirect URI exact as registered, Scopes set.
- Rate Limits: Check API responses, Implement Backoff/Retry.

---

## Next Steps

- Enter credentials, Restart backend, Run test posts.
- Integrate automatic Social Posting from product workflows.
- Use Logging/Alerts for failed publishes in `backend/error-handling`.

See also:
- docs/README.md → API Overview
- docs/TIKTOK_PROMPTS.md → Content Ideas
