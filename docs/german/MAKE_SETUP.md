# 🎉 Make.com Setup - 1000 Operations KOSTENLOS!

**Problem:** Zapier Free ist nicht wirklich kostenlos (nur 5 Zaps)  
**Lösung:** **Make.com (früher Integromat)** - **1000 Ops/Monat GRATIS!** 🎉

## 🚀 Warum Make.com?

- 🎉 **1000 Operations GRATIS** - Das sind ~33 Posts pro Tag!
- ✅ **Visueller Editor** - Drag & Drop, kein Code
- ✅ **Alle Plattformen** - LinkedIn, Facebook, Instagram, TikTok
- ✅ **Sofort verfügbar** - Keine Wartezeit
- ✅ **Leistungsstärker** als Zapier Free

## ⏱️ Setup in 3 Minuten

### 1. Make.com Account erstellen

1. Gehe zu: https://www.make.com/en/register
2. **Kostenlos anmelden** (FREE Plan: 1000 Ops/Monat!)
3. Email bestätigen
4. Los geht's!

### 2. Scenario für LinkedIn erstellen

#### Schritt 1: Neues Scenario

1. Klicke **"Create a new scenario"**
2. Gib einen Namen ein: "LinkedIn Poster - Kaufe.es"

#### Schritt 2: Webhook Trigger

1. Klicke auf das **"+"** Symbol
2. Suche nach **"Webhooks"**
3. Wähle **"Custom webhook"**
4. Klicke **"Add"** → Gib einen Namen: "LinkedIn Webhook"
5. **Kopiere die Webhook URL!**
   ```
   Beispiel: https://hook.eu1.make.com/abc123xyz456
   ```
6. Klicke **"OK"**

#### Schritt 3: LinkedIn Action

1. Klicke auf das **"+"** nach dem Webhook
2. Suche nach **"LinkedIn"**
3. Wähle **"Create a Share Update"**
4. **Connection erstellen**:
   - Klicke "Add"
   - LinkedIn autorisieren (mit deinem Business Account!)
5. **Configure**:
   - **Text**: Klicke in das Feld und wähle `content` (vom Webhook)
   - **Visibility**: `CONNECTIONS` oder `PUBLIC`
6. **OK** klicken

#### Schritt 4: Test & Activate

1. Klicke **"Run once"** (unten links)
2. Sende Test-Request (siehe unten)
3. Check LinkedIn - siehst du den Test-Post? ✅
4. Klicke **"Scheduling"** → "ON" (Scenario aktivieren!)

#### Schritt 5: Webhook URL speichern

Füge die Webhook URL zu `.env` hinzu:

```env
WEBHOOK_LINKEDIN=https://hook.eu1.make.com/abc123xyz456
```

### 3. Scenario für Facebook erstellen

**Wiederhole Schritte 1-5, aber:**

- **Scenario Name**: "Facebook Poster - Kaufe.es"
- **Action**: Suche "Facebook Pages"
- **Module**: "Create a Post"
- **Page**: Wähle deine Kaufe.es Page (742 Follower)
- **Message**: Wähle `content` vom Webhook

```env
WEBHOOK_FACEBOOK=https://hook.eu1.make.com/def789ghi012
```

### 4. TikTok Scenario (Optional)

**Leider:** TikTok ist in Make.com nicht direkt verfügbar.

**Workaround:**
- Nutze später Buffer API (wartet auf Approval)
- Oder: Make.com → Email → Manuell auf TikTok posten

```env
# TikTok vorerst auskommentiert
# WEBHOOK_TIKTOK=
```

### 5. Server neu starten

```bash
cd backend
npm run build
npm run dev
```

✅ Check Output:
```
✅ Webhook Routes erfolgreich registriert
```

---

## 🧪 Test Commands

### Test Webhook Status

```bash
curl http://localhost:3000/api/social/webhook/status
```

**Erwartete Antwort:**
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
  "message": "✅ 2/3 Webhooks konfiguriert!"
}
```

### Test LinkedIn Webhook

```bash
curl -X POST "http://localhost:3000/api/social/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{"platform": "linkedin"}'
```

**Was passiert:**
1. Backend sendet Test zu Make.com
2. Make.com empfängt Webhook
3. Make.com postet auf LinkedIn
4. Du siehst Test-Post! 🎉

### Echter LinkedIn Post

```bash
curl -X POST "http://localhost:3000/api/social/webhook/post" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linkedin",
    "content": "🚀 Professionelle E-Commerce-Lösungen bei Kaufe.es! #business #ecommerce",
    "scheduleTime": "now"
  }'
