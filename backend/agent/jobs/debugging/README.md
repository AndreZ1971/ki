# 🔧 Debugging & Helper Tools

⚠️ **WICHTIG**: Dateien in diesem Ordner sind **NICHT Teil des Produktivsystems**.

Sie sind manuelle Debugging-Tools und Test-Hilfsmittel für Entwickler.

## Dateien

| Datei | Zweck | Status |
|-------|-------|--------|
| `paymentTester.ts` | Manuell: Payment-System testen | ⚠️ Hilfstool |
| `paymentVerifier.ts` | Manuell: Payment-Konfiguration verifizieren | ⚠️ Hilfstool |
| `paymentLiveFixer.ts` | Manuell: Payment-Probleme in Production debuggen | ⚠️ Hilfstool |
| `paymentQuickCheck.ts` | Manuell: Schneller Payment-Status Check | ⚠️ Hilfstool |
| `paymentDebugger.ts` | Manuell: Payment-Flow Debugging | ⚠️ Hilfstool |
| `paymentEmergency.ts` | Manuell: Payment-Notfall-Fixes | ⚠️ Hilfstool |
| `paymentFixCompanion.ts` | Manuell: Payment-Fix Begleiter | ⚠️ Hilfstool |
| `paymentFixer.ts` | Manuell: Payment-Fehler fixen | ⚠️ Hilfstool |
| `paymentIssueDetector.ts` | Manuell: Payment-Probleme erkennen | ⚠️ Hilfstool |
| `paymentSimpleFix.ts` | Manuell: Einfache Payment-Fixes | ⚠️ Hilfstool |
| `paymentSuccess.ts` | Manuell: Payment-Erfolgs-Tracker | ⚠️ Hilfstool |
| `paymentSuccessValidator.ts` | Manuell: Payment-Erfolg validieren | ⚠️ Hilfstool |

## ⚠️ Wichtige Hinweise

Diese Dateien:
- ❌ Werden **NICHT vom produktiven Agent-System importiert**
- ❌ Werden **NICHT automatisch ausgeführt**
- ✅ Sind nur manuell zu Debugging-Zwecken abrufbar
- ✅ Enthalten Test-Daten (z.B. "TEST Payment Product")
- ✅ Verwenden Sandbox-Accounts für manuelle Tests

## Verwendung

```bash
# Beispiel: Manuell ausführen (wenn nötig)
node dist/agent/jobs/debugging/paymentTester.js
```

## Echte Payment-Recovery

Der **echte** Payment-Recovery läuft über:
- `backend/agent/loops/paymentRecoveryLoop.ts` ← PRODUKTIV
- Nutzt **echte WooCommerce Orders-API**
- Macht **echte Order-Updates** via PUT requests
- ❌ **Keine Test-Daten**
