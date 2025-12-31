# 🎉 Make.com Setup - 1000 Operations FREE!

**Problem:** Zapier Free is not really free (only 5 Zaps)  
**Solution:** **Make.com (formerly Integromat)** - **1000 Ops/Month FREE!** 🎉

## 🚀 Why Make.com?

- 🎉 **1000 operations FREE** - that’s ~33 posts per day!
- ✅ **Visual editor** - drag & drop, no code
- ✅ **All platforms** - LinkedIn, Facebook, Instagram, TikTok
- ✅ **Available immediately** - no waiting
- ✅ **More powerful** than Zapier Free

## ⏱️ Setup in 3 Minutes

### 1. Create Make.com Account

1. Go to: https://www.make.com/en/register
2. **Sign up for free** (FREE Plan: 1000 Ops/Month!)
3. Confirm email
4. Let's go!

### 2. Create Scenario for LinkedIn

#### Step 1: New scenario

1. Click **"Create a new scenario"**
2. Enter a name: "LinkedIn Poster - Kaufe.es"

#### Step 2: Webhook trigger

1. Click the **"+"** icon
2. Search for **"Webhooks"**
3. Choose **"Custom webhook"**
4. Click **"Add"** → name it: "LinkedIn Webhook"
5. **Copy the webhook URL!**
   ```
   Example: https://hook.eu1.make.com/abc123xyz456
   ```
6. Click **"OK"**

#### Step 3: LinkedIn action

1. Click the **"+"** after the webhook
2. Search for **"LinkedIn"**
3. Choose **"Create a Share Update"**
4. **Create connection**:
   - Click "Add"
   - Authorize LinkedIn (with your business account!)
5. **Configure**:
   - **Text**: click the field and choose `content` (from the webhook)
   - **Visibility**: `CONNECTIONS` or `PUBLIC`
6. Click **OK**

#### Step 4: Test & activate

1. Click **"Run once"** (bottom left)
2. Send test request (see below)
3. Check LinkedIn - do you see the test post? ✅
4. Click **"Scheduling"** → "ON" (activate scenario!)

#### Step 5: Save webhook URL

Add the webhook URL to `.env`:

```env
WEBHOOK_LINKEDIN=https://hook.eu1.make.com/abc123xyz456
```

### 3. Create scenario for Facebook

**Repeat steps 1-5, but:**

- **Scenario name**: "Facebook Poster - Kaufe.es"
- **Action**: search "Facebook Pages"
- **Module**: "Create a Post"
- **Page**: choose your Kaufe.es page (742 followers)
- **Message**: choose `content` from the webhook

```env
WEBHOOK_FACEBOOK=https://hook.eu1.make.com/def789ghi012
```

### 4. TikTok scenario (optional)

**Unfortunately:** TikTok isn’t directly available in Make.com.

**Workaround:**
- Use Buffer API later (awaiting approval)
- Or: Make.com → Email → post manually to TikTok

```env
# TikTok commented out for now
# WEBHOOK_TIKTOK=
```

### 5. Restart server

```bash
cd backend
npm run build
npm run dev
```

✅ Check output:
```
✅ Webhook routes registered successfully
```

---

## 🧪 Test commands

### Test webhook status

```bash
curl http://localhost:3000/api/social/webhook/status
```

**Expected response:**
```json
{
  "success": true,
  "webhooks": {
    "linkedin": true,
    "facebook": true,
    "tiktok": false
  },
  "configured": 2,
  "total": 3,
  "message": "✅ 2/3 webhooks configured!"
}
```

### Test LinkedIn webhook

```bash
curl -X POST "http://localhost:3000/api/social/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{"platform": "linkedin"}'
```

**What happens:**
1. Backend sends test to Make.com
2. Make.com receives webhook
3. Make.com posts to LinkedIn
4. You see a test post! 🎉

### Real LinkedIn post

```bash
curl -X POST "http://localhost:3000/api/social/webhook/post" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linkedin",
    "content": "🚀 Professional e-commerce solutions at Kaufe.es! #business #ecommerce",
    "scheduleTime": "now"
  }'
```

### Real Facebook post

