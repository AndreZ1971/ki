# 🎵 TikTok IFTTT AI Prompts - Alle Längen!

**Für IFTTT Pro mit limitierter Prompt-Eingabe!**

---

## 🔥 Option 1: ONE-LINER (Kürzester Prompt!)

**Kopiere genau das:**

```
Mache viralen TikTok-Post (Gen Z, POV, Slang, Emojis 🔥💀✨, #fyp #foryou) aus: {{Value1}}
```

**Das war's!** Die AI weiß was zu tun ist! 🚀

---

## ⚡ Option 2: MINI-Prompt (Kurz & effektiv!)

```
TikTok Caption für @kaufe.es: {{Value1}}
Gen Z Slang + POV-Format + viele Emojis 🔥💀✨ + #fyp #foryou #shopping
```

---

## 💎 Option 3: KOMPAKT-Prompt (Etwas mehr Details)

```
Viraler Gen Z TikTok-Caption für @kaufe.es aus: {{Value1}}
50-100 Zeichen. Slang (fr fr, no cap, bussin). Viele Emojis 🔥💀✨. POV/Tell me why Format. Hashtags: #fyp #foryou #shopping #viral
```

---

## 📝 Option 4: EXTENDED-Prompt (Wenn Platz vorhanden)

```
Transformiere in TikTok-Caption für @kaufe.es (2098 Follower):
Text: {{Value1}}
Style: Gen Z (16-30J), locker, witzig
Format: POV/Tell me why/No one
Sprache: Slang (fr fr, no cap, bussin, slay)
Emojis: 5-10 (🔥💀😭✨💅⚡🤡)
Länge: 50-100 Zeichen
Hashtags: #fyp #foryou #viral #shopping + 3 thematische
Fokus: Relatable, meme-artig, authentisch
```

---

## 🧪 Test mit jedem Prompt:

### Input:
```json
{
  "value1": "Kostenloser Versand ab 50 Euro"
}
```

### Erwarteter Output (alle Prompts):
```
POV: Dein Warenkorb ist bei 49,99€ 💀

Me adding random stuff for free shipping: 🤡🛒

Ab 50€ versandkostenfrei fr fr ⚡✨

#shopping #relatable #onlineshopping #fyp #foryou #freeshipping #broke
```

---

## 🎯 Welchen Prompt nutzen?

| Situation | Empfohlener Prompt | Warum? |
|-----------|-------------------|--------|
| **IFTTT limitiert stark** | ONE-LINER | Passt immer! |
| **Etwas mehr Platz** | MINI-Prompt | Bessere Kontrolle |
| **Gute Qualität nötig** | KOMPAKT | Beste Balance |
| **Maximum Qualität** | EXTENDED | Wenn Platz da ist |

---

## 🚀 IFTTT Applet Setup

### Schritt 1: Applet erstellen
1. **If This**: Webhooks → Event name: `tiktok_post`
2. **Then That**: Email → To: `info@kaufe-es.eu`

### Schritt 2: AI Transform aktivieren ✨
3. Klicke **"Add filter"**
4. Wähle **"AI Transform"** (Pro Feature!)
5. **Prompt eingeben**: [Wähle einen Prompt von oben!]

### Schritt 3: Email Setup
6. **Subject**: `🎵 TikTok Post bereit!`
7. **Body**: 
```
Neuer TikTok-Post für @kaufe.es:

{{TransformedText}}

---
Original: {{Value1}}
Erstellt: {{OccurredAt}}
```

### Schritt 4: Fertig! ✅
8. **Continue** → **Finish**
9. Teste mit curl!

---

## 📱 Test Commands

### Test ONE-LINER Prompt:
```bash
curl -X POST "https://maker.ifttt.com/trigger/tiktok_post/with/key/DEIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value1": "Neue Gaming-Produkte verfügbar"}'
```

**Email bekommst du mit:**
```
POV: Du bist Gamer und brauchst new Setup 🎮⚡

ENDLICH haben wir Gaming-Stuff! 
No cap, die Preise sind bussin 💀🔥

Link in Bio! ✨

#gaming #gamer #setup #fyp #foryou #shopping #viral
```

---

## 💡 Pro Tips für kurze Prompts

### Schlüsselwörter die AI versteht:

| Wort | AI versteht |
|------|-------------|
| **Gen Z** | Slang, Memes, Trends |
| **POV** | "Point of View" Format |
| **Slang** | "fr fr", "no cap", "bussin" |
| **Viral** | Trend-optimiert, catchy |
| **#fyp** | TikTok-Algorithmus-optimiert |

### Emoji-Kürzel:
- 🔥 = trending/hot
- 💀 = funny/dead laughing
- ✨ = aesthetic/perfect
- 💅 = sassy/confident
- ⚡ = fast/energetic

**Die AI kennt die Bedeutung!**

---

## 🎁 Bonus: Multi-Post Varianten

### Variante 1: Humor-fokus
```
Lustiger TikTok (Gen Z, Memes, 💀🤡) aus: {{Value1}} #fyp #foryou #viral
```

### Variante 2: Produkt-fokus
```
TikTok Produktvorstellung (locker, Gen Z, ✨🔥) aus: {{Value1}} #shopping #fyp
```

### Variante 3: Deal-fokus
```
TikTok Deal-Post (hype, FOMO, 🔥💸) aus: {{Value1}} #deals #fyp #foryou
```

---

## 🔥 Empfehlung:

**Start mit ONE-LINER:**
```
Mache viralen TikTok-Post (Gen Z, POV, Slang, Emojis 🔥💀✨, #fyp #foryou) aus: {{Value1}}
```

**Falls AI schwächelt → KOMPAKT-Prompt nutzen!**

**Die AI ist schlau - kurz ist oft besser!** 🚀