```

### Echter Facebook Post

```bash
curl -X POST "http://localhost:3000/api/social/webhook/post" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "content": "🛍️ Neue Produkte im Shop! Schaut vorbei bei Kaufe.es 🚀",
    "scheduleTime": "now"
  }'
```

---

## 📊 Make.com vs. Zapier vs. Buffer

| Feature | Make.com FREE | Zapier FREE | Buffer API |
|---------|---------------|-------------|------------|
| **Kosten** | 🎉 **0€** | 💰 Nur 5 Zaps | ⏳ Wartet |
| **Operations** | 🎉 **1000/Monat** | 💔 Nur 100/Monat | ⏳ Wartet |
| **LinkedIn** | ✅ Sofort | ✅ Begrenzt | ⏳ Wartet |
| **Facebook** | ✅ Sofort | ✅ Begrenzt | ⏳ Wartet |
| **Editor** | ✅ Visuell + Erweitert | ✅ Einfach | - |
| **Wartezeit** | ⚡ 0 Minuten | ⚡ 0 Minuten | ⏳ Tage |

**Make.com = BESTE kostenlose Lösung!** 🎉

---

## 🔥 Make.com Visualisierung

```
┌─────────────────┐
│  Dein Backend   │
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

## 🎨 Frontend Features

- **Badge**: "🎉 Make.com (1000 GRATIS!)"
- **Status**: "✅ 2/3 Webhooks konfiguriert"
- **Toggle**: Make.com ↔ Buffer
- **"🔗 Verbinden"** öffnet Make.com Dashboard

---

## 💡 Pro Tipps

### Make.com Free Plan Details

- **1000 Operations/Monat** = ~33 Posts pro Tag
- **2 Active Scenarios** (reicht für LinkedIn + Facebook!)
- **5 MB Datenspeicher**
- **15 Minuten Interval** (für scheduled scenarios)

### Upgrade nur wenn nötig

- **Core**: $9/Monat = 10.000 Ops
- **Pro**: $16/Monat = 10.000 Ops + mehr Features

### Multi-Platform Posting

Erstelle ein **einziges Scenario** mit mehreren Actions:
1. Webhook Trigger
2. Action 1: LinkedIn Post
3. Action 2: Facebook Post
4. Action 3: Email Notification

→ Ein Webhook postet auf BEIDEN Plattformen! 🚀

### Bilder & Videos

Make.com unterstützt:
- **Bilder**: JPG, PNG - über `mediaUrl` Parameter
- **Videos**: MP4 - für Facebook
- **Links**: Automatische Vorschau

```json
{
  "platform": "facebook",
  "content": "Neues Produkt! 🛍️",
  "mediaUrl": "https://kaufe-es.eu/images/product.jpg"
}
```

---

## ❌ Troubleshooting

### "Kein Webhook für LINKEDIN konfiguriert"

→ Füge `WEBHOOK_LINKEDIN=...` zu `backend/.env` hinzu

### Webhook funktioniert nicht

→ Check Make.com Dashboard:
- Ist das Scenario **ON** (Scheduling aktiv)?
- Webhook URL korrekt kopiert?
- **Execution History** → Fehler angezeigt?

### Post erscheint nicht

→ Make.com Dashboard → **Execution History**:
- Klicke auf letzte Execution
- Siehst du grüne ✅ bei allen Modulen?
- Fehler? Dann LinkedIn Connection neu verbinden

### "Operations limit reached"

→ Du hast 1000 Operations verbraucht:
- Warte bis nächsten Monat (Reset)
- Oder: Upgrade auf Core Plan

---

## 🎉 Fertig!

Du hast jetzt:

- ✅ **LinkedIn Posting** - 1000 Posts/Monat GRATIS!
- ✅ **Facebook Posting** - Deine 742 Follower erreichen!
- ✅ **Visueller Editor** - Einfach anpassen
- ⏳ **TikTok** - Kommt später via Buffer

### Was als Nächstes?

1. **Frontend öffnen**: http://localhost:5174/marketing/social-poster
2. **Toggle auf "🎉 Make.com"** klicken
3. **Ersten echten Post** erstellen!
4. **Make.com Dashboard** checken → Execution History

**Make.com = Perfekte kostenlose Lösung!** 🎉

### Buffer Email kommt?

Einfach Toggle auf "⏳ Buffer" umschalten - TikTok funktioniert dann auch!

**Viel Erfolg beim Posten! 🚀**
