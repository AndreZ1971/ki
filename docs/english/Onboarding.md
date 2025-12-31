# Onboarding – Settings for Your AI Agent

**Version:** 5.0.0-alpha (Alpha-Container MVP)

Welcome! Here you'll learn how to set up your AI agent as a shop owner for the first time. You don't need any technical knowledge – everything runs directly in the browser.

---

## 🎯 Quick Start

1. **Open Frontend**: `https://my-working-space.de` (Production) or `http://localhost:5173` (Development)
2. **Fill in Settings**: Shop URL, WooCommerce keys, OpenAI API Key
3. **Test Connection**: "Test Connection" button saves and validates settings
4. **Use Dashboard Immediately**: Changes become active **without restart**! 🚀
5. **Test First Tools**: Try e.g. "Shop Metrics" or "Product Analysis"

> 🆕 **New in v5.0.0-alpha**: Settings are loaded dynamically - no more container restarts needed!

---

## 1. Open Settings

After activating your agent, you'll receive a link to your personal agent interface.

1. Open the link in your browser.
2. Log in with your credentials if necessary.
3. Click on "Settings" in the menu.

---

## 2. Enter Credentials

Fill in all fields on the settings page carefully:

- OpenAI API Key (if provided)
- Shop URL and credentials (e.g. WooCommerce)
- Email configuration (for notifications)
- Additional fields as needed (e.g. Analytics, Social Media)

Note: Most credentials can be obtained directly from Woo or your support team.

---

## 3. Save Settings

Click on "Test Connection". The system:
1. **Saves** all settings in `connection.json`
2. **Validates** WordPress & WooCommerce connection
3. **Activates** the configuration **immediately** (no restart!)

On success, you'll see:
- ✅ WordPress test successful
- ✅ WooCommerce test successful

In case of errors, you'll receive feedback on what's missing or incorrect.

> ⚡ **Alpha-Container Design**: On container restart, placeholders are restored. Simply save settings again or import JSON!

### Validation Rules (important for initial setup)

- WordPress, WooCommerce, OpenAI are each optional. If you fill in one field of a group, the remaining required fields of that group must also be correct (otherwise you'll get a clear error message).
- Job settings: `Job Mode` can be "one-time" or "interval".
	- For "one-time", `Job Interval` is ignored.
	- For "interval", `Job Interval (ms)` must be in the range of 10 seconds to 24 hours.
- The Settings API will show you in case of error which field and which rule is affected.

---

## 4. Use the System

After successful setup, you can use all functions of your agent directly in the browser – e.g. analytics, content generators, shop checks and more.

---

## 5. Help & Support

If you have questions or problems, you can find help in the "Troubleshooting" menu item or in the FAQ. Support is available to you at any time.

---

> **Note:** This guide will later be supplemented with images to make each step even clearer.

---

## 6. Security & Independence (The Speedboat Principle)

We know how important your shop is. That's why the AI agent was built to work **non-invasively**.

- **Your shop belongs to you:** The agent controls the shop only through official interfaces (API), it doesn't modify any program code.
- **No risk:** Should you ever deactivate or pause the agent, your shop will immediately continue running normally.
- **The analogy:** Imagine your shop as a boat. The AI agent is a powerful outboard motor that turns it into a speedboat. If you remove the motor, the boat doesn't sink – it simply becomes a rowboat again. You retain full control.

---

Last updated: December 2025
