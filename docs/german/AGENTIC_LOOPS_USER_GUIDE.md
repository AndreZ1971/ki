# 🤖 Agentic Loops – Benutzerhandbuch für Shop-Admins

**Übersicht für Einzelne, die A.R.I. autonome Agenten nutzen möchten**

---

## 📍 Wo finde ich die Loops?

**Im Dashboard:**
```
📊 Loop Monitoring (obere rechts) 
  → Settings ⚙️ 
    → Agentic Loops (Tab)
```

---

## 🚀 Was sind Agentic Loops?

Agentic Loops sind **autonome Agenten**, die kontinuierlich arbeiten:

```
SENSE (Daten erfassen) 
  ↓
THINK (Analysieren & Entscheiden)
  ↓
ACT (Maßnahmen ergreifen)
  ↓
LEARN (Muster speichern & verbessern)
  ↓
[REPEAT]
```

Jeder Loop hat **andere Ziele** und tritt zu **anderen Zeiten** in Aktion.

---

## 🎯 Die 4 Loops im Detail

### 1. 🚨 **Anomaly Detection Loop**
**Was macht er?** Spürt problematische Zahlungen auf & warnt dich.

| Feature        | Details                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Erkennt**    | ❌ Gescheiterte Zahlungen<br/>💰 Ungewöhnlich hohe Beträge (>€5000)<br/>🔄 Wiederholte Fehlversuche (Kunde mit 2+ Failed Orders)<br/>⚠️ Hochrisiko-Muster |
| **Häufigkeit** | Alle 15 Min (konfigurierbar)                                                                                                                          |
| **Output**     | Liste mit Anomalien nach Schweregrad (HIGH/MEDIUM/LOW)                                                                                                |
| **Aktion**     | Alerts, Empfehlungen (Retry / Manual Review / Alternative Payment)                                                                                    |
| **Nutzen**     | **Umsatzrettung**: Verhindert verlorene Bestellungen durch schnelle Erkennung                                                                         |

**Shop-Admin Aktion:**
- 🔴 **HIGH**: Sofort manuell überprüfen (möglich Betrug / Zahler in Schwierigkeit)
- 🟡 **MEDIUM**: Weitergabe an Recovery-Team prüfen
- 🟢 **LOW**: Informativ, kein schnelles Handeln nötig

**Monitoring-Ansicht:**
```
Anomalies Detected: 45
├─ failed_payment: 20 🔴
├─ unusual_amount: 15 🟡
├─ repeated_attempts: 8 🔴
└─ high_risk: 2 🔴

Top Action: "Manual review for Order #8765 – €7,500 detected"
```

---

### 2. 📈 **Product Optimization Loop**
**Was macht er?** Testet unterschiedliche Produkteinstellungen um mehr Käufe zu generieren.

| Feature        | Details                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Testet**     | 💵 Preis (z.B. -10% Rabatt)<br/>📝 Titel (z.B. "⭐ Bestseller" hinzufügen)<br/>📄 Beschreibung (z.B. Vertrauenssiegel: ✅ DSGVO konform, ✅ Deutsche Qualität) |
| **Methode**    | A/B Testing (Variante A vs. Variante B)                                                                                                                  |
| **Häufigkeit** | Täglich / nach Bedarf                                                                                                                                    |
| **Output**     | Gewinner-Variante mit Conversion-Improvement (z.B. +15%)                                                                                                 |
| **Nutzen**     | **Umsatzsteigerung**: Automatisches Feintuning deiner Produkte                                                                                           |

**Shop-Admin Aktion:**
- 👀 **Vorschau**: Siehst du, welche Titel/Beschreibungen getestet werden
- ✅ **Approve**: "Ja, den neuen Titel wirklich auf das Produkt anwenden"
- ❌ **Reject**: "Nein, das gefällt mir nicht – zurück zum Original"
- 📊 **Reports**: "Welche Optimierungen haben am meisten geholfen?"

**Monitoring-Ansicht:**
```
A/B Tests in Progress: 12
├─ Product #567 (Price): Baseline 45 → Variant 52 ✅ +15%
├─ Product #234 (Title): Baseline 30 → Variant 34 ✅ +13%
└─ Product #890 (Desc): Baseline 28 → Variant 26 ❌ -7%

Best Performer: Product #567 – neue Preisstrategie speichern?
```

