# 🚨 Emergency Alerting Setup Guide

## Übersicht

Das Payment Emergency System nutzt **GPT-4o-mini** zur Analyse kritischer Incidents und sendet automatisch Alarme an konfigurierte Kanäle.

---

## 🎯 Unterstützte Alerting-Kanäle

### 1. **Slack** 💬
- **Typ**: Instant Messaging
- **Trigger**: Alle Notfälle (P0-P3)
- **Format**: Rich Message mit Ticket-ID, Severity, Impact, Escalation Path

**Setup:**
```bash
# 1. Slack Incoming Webhook erstellen
# https://api.slack.com/messaging/webhooks

# 2. In .env eintragen
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Slack Message Beispiel:**
```
🚨 PAYMENT EMERGENCY

Ticket:           EMG-1733934567-A3B9F2
Priority:         CRITICAL
Severity:         P0
Customers:        1,523
Revenue at Risk:  €127,450
SLA Violation:    ❌ YES

Escalation Path:
1. L1 Support
2. Payment Lead
3. CTO
```

---

### 2. **Email** 📧
- **Typ**: Email Notification
- **Trigger**: Alle Notfälle (P0-P3)
- **Format**: HTML Email mit vollständiger Incident-Analyse

**Setup:**
```bash
# In .env eintragen
EMERGENCY_ALERT_EMAIL=devops@your-company.com,oncall@your-company.com
```

**Voraussetzungen:**
- Nutzt dein bestehendes Email-System
- In `backend/services/emailService.ts` integrieren
- SMTP-Konfiguration erforderlich

---

### 3. **PagerDuty** 📟
- **Typ**: Incident Management & On-Call Alerting
- **Trigger**: Nur P0/P1 (Critical/High)
- **Format**: PagerDuty Event mit Custom Details

**Setup:**
```bash
# 1. PagerDuty Service erstellen
# https://support.pagerduty.com/docs/services-and-integrations

# 2. Events API v2 Integration Key kopieren

# 3. In .env eintragen
PAGERDUTY_INTEGRATION_KEY=your-integration-key-here
```

**PagerDuty Features:**
- ✅ Automatische Incident Creation für P0/P1
- ✅ On-Call Engineer wird sofort benachrichtigt
- ✅ Escalation Policies werden befolgt
- ✅ Custom Details mit Ticket-ID, Impact, Revenue Risk

---

### 4. **Console Logging** 📋
- **Typ**: Server Console Output
- **Trigger**: Immer aktiv (alle Notfälle)
- **Format**: Formatierter ASCII-Box Log

**Kein Setup erforderlich** - immer aktiv!

**Console Output Beispiel:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PAYMENT EMERGENCY ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket:           EMG-1733934567-A3B9F2
Severity:         P0
Priority:         CRITICAL
Customers:        1,523
Revenue at Risk:  €127,450
SLA Violation:    YES ❌
Issue Type:       gateway-down

Escalation Path:
  1. L1 Support
  2. Payment Lead
  3. CTO

Alerts Sent: ✅ Slack notification sent, ✅ PagerDuty incident created, ✅ Email queued
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Konfiguration

### Backend (.env)
```bash
# Slack
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/...

# Email
EMERGENCY_ALERT_EMAIL=devops@company.com

# PagerDuty (nur für P0/P1)
PAGERDUTY_INTEGRATION_KEY=your-key-here
```

### Alert Logic
```typescript
// In backend/routes/app/api/payments.ts

async function sendEmergencyAlerts(analysis: any): Promise<void> {
  // 1. Slack → Alle Notfälle
  if (process.env.SLACK_EMERGENCY_WEBHOOK) {
    await sendSlackAlert(analysis);
  }

  // 2. Email → Alle Notfälle
  if (process.env.EMERGENCY_ALERT_EMAIL) {
    await sendEmailAlert(analysis);
  }

  // 3. PagerDuty → Nur P0/P1
  if (process.env.PAGERDUTY_INTEGRATION_KEY && 
      (analysis.severity === 'P0' || analysis.severity === 'P1')) {
    await sendPagerDutyAlert(analysis);
  }

  // 4. Console → Immer
  console.log('🚨 PAYMENT EMERGENCY:', analysis);
}
```

---

## 📊 Severity Levels

| Severity | Priority | PagerDuty | Beschreibung |
|----------|----------|-----------|--------------|
| **P0** | CRITICAL | ✅ Ja | Total Outage, Umsatzverlust |
| **P1** | HIGH | ✅ Ja | Degraded Service, hoher Impact |
| **P2** | MEDIUM | ❌ Nein | Partielle Issues, mittlerer Impact |
| **P3** | LOW | ❌ Nein | Minor Issues, geringer Impact |

---

## 🚀 Erweiterte Integration

### Jira/GitHub Issues
Füge in `sendEmergencyAlerts()` hinzu:

```typescript
// Jira Ticket
const jiraResponse = await fetch('https://your-domain.atlassian.net/rest/api/3/issue', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: {
      project: { key: 'PAYMENT' },
      summary: `[${analysis.severity}] Payment Emergency: ${analysis.metadata.issueType}`,
      description: analysis.communicationTemplate.internal,
      issuetype: { name: 'Bug' },
      priority: { name: analysis.priority }
    }
  })
});
```

### Microsoft Teams
```typescript
// Teams Webhook
const teamsPayload = {
  '@type': 'MessageCard',
  'title': `🚨 Payment Emergency: ${analysis.severity}`,
  'text': analysis.communicationTemplate.internal,
  'themeColor': analysis.severity === 'P0' ? 'FF3B30' : 'FF9500'
};
```

---

## ✅ Testing

### Test Emergency Alert
```bash
curl -X POST http://localhost:3000/api/payments/ml/emergency-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "issueType": "gateway-down",
    "description": "Payment Gateway nicht erreichbar seit 10 Minuten",
    "affectedCustomers": 1500,
    "financialImpact": 120000,
    "systemsAffected": ["Payment Gateway", "Checkout"]
  }'
```

### Erwartetes Verhalten
1. ✅ **GPT-4o-mini Analyse** läuft
2. ✅ **Severity** wird bestimmt (P0-P3)
3. ✅ **Slack Message** wird gesendet (falls konfiguriert)
4. ✅ **PagerDuty Incident** wird erstellt (P0/P1 nur)
5. ✅ **Console Log** wird ausgegeben
6. ✅ **Email** wird gequeued (falls konfiguriert)

---

## 🔒 Security Best Practices

1. **Niemals** Webhook-URLs/Keys in Git committen
2. Nutze **Environment Variables** (.env)
3. In Production: **Secrets Management** (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Rotate Keys** regelmäßig
5. **Monitor** Failed Alerts (z.B. via Sentry)

---

## 📚 Weitere Integrationen

- **Discord**: Ähnlich wie Slack Webhook
- **Telegram Bot**: Für mobile Alerts
- **Twilio SMS**: Für P0 Critical Alerts
- **Opsgenie**: Alternative zu PagerDuty
- **VictorOps/Splunk**: Enterprise Incident Management

---

## 🆘 Support

Bei Fragen zur Emergency Alerting Setup:
1. Siehe `.env.example` für alle Config-Optionen
2. Logs prüfen: `backend/logs/emergency.log`
3. Test-Endpoint nutzen: `/api/payments/ml/emergency-analysis`
