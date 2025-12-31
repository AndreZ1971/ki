# FAQ – AI Agent Business Platform

**Current Version:** 3.2.0

Here you will find answers to the most frequently asked questions about using, setting up and troubleshooting the AI Agent Platform.

---

## ✨ New in v3.2.0

**What is Content Monetization?**
Content Monetization enables you to create and sell digital products. New are three AI features:
- **AI Price Suggestion**: Intelligent price recommendations based on product type & strategy
- **AI Product Text Generator**: Automatic generation of marketing texts (headline, body, CTA)
- **Revenue Forecast**: Forecast for weekly profits and monthly revenue

**How do I use the new AI features?**
Go to **Marketing & Content** → **Content Monetized**:
1. Fill in the product details
2. Optionally use the 🤖 **Price Suggestion** button
3. Optionally use the ⚡ **Generate AI Text** button
4. Click **💸 Monetize Content** to create

📖 **Complete Guide:** [Content Monetization Guide](./CONTENT_MONETIZATION_GUIDE.md)

---

## General

**What is the AI Agent Business Platform?**
The platform automates business processes with AI and offers tools for analysis, content, marketing and payment – all as a container solution, without source code installation.

**Do I need programming knowledge?**
No. The platform is designed for end users and is provided completely as a container.

---

## Setup & Start

**How do I start the system?**
  
1. Ensure Docker and Docker Compose are installed.
2. Place the `connection.json` in the main directory.
3. Start with `docker compose up -d`.
4. Open the frontend in your browser (`http://localhost:5173`).
  

**How do I import my credentials?**
Use the import function in the settings UI to upload `connection.json`. The fields will be filled automatically.

**What should I do if I have connection problems?**
  
- Check if all credentials are correct.
- Restart the containers.
- Check the logs with `docker compose logs`.
- Contact support if the problem persists.
  

---

## Usage & Features

**Which tools are included?**
  
- Analytics & reporting
- Content and email generators
- Social media automation
- Payment and shop health checks
- and much more (details see user guide)
  

**How can I use new features?**
All features are available directly in the frontend. Updates are provided automatically.

---

## Errors & Support

**What to do in case of errors or malfunctions?**
  
- Check logs (`docker compose logs`)
- Check settings
- Restart the system
- Contact support
  

**How do I receive updates?**
Updates are installed automatically via container update (Watchtower).
  
**Where can I find more help?**
  
- User guide in the `docs` folder
- Support contact in the frontend
- More documentation under `/docs`
  
---
  
Last updated: December 2025