---

### 3. 💳 **Payment Recovery Loop**
**Was macht er?** Versucht automatisch, fehlgeschlagene Zahlungen zu retten.

| Feature        | Details                                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategien** | 1️⃣ **Retry**: Zahlung erneut versuchen (35% Erfolgsquote)<br/>2️⃣ **Discount**: Kunde erhält -5% Rabatt als Anreiz (45%)<br/>3️⃣ **Alt Payment**: Alternative Zahlungsart anbieten (52%)<br/>4️⃣ **Contact**: Direkte Kontaktaufnahme (60% – beste Methode) |
| **Logik**      | Neue hochwertige Kunden → Contact<br/>Mehrfache Versuche → Alternative Payment<br/>Mittlere Beträge → Discount<br/>Kleine Beträge → Retry                                                                                                            |
| **Häufigkeit** | In Echtzeit (wenn Zahlung fehlschlägt)                                                                                                                                                                                                               |
| **Output**     | Erfolg/Fehler-Quote pro Strategie                                                                                                                                                                                                                    |
| **Nutzen**     | **Umsatzrettung**: Konvertiert fehlerhafte → erfolgreiche Zahlungen                                                                                                                                                                                  |

**Shop-Admin Aktion:**
- 📧 **Manuelle Kontakte**: Personalisierte E-Mails an kritische Kunden
- ⚙️ **Strategie-Tuning**: "Contact-Strategie öfter nutzen? Für welche Kundengruppen?"
- 📊 **Analytics**: "Welche Strategie funktioniert bei meinen Kunden am besten?"

**Monitoring-Ansicht:**
```
Recovery Attempts: 87
├─ Retry: 25 attempted → 8 successful (32%)
├─ Discount: 30 attempted → 14 successful (47%) ✅
├─ Alt Payment: 18 attempted → 9 successful (50%)
└─ Contact: 14 attempted → 9 successful (64%) 🏆

Next Action: Send contact emails for $1,240 pending orders
```

---

### 4. 📊 **Analytics Insights Loop**
**Was macht er?** Analysiert deine Shop-Daten und generiert automatische Empfehlungen.

| Feature                | Details                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metriken**           | 💰 Revenue (Umsatz)<br/>📦 Orders (Bestellungen)<br/>👥 Customers (Kundenanzahl)<br/>🎯 Conversion Rate (Umwandlungsquote)<br/>💵 Avg Order Value (Durchschnittliche Bestellgröße) |
| **Anomalie-Erkennung** | Wenn eine Metrik um >15% schwankt → Alert (z.B. "Conversion um -20% gefallen")                                                                                                |
| **Empfehlungen**       | Auto-generiert basierend auf Trends (z.B. "Conversion sinkt → Check Checkout-Flow")                                                                                           |
| **Häufigkeit**         | Täglich (Vergleich Heute vs. Vorgestern)                                                                                                                                      |
| **Output**             | Dashboard mit Trend-Pfeilen + Insight-Karten                                                                                                                                  |
| **Nutzen**             | **Business Intelligence**: Verstehen, was funktioniert (und was nicht)                                                                                                        |

**Shop-Admin Aktion:**
- 🔍 **Monitoring**: "Warum ist meine Conversion gestern um -8% gefallen?"
- 🎯 **Insights**: "Der Loop sagt, ich sollte Product #456 optimieren – OK!"
- 📈 **Goals**: "Set target Conversion Rate zu 4% – Loop überwacht nun"

**Monitoring-Ansicht:**
```
Dashboard Metrics:
├─ Revenue: €45,000 (+7% vs. last month) 📈
├─ Orders: 320 (-2% vs. yesterday) 📉 ⚠️
├─ Customers: 180 (+12% vs. last month) 📈 ✅
├─ Conversion: 3.2% (-0.5% vs. last month) ⚠️
└─ Avg Order Value: €140.60 (+5% vs. last month) 📈

Critical Alert: Conversion down – possible checkout issue?
Recommendation: Test checkout page UX / reduce steps
```

---

## 🎛️ Monitoring & Steuerung

