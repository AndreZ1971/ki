# ⚙️ A.R.I. - Settings & Backend Handbook

**Version:** 1.0.0  
**Date:** January 2026  
**Target Audience:** Shop Owners who want to configure A.R.I.

> **Important:** This handbook explains how to **set up and configure A.R.I.** (Backend/Settings).  
> For how to use the **52 tools in the frontend**, see the **User Manual**.

---

## 📋 Table of Contents

1. [Connect WooCommerce](#connect-woocommerce)
2. [Configure OpenAI](#configure-openai)
3. [Upload Specializations](#upload-specializations)
4. [Understand Backend Dashboard](#understand-backend-dashboard)
5. [Understanding Agentic Loops](#understanding-agentic-loops)
6. [Security & Privacy](#security--privacy)
7. [Troubleshooting](#troubleshooting)

---

## 🏪 Connect WooCommerce

### How do I connect my WooCommerce store?

A.R.I. needs access to your WooCommerce store via **secure API keys**:

#### Step 1: Create WooCommerce Keys

1. Open your **WordPress Admin** (`https://your-shop.com/wp-admin`)
2. Go to **WooCommerce** → **Settings**
3. Click the **"Advanced"** tab → **"REST API"**
4. Click **"Add Key"**
5. Enter a name (e.g., "A.R.I. Integration")

#### Step 2: Set Permissions

| Permission | Required? | Reason |
|-----------|-----------|--------|
| **Read** | ✅ YES | To retrieve data (products, orders, customers) |
| **Write** | ✅ YES | To save changes (descriptions, prices) |
| **Delete** | ❌ NO | A.R.I. doesn't delete anything |

**Choose: "Read/Write"** and save.

#### Step 3: Copy Keys

After saving, you'll see two keys:
- **Consumer Key** (public)
- **Consumer Secret** (secret!)

```
🔐 SECURITY: Keep the Consumer Secret private!
Treat it like a password – never share it with anyone.
```

#### Step 4: Enter Keys in A.R.I.

1. Open **A.R.I. Settings** (⚙️ gear icon)
2. Go to section **"WooCommerce"**
3. Enter:
   - **Shop URL:** `https://your-shop.com` (exactly as your shop domain)
   - **Consumer Key:** (copied from WooCommerce)
   - **Consumer Secret:** (copied from WooCommerce)
4. Click **"Test Connection"**
5. ✅ Success? You're connected!

---

### Common WooCommerce Connection Issues

#### ❌ "REST API Not Reachable"

**Cause:** REST API is disabled

**Solution:**
1. WordPress Admin → **WooCommerce** → **Settings**
2. Tab **"Advanced"** → **"REST API"**
3. Check: Is "REST API enabled"? → **YES** check
4. Save

#### ❌ "401 Unauthorized"

**Cause:** Consumer Key or Secret is incorrect

**Solution:**
1. Delete the keys and create them **again**
2. Copy them **exactly** (no spaces)
3. Test again

#### ❌ "403 Forbidden"

**Cause:** Keys don't have correct permissions

**Solution:**
1. WordPress Admin → Edit keys
2. Set permissions to **"Read/Write"**
3. Save and copy keys again

---

## 🤖 Configure OpenAI

### Why do I need an OpenAI account?

A.R.I. uses OpenAI for all AI features:
- 📝 Text generation (product descriptions, emails)
- 🎨 Image generation (DALL-E)
- 📊 Data analysis (trends, sentiment)

**Cost:** You pay **only** for what you use (~0.002$ per text).

### Set Up OpenAI Account

#### Step 1: Create Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Click **"Sign Up"**
3. Register with email or Google/Microsoft account
4. Verify your email

#### Step 2: Add Credit

1. Go to **"Billing"** (left menu)
2. Click **"Set up paid account"**
3. Enter your payment details (credit card)
4. Set your **monthly limit** (e.g., $10)
   - This prevents accidental overspending!

#### Step 3: Create API Key

1. Go to **"API keys"** (left menu)
2. Click **"Create new secret key"**
3. **Copy** the key (begins with `sk-proj-`)
4. **Save it securely** (won't be visible again!)

#### Step 4: Enter API Key in A.R.I.

1. A.R.I. Settings → section **"OpenAI"**
2. Paste the API key
3. **Select the model:** `gpt-4o-mini` (fast & cheap)
4. Click **"Test Connection"**
5. ✅ Done!

---

### Understanding OpenAI Costs

**Price Examples:**

| Action | Cost |
|--------|------|
| 1 product description | ~$0.002 |
| 1000 product descriptions | ~$2 |
| 100 emails | ~$0.20 |
| 50 social media posts | ~$0.10 |
| 1 DALL-E image | ~$0.01 |

**Monthly:** For a small shop usually **under $5**

### Check OpenAI Credit

1. Go to [platform.openai.com](https://platform.openai.com)
2. Click **"Billing"** → **"Usage"**
3. You'll see:
   - Current credit balance
   - Usage for last days
   - Monthly projections

---

## 📦 Upload Specializations

### What are Specializations?

**Specializations** make the AI smarter for your industry:
- ✨ Better texts for your niche
- 🎯 Right keywords & focus
- 📈 Higher conversion rates

**Available Specializations:**
- ✈️ Travel Agency, 🏠 Real Estate, 🛠️ Tech
- 👗 Fashion, 🍕 Gastronomy, 💼 B2B
- 🎨 Creative Services, 🏋️ Fitness, 📚 Education
- 🏥 Healthcare & Pharmacy

### Activate Specialization

#### Step 1: Get Specialization File

1. Visit [marketplace.example.com](https://marketplace.example.com)
2. Choose your industry
3. Download the `.ari-spec` file
4. Save it on your computer

#### Step 2: Upload File

1. A.R.I. Settings → section **"Specializations"**
2. Click **"Upload File"** or drag & drop
3. System validates the signature (security)
4. ✅ File accepted?

#### Step 3: Activate

1. In the list, see your uploaded specializations
2. Click on your specialization
3. Click **"Activate"**
4. ✅ Done! The AI now adapts to your industry

### Use Multiple Specializations

**Yes, you can upload multiple – but only ONE can be active at a time!**

**Example:**
- You run a fashion store
- But you also want to sell travel products
- **Solution:**
  1. Upload both specializations (Fashion + Travel)
  2. Activate Fashion for normal work
  3. When doing travel products → switch to Travel
  4. When done?
  5. Switch back to Fashion

**Switching is possible anytime!**

---

## 📊 Understand Backend Dashboard

### Where is the Backend Dashboard?

The backend is **NOT** for daily use. It shows:
- 🔧 Configuration (WooCommerce, OpenAI, etc.)
- 📈 System metrics (logs, errors)
- ⚙️ Specializations
- 🔐 Security & access

**Important:** You use the **52 tools** in the **Frontend Dashboard** (User Manual).

### Settings Areas Explained

| Area | Shows | Editable? |
|------|-------|-----------|
| **WooCommerce** | Store connection | ✅ YES |
| **OpenAI** | AI configuration | ✅ YES |
| **Specializations** | Industry options | ✅ YES |
| **Security** | Access & logs | ❌ NO (info only) |
| **System** | Version, status | ❌ NO (info only) |
| **User** | Your account | ✅ Partly |

---

## � Understanding Agentic Loops

### What are Agentic Loops?

**Agentic Loops** are automated processes that analyze your shop data and suggest improvements:

- **🚨 Anomaly Detection** → Finds suspicious payments
- **📈 Product Performance** → Analyzes best/worst products
- **💳 Payment Recovery** → Rescues failed orders
- **📊 Analytics Insights** → Generates automatic reports

### How do the Loops work?

**The Loops are "Batch Processes"** – they don't run continuously, instead they perform a **discrete analysis session**:

```
1. SENSE    → Collect data (orders, payments, products)
2. THINK    → Analyze and make decisions
3. ACT      → Generate recommendations/actions
4. LEARN    → Save results and learn
5. STOP     → Loop is done
```

**Each iteration takes ~1 second.** With **5 iterations per run** = **~5 seconds total runtime**.

### "The Loop stops after a few seconds" – is this normal?

**YES! It's completely normal!** ✅

This is not a bug, it's **designed this way**:

| What | Why |
|------|-----|
| **5 iterations per run** | Efficient data processing (not running all the time) |
| **~5 seconds runtime** | Enough time for thorough analysis |
| **Then stop** | Loop has completed its job |
| **Next run via Cron** | Automatically at scheduled time |

**Comparison:** It's like a "maintenance task" that runs regularly, not like a server running 24/7.

### When do the Loops run automatically?

The Loops are **time-controlled via Cron**:

| Loop | Schedule |
|------|----------|
| **Anomaly Detection** | Daily 09:00 AM |
| **Product Performance** | Monday & Thursday 10:00 AM |
| **Payment Recovery** | Every 30 minutes |
| **Analytics Insights** | Daily 8:00 PM |

### Can I manually trigger a Loop?

**YES!** In the **Loop Monitoring Dashboard**:

1. Go to **Agent → Loop Monitoring**
2. Click **"Start Scheduler"**
3. The scheduler starts – all 4 loops run individually
4. Each loop runs ~5 seconds (5 iterations)
5. ✅ Done – results are saved

### What happens to the results?

**The Loops save:**
- ✅ Found anomalies/insights in database
- ✅ Recommendations for you
- ✅ Performance statistics
- ✅ Execution history (recent runs)

**You see the results in:**
- 📊 **Analytics Dashboard** (summaries)
- 🚨 **Anomaly Alerts** (if problems found)
- 📈 **Performance Reports** (best/worst products)
- 📋 **Loop History** (detailed log of all runs)

### Why not run continuously?

**Batch processes are better because:**

| Reason | Benefit |
|--------|---------|
| **Save resources** | Don't use CPU/memory all the time |
| **More cost-effective** | Fewer OpenAI API calls |
| **Clean analysis** | Each session is a complete analysis |
| **Easier to debug** | Clear start/end points |
| **Scalable** | Works even with thousands of products |

### I'm unsure – is everything really ok?

**Yes!** To reassure yourself, check the **Loop History**:

1. Go to **Agent → Loop Monitoring**
2. Scroll to **"Recent Executions"** (at bottom)
3. You'll see:
   - ✅ Status (success/failed)
   - ⏱️ Duration (~5 seconds = normal)
   - 📈 Iterations (5 = normal)
   - 💡 Insights generated

If you see **✅ success** and **~5 seconds** = **everything is running perfectly!**

---

## �🔐 Security & Privacy

### Is A.R.I. GDPR-compliant?

**Yes, 100%!**

✅ **Your data stays private:**
- Product data: In your WooCommerce store
- Customer data: In your WordPress database
- Configuration: Encrypted storage
- Logs: Auto-deleted after 7 days

✅ **OpenAI:** Does **NOT** use your data to train the AI

✅ **No tracking:** A.R.I. doesn't track your visitors

### Where are my API keys stored?

**Extremely secure:**

| What | Where | Secure? |
|-----|-------|---------|
| WooCommerce keys | Backend (disk) | ✅ Encrypted |
| OpenAI API key | Backend (disk) | ✅ Encrypted |
| Visible in frontend? | ❌ NO | ✅ Yes, safe |

### Rotate API Keys Regularly

**Recommendation:** Create new keys every 3-6 months

**Why?**
- If key was somehow compromised
- Security best practice
- Keeps your store secure

**How to:**
1. Create new key in WooCommerce/OpenAI
2. Enter in A.R.I. Settings
3. Delete old key (in WooCommerce/OpenAI)

---

## ❓ Troubleshooting

### WooCommerce Connection Fails

**❌ "Connection refused"**
- Check: Shop URL reachable? (`https://your-shop.com`)
- Check: REST API enabled?

**❌ "401 Unauthorized"**
- Consumer Key/Secret wrong?
- Create new ones and copy again

**❌ "404 Not Found"**
- Shop doesn't exist
- Check URL (e.g., not `https://www.your-shop.com/shop`, but `https://your-shop.com`)

---

### OpenAI Connection Fails

**❌ "Invalid API key"**
- Key copied incorrectly?
- Copy fresh from platform.openai.com

**❌ "Insufficient quota"**
- Credit used up
- Recharge on [platform.openai.com](https://platform.openai.com) → Billing

**❌ "Rate limit exceeded"**
- Too many requests at once
- Wait 60 seconds, try again

---

### Specialization Not Accepted

**❌ "Invalid signature"**
- Only original files from authorized marketplace work
- Download the file again

**❌ "File too large"**
- File is corrupted
- Download it again

---

### General Errors

**❌ "Test Connection Failed"**

**Step-by-step Debugging:**
1. Reload browser (F5)
2. Check all fields again (no typos)
3. If multiple fields: Test one at a time
4. Check logs (Settings → System → Logs)
5. Contact support

---

## 📞 Support

**Email:** support@example.com  
**Live Chat:** In frontend (bottom right)  
**Phone:** +49 XXX XXXXXXX (Business Hours)

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**For:** All A.R.I. Shop Owners
