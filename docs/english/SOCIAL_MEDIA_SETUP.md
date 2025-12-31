# 🚀 Social Media API Setup – Deprecated (consolidated)

This file is deprecated. The consolidated and current guide including setup & API can be found in:

- SOCIAL_MEDIA_GUIDE.md

—

Original content follows below for reference.

## 📋 Overview

This document guides you step-by-step through the integration of:
- ✅ **Facebook Business** (742 followers)
- ✅ **Instagram Business** (52 followers)
- ✅ **TikTok Business** (2098 followers)

**Total Reach: 2892 followers**

---

## 1️⃣ Meta (Facebook + Instagram)

### Step 1: Meta Developer Account
1. Go to: https://developers.facebook.com/
2. Click on **"My Apps"**
3. Click on **"Create App"**
4. Choose **"Business"** as app type
5. App Name: `Kaufe.es Social Manager`
6. Contact Email: `info@kaufe-es.eu`
7. Business Account: Select your Kaufe.es Business Account

### Step 2: Facebook Settings
1. In your new app → **"Settings" → "Basic"**
2. Note down:
   - **App ID**: `___________________`
   - **App Secret**: (Click "Show") `___________________`
3. **App Domains**: `kaufe-es.eu`
4. **Website**: `https://kaufe-es.eu`

### Step 3: Activate Facebook Graph API
1. **"Add Product"** → **"Facebook Login"** → **"Set Up"**
2. **Valid OAuth Redirect URIs**:
   ```
   https://kaufe-es.eu/api/auth/facebook/callback
   http://localhost:3000/api/auth/facebook/callback
   ```
3. Save Changes

### Step 4: Activate Instagram Graph API
1. **"Add Product"** → **"Instagram"** → **"Set Up"**
2. In Instagram Settings:
   - Link your Instagram Business Account (@kaufe.es)
   - Select your Facebook Page (Kaufe.es)
3. Add **Permissions**:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_manage_posts`

### Step 5: Get App Reviewed
1. **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `pages_manage_posts`
   - `instagram_content_publish`
   - `pages_read_engagement`
3. Fill out questionnaire (why you need the API)
4. Wait for approval (1-3 days)

### Step 6: Generate Access Token
1. **Tools** → **Graph API Explorer**
2. Select your app
3. Select **Permissions**:
   - `pages_manage_posts`
   - `instagram_content_publish`
4. **Generate Access Token**
5. Copy the **Page Access Token**
6. Note down:
   - **Page Access Token**: `___________________`
   - **Instagram Business Account ID**: `___________________`

---

## 2️⃣ TikTok for Business

### Step 1: TikTok Developer Account
1. Go to: https://developers.tiktok.com/
2. **Sign Up** with your TikTok Business Account
3. Confirm email

### Step 2: Create App
1. **"My Apps"** → **"Create App"**
2. App Information:
   - **App Name**: `Kaufe.es Social Manager`
   - **Category**: `Marketing & Advertising`
   - **Website**: `https://kaufe-es.eu`
3. Submit

### Step 3: Get Credentials
1. In your app → **"Basic Information"**
2. Note down:
   - **Client Key**: `___________________`
   - **Client Secret**: (Click "Show") `___________________`

### Step 4: OAuth Settings
1. **"Manage Apps"** → Your App → **"Basic Information"**
2. **Redirect URI**:
   ```
   https://kaufe-es.eu/api/auth/tiktok/callback
   ```
3. Activate **Scopes**:
   - `user.info.basic`
   - `video.publish`
   - `video.list`

### Step 5: Verification
1. TikTok requires **App Review**
2. Fill out:
   - App Description
   - Use Case: "Social Media Management for E-Commerce"
   - Screenshots of your app
3. Submit for Review (1-5 days)

---

## 3️⃣ Enter Credentials in .env

Once you have all credentials, enter them in `backend/.env`:

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
    "message": "Test Post from Kaufe.es! 🚀",
    "link": "https://kaufe-es.eu"
  }'
```

### Test Instagram Post:
```bash
curl -X POST http://localhost:3000/api/marketing/social/post \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "caption": "New Product! 🛍️ #kaufees",
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

## 🎯 Next Steps

1. [ ] Create Meta Developer Account
2. [ ] Create Facebook App + note credentials
3. [ ] Link Instagram Business Account
4. [ ] Create TikTok Developer Account + App
5. [ ] Enter all credentials in `.env`
6. [ ] Restart backend
7. [ ] Perform test posts

---

## 📞 Support

For questions or issues:
- Meta Support: https://developers.facebook.com/support/
- TikTok Support: https://developers.tiktok.com/support
- Or contact me!

---

**Status:** 🟡 In Progress
**Last Update:** November 2, 2025