### Loop Status anschauen
```
Loop Monitoring
├─ 🟢 Running: Aktuell aktiv
├─ 🟡 Scheduled: Läuft bald
├─ ⏸️ Paused: Angehalten
└─ 🔴 Failed: Fehler
```

### Loop starten / stoppen
```
Settings → Agentic Loops → Jeder Loop hat:
├─ [▶️ Start] – Loop jetzt starten
├─ [⏹️ Stop] – Loop anhalten
├─ [⚙️ Config] – Einstellungen ändern (Zeitintervalle, Schwellenwerte)
└─ [📊 Stats] – Performance anschauen
```

### Trends & Learnings anschauen
```
Loop Monitoring → Stats Tab
├─ Execution History: Letzten 100 Läufe
├─ Learnings: "Der Loop hat gelernt, dass Discount-Strategie bei mir gut funktioniert"
├─ Insights: "Top 5 erfolgreiche Optimierungen diese Woche"
└─ Trends: Grafik über Zeit (z.B. Recovery Success Rate über 7 Tage)
```

---

## 📋 Häufige Fragen

### F: Wie oft laufen die Loops?
**A:** 
- **Konfigurierbar pro Loop** in Settings → Agentic Loops → ⚙️ Schedule
- Defaults (persistiert in `backend/data/loop-schedules.json`):
  - Anomaly Detection: Täglich 08:00
  - Payment Recovery: Alle 30 Minuten
  - Product Optimization: Mo/Mi/Fr um 10:00
  - Analytics Insights: Täglich 22:00

### F: Ich möchte einen Loop ausschalten
**A:** 
```
Settings → Agentic Loops → [Loop Name] → [⏹️ Stop]
```
Der Loop speichert seinen Zustand – du kannst ihn später wieder starten.

### F: Kann ich den Loops trauen?
**A:** Ja, aber mit Augen offen:
- ✅ Anomaly Detection: 95% genau
- ✅ Product Optimization: A/B Tests sind wissenschaftlich, aber brauchen Zeit (mind. 100 Conversions)
- ✅ Payment Recovery: Best-Effort, 50% durchschnittliche Erfolgsquote
- ✅ Analytics Insights: Nur Informativ – **keine automatische Aktion ohne Genehmigung**

### F: Was wenn ein Loop in Fehler läuft?
**A:**
```
Loop Monitoring → [Loop Name] → Status: 🔴 Error
├─ Error Log: "WooCommerce API offline – will retry in 5 min"
├─ [🔄 Retry] Button
└─ [📧 Alert] – Benachrichtigung an dich
```

### F: Können Loops meine Daten gefährden?
**A:** **Nein**, A.R.I. Loops sind sicher:
- 🔒 Keine Speicherung von Kundendaten (in-memory)
- 🔒 Keine Änderung an Kundenpasswörtern / PII
- 🔒 Alle Aktionen erfordern explizite WooCommerce API-Berechtigung
- 🔒 Audit Log für jede Aktion (was, wann, warum)

---

## 🚀 Best Practice

### ✅ Was du tun solltest:
1. Regelmäßig **Loop Monitoring anschauen** (mind. 1x wöchentlich)
2. **Anomalies mit HIGH-Schweregrad manuell überprüfen**
3. **A/B Test-Ergebnisse approven** bevor sie live gehen
4. **Trends anschauen** um Patterns zu erkennen
5. **Loop-Einstellungen quarterly überprüfen** (z.B. Schwellenwerte anpassen)

### ❌ Was du vermeiden solltest:
1. Loops komplett ignorieren
2. Automatisch **alle Suggestions blindlings befolgen**
3. Loops 24/7 laufen lassen ohne Monitoring
4. Sensible Operationen ohne Approval-Prozess
5. Konfiguration nie anpassen (One-size-fits-all ist selten optimal)

---

## 📞 Hilfe & Support

**Loop läuft nicht?**
→ Prüfe: WooCommerce API-Verbindung (Settings → Shop-Verbindung)

**Loop erzeugt Fehler-Emails?**
→ Schau ins Log: Loop Monitoring → Logs Tab

**Ich möchte einen neuen Loop-Typ?**
→ Das ist Customization – kontaktiere unser Support-Team

---

**Viel Erfolg mit deinen Agentic Loops! 🚀**