```bash
curl -X POST "http://localhost:3000/api/social/webhook/post" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "content": "🛍️ New products in the shop! Check out Kaufe.es 🚀",
    "scheduleTime": "now"
  }'
```

---

## 📊 Make.com vs. Zapier vs. Buffer

| Feature | Make.com FREE | Zapier FREE | Buffer API |
|---------|---------------|-------------|------------|
| **Cost** | 🎉 **€0** | 💰 Only 5 Zaps | ⏳ Waiting |
| **Operations** | 🎉 **1000/month** | 💔 Only 100/month | ⏳ Waiting |
| **LinkedIn** | ✅ Immediate | ✅ Limited | ⏳ Waiting |
| **Facebook** | ✅ Immediate | ✅ Limited | ⏳ Waiting |
| **Editor** | ✅ Visual + advanced | ✅ Simple | - |
| **Waiting time** | ⚡ 0 minutes | ⚡ 0 minutes | ⏳ Days |

**Make.com = BEST free solution!** 🎉

---

## 🔥 Make.com visualization

```
┌─────────────────┐
│  Your Backend   │
│   (Node.js)     │
└────────┬────────┘
         │ HTTP POST
         │ {platform, content}
         ↓
┌─────────────────┐
│  Make.com Hook  │
│  hook.make.com  │
└────────┬────────┘
         │ Trigger
         │
    ┌────┴─────┐
    │ Scenario │
    └────┬─────┘
         │ Action
    ┌────┴────────────┐
    │                 │
    ↓                 ↓
┌────────┐      ┌──────────┐
│LinkedIn│      │ Facebook │
└────────┘      └──────────┘
   (Post)          (Post)
```

---

## 🎨 Frontend features

- **Badge**: "🎉 Make.com (1000 FREE!)"
- **Status**: "✅ 2/3 webhooks configured"
- **Toggle**: Make.com ↔ Buffer
- **"🔗 Connect"** opens Make.com dashboard

---

## 💡 Pro tips

### Make.com free plan details

- **1000 operations/month** = ~33 posts per day
- **2 active scenarios** (enough for LinkedIn + Facebook!)
- **5 MB data storage**
- **15-minute interval** (for scheduled scenarios)

### Upgrade only if needed

- **Core**: $9/month = 10,000 ops
- **Pro**: $16/month = 10,000 ops + more features

### Multi-platform posting

Create a **single scenario** with multiple actions:
1. Webhook trigger
2. Action 1: LinkedIn post
3. Action 2: Facebook post
4. Action 3: Email notification

→ One webhook posts to BOTH platforms! 🚀

### Images & videos

Make.com supports:
- **Images**: JPG, PNG - via `mediaUrl` parameter
- **Videos**: MP4 - for Facebook
- **Links**: automatic preview

```json
{
  "platform": "facebook",
  "content": "New product! 🛍️",
  "mediaUrl": "https://kaufe-es.eu/images/product.jpg"
}
```

---

## ❌ Troubleshooting

### "No webhook configured for LINKEDIN"

→ Add `WEBHOOK_LINKEDIN=...` to `backend/.env`

### Webhook doesn’t work

→ Check Make.com dashboard:
- Is the scenario **ON** (scheduling active)?
- Webhook URL copied correctly?
- **Execution History** → any errors shown?

### Post doesn’t appear

→ Make.com dashboard → **Execution History**:
- Click the latest execution
- Do you see green ✅ on all modules?
- Errors? Then reconnect LinkedIn connection

### "Operations limit reached"

→ You used 1000 operations:
- Wait until next month (reset)
- Or upgrade to Core plan

---

## 🎉 Done!

You now have:

- ✅ **LinkedIn posting** - 1000 posts/month FREE!
- ✅ **Facebook posting** - reach your 742 followers!
- ✅ **Visual editor** - easy to adjust
- ⏳ **TikTok** - comes later via Buffer

### What’s next?

1. **Open frontend**: http://localhost:5174/marketing/social-poster
2. Click **toggle to "🎉 Make.com"**
3. Create your **first real post**!
4. Check **Make.com dashboard** → Execution History

**Make.com = perfect free solution!** 🎉

### Waiting for Buffer email?

Just switch toggle to "⏳ Buffer" - TikTok will then work too!

**Good luck posting! 🚀**
