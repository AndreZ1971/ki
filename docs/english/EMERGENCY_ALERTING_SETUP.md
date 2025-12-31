# 🚨 Emergency Alerting Setup Guide

## Overview

The Payment Emergency System uses **GPT-4o-mini** to analyze critical incidents and automatically sends alerts to configured channels.

---

## 🎯 Supported Alerting Channels

### 1. **Slack** 💬
- **Type**: Instant Messaging
- **Trigger**: All emergencies (P0-P3)
- **Format**: Rich Message with Ticket-ID, Severity, Impact, Escalation Path

**Setup:**
```bash
# 1. Create Slack Incoming Webhook
# https://api.slack.com/messaging/webhooks

# 2. Add to .env
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Slack Message Example:**
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
- **Type**: Email Notification
- **Trigger**: All emergencies (P0-P3)
- **Format**: HTML Email with complete incident analysis

**Setup:**
```bash
# Add to .env
EMERGENCY_ALERT_EMAIL=devops@your-company.com,oncall@your-company.com
```

**Prerequisites:**
- Uses your existing email system
- Integrate in `backend/services/emailService.ts`
- SMTP configuration required

---

### 3. **PagerDuty** 📟
- **Type**: Incident Management & On-Call Alerting
- **Trigger**: P0/P1 only (Critical/High)
- **Format**: PagerDuty Event with Custom Details

**Setup:**
```bash
# 1. Create PagerDuty Service
# https://support.pagerduty.com/docs/services-and-integrations

# 2. Copy Events API v2 Integration Key

# 3. Add to .env
PAGERDUTY_INTEGRATION_KEY=your-integration-key-here
```

**PagerDuty Features:**
- ✅ Automatic Incident Creation for P0/P1
- ✅ On-Call Engineer is immediately notified
- ✅ Escalation Policies are followed
- ✅ Custom Details with Ticket-ID, Impact, Revenue Risk

---

### 4. **Console Logging** 📋
- **Type**: Server Console Output
- **Trigger**: Always active (all emergencies)
- **Format**: Formatted ASCII-Box Log

**No setup required** - always active!

**Console Output Example:**
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

## 🔧 Configuration

### Backend (.env)
```bash
# Slack
SLACK_EMERGENCY_WEBHOOK=https://hooks.slack.com/services/...

# Email
EMERGENCY_ALERT_EMAIL=devops@company.com

# PagerDuty (P0/P1 only)
PAGERDUTY_INTEGRATION_KEY=your-key-here
```

### Alert Logic
```typescript
// In backend/routes/app/api/payments.ts

async function sendEmergencyAlerts(analysis: any): Promise<void> {
  // 1. Slack → All emergencies
  if (process.env.SLACK_EMERGENCY_WEBHOOK) {
    await sendSlackAlert(analysis);
  }

  // 2. Email → All emergencies
  if (process.env.EMERGENCY_ALERT_EMAIL) {
    await sendEmailAlert(analysis);
  }

  // 3. PagerDuty → P0/P1 only
  if (process.env.PAGERDUTY_INTEGRATION_KEY && 
      (analysis.severity === 'P0' || analysis.severity === 'P1')) {
    await sendPagerDutyAlert(analysis);
  }

  // 4. Console → Always
  console.log('🚨 PAYMENT EMERGENCY:', analysis);
}
```

---

## 📊 Severity Levels

| Severity | Priority | PagerDuty | Description |
|----------|----------|-----------|-------------|
| **P0** | CRITICAL | ✅ Yes | Total Outage, Revenue Loss |
| **P1** | HIGH | ✅ Yes | Degraded Service, High Impact |
| **P2** | MEDIUM | ❌ No | Partial Issues, Medium Impact |
| **P3** | LOW | ❌ No | Minor Issues, Low Impact |

---

## 🚀 Advanced Integration

### Jira/GitHub Issues
Add to `sendEmergencyAlerts()`:

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
    "description": "Payment Gateway unreachable for 10 minutes",
    "affectedCustomers": 1500,
    "financialImpact": 120000,
    "systemsAffected": ["Payment Gateway", "Checkout"]
  }'
```

### Expected Behavior
1. ✅ **GPT-4o-mini Analysis** runs
2. ✅ **Severity** is determined (P0-P3)
3. ✅ **Slack Message** is sent (if configured)
4. ✅ **PagerDuty Incident** is created (P0/P1 only)
5. ✅ **Console Log** is output
6. ✅ **Email** is queued (if configured)

---

## 🔒 Security Best Practices

1. **Never** commit Webhook-URLs/Keys to Git
2. Use **Environment Variables** (.env)
3. In Production: **Secrets Management** (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Rotate Keys** regularly
5. **Monitor** Failed Alerts (e.g., via Sentry)

---

## 📚 Additional Integrations

- **Discord**: Similar to Slack Webhook
- **Telegram Bot**: For mobile alerts
- **Twilio SMS**: For P0 Critical Alerts
- **Opsgenie**: Alternative to PagerDuty
- **VictorOps/Splunk**: Enterprise Incident Management

---

## 🆘 Support

For questions about Emergency Alerting Setup:
1. See `.env.example` for all config options
2. Check logs: `backend/logs/emergency.log`
3. Use test endpoint: `/api/payments/ml/emergency-analysis`
