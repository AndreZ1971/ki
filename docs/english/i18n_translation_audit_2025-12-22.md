# Übersetzungs- und i18n-Check: german.json & english.json

## Ziel

Umfassende Analyse der aktuellen Übersetzungsabdeckung im Frontend (Stand: 22.12.2025). Identifikation aller fehlenden, nicht konsistent verwendeten oder als Literal im Code befindlichen UI-Texte, insbesondere für Social Media, Marketing, Toasts, Fehlermeldungen und neue Features.

---

## Vorgehen

1. **Vergleich der Sprachdateien (german.json, english.json)**
2. **Code-Scan nach Literal-Strings (showToast, Button-Labels, Fehlermeldungen, Statusmeldungen, etc.)**
3. **Abgleich mit Features und Komponenten (z.B. SocialMediaPoster, Marketing, Onboarding, Webhook, KI-Feedback)**
4. **Empfehlungen und konkrete Vorschläge für neue Übersetzungsschlüssel**

---

## 1. Allgemeine Beobachtungen

- Die Sprachdateien sind sehr umfangreich, decken aber nicht alle dynamischen oder neuen Features ab.
- Viele Texte werden im Code als Literal verwendet (z.B. in showToast, Button-Labels, Fehlermeldungen).
- Neue Features (Social Media, Webhook, KI-Transform, Engagement-Statistiken) benötigen zusätzliche Übersetzungen.

---

## 2. Fehlende oder nicht ausgelagerte Übersetzungen (Beispiele)

### SocialMediaPoster & Social Media Features

- Plattformnamen, Töne, CTAs als Literal
- Statusmeldungen: "Posts erfolgreich generiert!", "Bitte gib ein Thema ein", "Bitte wähle mindestens eine Plattform", "Diese Plattform wird noch nicht unterstützt", "Post aktualisiert!", "ist nicht aktiviert. Siehe Bedienungsanleitung.", "Post auf ... veröffentlicht!"
- Webhook-Status: "Webhook verbunden", "Webhook nicht verbunden", "Webhook-Status prüfen"
- KI-Transform: "KI-Optimierung aktiv", "KI-Optimierung deaktiviert"
- Engagement-Statistiken: "Geplante Posts", "Veröffentlichte Posts", "Engagement-Rate"

### Marketing & Content

- "Content erfolgreich generiert!", "Bitte gib ein Thema ein", "In Zwischenablage kopiert!", "Fehler beim Generieren der Email. Bitte versuche es erneut."
- "Email erfolgreich generiert!", "Emails erfolgreich versendet!", "Email-Konfiguration fehlerhaft. Bitte prüfe die SMTP-Einstellungen im Backend."
- "Keine Kunden vorhanden", "Fehler beim Segmentieren", "Fehler bei der Performance-Prognose"

### Allgemeine Toasts & Fehler

- "Bitte fülle alle Felder aus", "Bitte Produktname und Preis angeben", "Optimierung fehlgeschlagen", "Download gestartet", "Preset angewendet"
- "Analyse abgeschlossen!", "Analyse fehlgeschlagen", "KI-Text generiert", "KI-Text fehlgeschlagen"

### Onboarding & Hilfetexte

- "Social Media Konten verbinden", "Anleitung zum Verbinden", "Webhook-Integration einrichten", "KI-gestützte Optimierung aktivieren"

---

## 3. Vorschläge für neue Übersetzungsschlüssel

### Beispielstruktur (Ausschnitt)

```json
{
  "social": {
    "platforms": {
      "linkedin": "LinkedIn",
      "facebook": "Facebook",
      "instagram": "Instagram",
      "twitter": "Twitter/X",
      "tiktok": "TikTok",
      "youtube": "YouTube"
    },
    "tones": {
      "casual": "Locker",
      "professional": "Professionell",
      "energetic": "Energetisch",
      "educational": "Lehrreich"
    },
    "ctaTypes": {
      "none": "Keine CTA",
      "click": "Click/Besuch",
      "engagement": "Engagement",
      "message": "Nachricht",
      "like": "Like/Share"
    },
    "messages": {
      "postGenerated": "Posts erfolgreich generiert!",
      "enterTopic": "Bitte gib ein Thema ein",
      "selectPlatform": "Bitte wähle mindestens eine Plattform",
      "platformNotSupported": "Diese Plattform wird noch nicht unterstützt",
      "postUpdated": "Post aktualisiert!",
      "platformNotEnabled": "{platform} ist nicht aktiviert. Siehe Bedienungsanleitung.",
      "postPublished": "Post auf {platform} veröffentlicht!"
    },
    "webhook": {
      "connected": "Webhook verbunden",
      "notConnected": "Webhook nicht verbunden",
      "checkStatus": "Webhook-Status prüfen"
    },
    "aiTransform": {
      "enabled": "KI-Optimierung aktiv",
      "disabled": "KI-Optimierung deaktiviert"
    },
    "stats": {
      "scheduled": "Geplante Posts",
      "published": "Veröffentlichte Posts",
      "engagement": "Engagement-Rate"
    }
  },
  "marketing": {
    "contentGenerated": "Content erfolgreich generiert!",
    "enterTopic": "Bitte gib ein Thema ein",
    "copied": "In Zwischenablage kopiert!",
    "emailGenerated": "Email erfolgreich generiert!",
    "emailSent": "Emails erfolgreich versendet!",
    "smtpError": "Email-Konfiguration fehlerhaft. Bitte prüfe die SMTP-Einstellungen im Backend.",
    "noCustomers": "Keine Kunden vorhanden",
    "segmentationError": "Fehler beim Segmentieren",
    "performanceError": "Fehler bei der Performance-Prognose"
  },
  "common": {
    "fillAllFields": "Bitte fülle alle Felder aus",
    "enterProductAndPrice": "Bitte Produktname und Preis angeben",
    "optimizationFailed": "Optimierung fehlgeschlagen",
    "downloadStarted": "Download gestartet",
    "presetApplied": "Preset angewendet",
    "analysisCompleted": "Analyse abgeschlossen!",
    "analysisFailed": "Analyse fehlgeschlagen",
    "aiTextGenerated": "KI-Text generiert",
    "aiTextFailed": "KI-Text fehlgeschlagen"
  },
  "onboarding": {
    "connectSocial": "Social Media Konten verbinden",
    "guide": "Anleitung zum Verbinden",
    "setupWebhook": "Webhook-Integration einrichten",
    "enableAi": "KI-gestützte Optimierung aktivieren"
  }
}
```

---

## 4. Empfehlungen

- **Alle Literal-Texte in den Komponenten durch Übersetzungsschlüssel ersetzen**
- **Neue Features und dynamische Statusmeldungen in die Sprachdateien aufnehmen**
- **Regelmäßige Überprüfung und Pflege der Sprachdateien bei neuen Features**
- **Automatisierte Tests für Übersetzungsabdeckung (z.B. alle showToast- und Button-Labels abdecken)**

---

## 5. Nächste Schritte

1. Obige Schlüssel in german.json und english.json ergänzen
2. Komponenten refaktorisieren, um überall t('...') zu verwenden
3. Tests für Übersetzungsabdeckung erweitern

---


---
Erstellt am 22.12.2025 von GitHub Copilot (GPT-4.1)
