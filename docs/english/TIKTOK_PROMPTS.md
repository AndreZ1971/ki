# 🎵 TikTok IFTTT AI Prompts - All Lengths!

**For IFTTT Pro with limited prompt input!**

---

## 🔥 Option 1: ONE-LINER (Shortest Prompt!)

**Copy exactly this:**

```
Make viral TikTok post (Gen Z, POV, slang, emojis 🔥💀✨, #fyp #foryou) from: {{Value1}}
```

**That's it!** The AI knows what to do! 🚀

---

## ⚡ Option 2: MINI-Prompt (Short & effective!)

```
TikTok caption for @kaufe.es: {{Value1}}
Gen Z slang + POV format + lots of emojis 🔥💀✨ + #fyp #foryou #shopping
```

---

## 💎 Option 3: COMPACT-Prompt (Slightly more details)

```
Viral Gen Z TikTok caption for @kaufe.es from: {{Value1}}
50-100 characters. Slang (fr fr, no cap, bussin). Lots of emojis 🔥💀✨. POV/Tell me why format. Hashtags: #fyp #foryou #shopping #viral
```

---

## 📝 Option 4: EXTENDED-Prompt (If space available)

```
Transform into TikTok caption for @kaufe.es (2098 followers):
Text: {{Value1}}
Style: Gen Z (16-30 yrs), casual, witty
Format: POV/Tell me why/No one
Language: Slang (fr fr, no cap, bussin, slay)
Emojis: 5-10 (🔥💀😭✨💅⚡🤡)
Length: 50-100 characters
Hashtags: #fyp #foryou #viral #shopping + 3 thematic
Focus: Relatable, meme-like, authentic
```

---

## 🧪 Test with each prompt:

### Input:
```json
{
  "value1": "Free shipping from 50 euros"
}
```

### Expected Output (all prompts):
```
POV: Your shopping cart is at €49.99 💀

Me adding random stuff for free shipping: 🤡🛒

Free shipping from 50€ fr fr ⚡✨

#shopping #relatable #onlineshopping #fyp #foryou #freeshipping #broke
```

---

## 🎯 Which prompt to use?

| Situation | Recommended Prompt | Why? |
|-----------|-------------------|--------|
| **IFTTT limits heavily** | ONE-LINER | Always fits! |
| **Some more space** | MINI-Prompt | Better control |
| **Good quality needed** | COMPACT | Best balance |
| **Maximum quality** | EXTENDED | If space available |

---

## 🚀 IFTTT Applet Setup

### Step 1: Create applet
1. **If This**: Webhooks → Event name: `tiktok_post`
2. **Then That**: Email → To: `info@kaufe-es.eu`

### Step 2: Activate AI Transform ✨
3. Click **"Add filter"**
4. Select **"AI Transform"** (Pro feature!)
5. **Enter prompt**: [Choose one from above!]

### Step 3: Email Setup
6. **Subject**: `🎵 TikTok Post ready!`
7. **Body**: 
```
New TikTok post for @kaufe.es:

{{TransformedText}}

---
Original: {{Value1}}
Created: {{OccurredAt}}
```

### Step 4: Done! ✅
8. **Continue** → **Finish**
9. Test with curl!

---

## 📱 Test Commands

### Test ONE-LINER Prompt:
```bash
curl -X POST "https://maker.ifttt.com/trigger/tiktok_post/with/key/YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value1": "New gaming products available"}'
```

**You get email with:**
```
POV: You're a gamer and need a new setup 🎮⚡

FINALLY we have gaming stuff! 
No cap, the prices are bussin 💀🔥

Link in bio! ✨

#gaming #gamer #setup #fyp #foryou #shopping #viral
```

---

## 💡 Pro Tips for short prompts

### Keywords AI understands:

| Word | AI understands |
|------|-------------|
| **Gen Z** | Slang, memes, trends |
| **POV** | "Point of view" format |
| **Slang** | "fr fr", "no cap", "bussin" |
| **Viral** | Trend-optimized, catchy |
| **#fyp** | TikTok algorithm-optimized |

### Emoji Shortcuts:
- 🔥 = trending/hot
- 💀 = funny/dead laughing
- ✨ = aesthetic/perfect
- 💅 = sassy/confident
- ⚡ = fast/energetic

**The AI knows the meaning!**

---

## 🎁 Bonus: Multi-Post Variants

### Variant 1: Humor focus
```
Funny TikTok (Gen Z, memes, 💀🤡) from: {{Value1}} #fyp #foryou #viral
```

### Variant 2: Product focus
```
TikTok product presentation (casual, Gen Z, ✨🔥) from: {{Value1}} #shopping #fyp
```

### Variant 3: Deal focus
```
TikTok deal post (hype, FOMO, 🔥💸) from: {{Value1}} #deals #fyp #foryou
```

---

## 🔥 Recommendation:

**Start with ONE-LINER:**
```
Make viral TikTok post (Gen Z, POV, slang, emojis 🔥💀✨, #fyp #foryou) from: {{Value1}}
```

**If AI struggles → use COMPACT-Prompt instead!**

**The AI is smart - short is often better!** 🚀
