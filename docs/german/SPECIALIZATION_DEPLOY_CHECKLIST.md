# Spezialisierung Deploy Checkliste

## Übersicht

Checkliste für die Bereitstellung und Konfiguration des Spezialisierungs-Systems in Produktion.

**Letzte Aktualisierung**: 3. Januar 2026  
**Zielversion**: v1.0.0

---

## Phase 1: Vor der Bereitstellung

### Encryption Key Vorbereitung

- [ ] Generiere neuen 32-Byte Encryption Key (nur erste Bereitstellung)
  ```bash
  openssl rand -hex 32
  ```

- [ ] Speichere Key sicher
  ```bash
  # In AWS Secrets Manager, Azure Key Vault oder HashiCorp Vault
  ```

- [ ] Dokumentiere Key Backup-Ort
  - **Lokation**: ___________________
  - **Zugriff**: ___________________
  - **Notfall-Kontakt**: ___________________

### Public Key Konfiguration

- [ ] Besorge Public Key von kaufe-es.eu
  ```
  Kontakt: ___________________
  Erhalten am: ___________________
  ```

- [ ] Speichere als Environment-Variable
  ```bash
  export SPEC_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
  ...
  -----END PUBLIC KEY-----"
  ```

- [ ] Validiere Key Format (RSA 2048 oder höher)
  ```bash
  openssl rsa -in key.pem -text -noout
  ```

### Docker-Image Vorbereitung

- [ ] Baue Docker Image
  ```bash
  docker build -t a-r-i:latest .
  ```

- [ ] Teste Image lokal
  ```bash
  docker run -it a-r-i:latest /bin/sh
  ```

- [ ] Überprüfe docker-entrypoint.sh
  - [ ] Skript ist ausführbar
  - [ ] connection.json wird korrekt initialisiert
  - [ ] Encryption Key wird generiert/geladen

---

## Phase 2: Docker-Entrypoint Konfiguration

### connection.json Initialization

Das folgende Skript läuft automatisch beim Docker-Start:

```bash
# In /docker-entrypoint.sh
if [ ! -f connection.json ]; then
  echo "Initialisiere connection.json..."
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  echo "{
    \"woocommerce\": { /* ... */ },
    \"specialization\": {
      \"encryptionKey\": \"$ENCRYPTION_KEY\"
    }
  }" > connection.json
fi
```

**Überprüfung**:
- [ ] connection.json wird beim Start erstellt
- [ ] Encryption Key wird als 64-Zeichen hex gespeichert
- [ ] Docker Volume bleibt persistent über Container-Neustarts
- [ ] Logs zeigen "✅ connection.json initialisiert"

### Environment-Variablen

Setze folgende in Docker Compose oder Kubernetes:

```yaml
environment:
  - SPEC_PUBLIC_KEY=${KAUFE_ES_PUBLIC_KEY}
  - LOG_LEVEL=info
  - NODE_ENV=production
```

- [ ] `SPEC_PUBLIC_KEY` ist gesetzt
- [ ] `LOG_LEVEL=info` (Produktion)
- [ ] `NODE_ENV=production`

---

## Phase 3: Spezialisierungen Testen

### Backend Service Check

```bash
# Starte Container
docker-compose up backend

# Prüfe Logs
docker logs <container-id> | grep "Specialization\|Public Key\|connection.json"
```

**Erforderliche Logs**:
- [ ] "✅ Public Key aus SPEC_PUBLIC_KEY Env-Variable geladen"
- [ ] "✅ connection.json initialisiert"
- [ ] "✅ Encryption Key geladen"

### API Tests

```bash
# Test: Spezialisierung hochladen
curl -X POST http://localhost:3000/api/specializations \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d @test-specialization.json

# Erwartete Antwort:
# { "success": true, "message": "Spezialisierung erfolgreich hochgeladen" }
```

- [ ] Upload-Endpoint antwortet
- [ ] Spezialisierung wird verschlüsselt gespeichert
- [ ] userId wird aus Header gelesen

### Signature Validation Test

```bash
# Test: Ungültige Signatur
curl -X POST http://localhost:3000/api/specializations \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"data": {...}, "signature": "INVALID"}'

# Erwartete Antwort:
# { "success": false, "error": "❌ Signatur-Validierung fehlgeschlagen" }
```

- [ ] Fehlerhafte Signaturen werden abgelehnt
- [ ] Logs zeigen Validierungsfehler

---

## Phase 4: Produktions-Checks

### Sicherheit

- [ ] HTTPS/TLS ist aktiviert
- [ ] Private Keys nicht im Docker Image
- [ ] connection.json läuft über Volume (nicht im Image)
- [ ] Logs enthalten keine sensiblen Daten
- [ ] Firewall blockiert Zugriff auf /data Verzeichnis

### Performance

- [ ] Specialization Verschlüsselung < 500ms
- [ ] Database Queries < 100ms
- [ ] Upload großer Dateien funktioniert (Max: 50MB)

```bash
# Performance Test
time curl -X POST http://localhost:3000/api/specializations \
  -F "spec=@large-file.ari-spec"
```

- [ ] Response Time < 2s
- [ ] Memory Leak kein erkennbar
- [ ] CPU-Nutzung < 50%

### Logging

```bash
# Überprüfe Produktions-Logs
docker logs <container-id> 2>&1 | tail -100
```

- [ ] Logs enthalten keine Fehler (außer erwarteten Validierungsfehlern)
- [ ] Keine deprecated API warnings
- [ ] Encryption operations werden geloggt

### Backup & Recovery

- [ ] connection.json wird täglich gebackupt
- [ ] Backup-Speicherort ist dokumentiert
- [ ] Recovery-Prozedur wurde getestet
- [ ] Private Keys sind in separatem Secrets Manager

```bash
# Backup
cp connection.json connection.json.backup.$(date +%Y%m%d)
# or
aws s3 cp connection.json s3://backups/connection.json.$(date +%Y%m%d)
```

---

## Phase 5: Deployment Verification

### Pre-Production Sign-Off

- [ ] Alle Tests passed
- [ ] Code Review abgeschlossen
- [ ] Security Review abgeschlossen
- [ ] Performance Tests erfolgreich
- [ ] Stakeholder geben Freigabe

### Deployment Steps

```bash
# 1. Backup aktueller Daten
./backup.sh

# 2. Baue und pushe Image
docker build -t registry/a-r-i:v1.0.0 .
docker push registry/a-r-i:v1.0.0

# 3. Deploye mit Blue-Green Strategy
kubectl set image deployment/a-r-i \
  a-r-i=registry/a-r-i:v1.0.0 --record

# 4. Warte auf Rollout
kubectl rollout status deployment/a-r-i

# 5. Smoke Tests
./smoke-tests.sh
```

- [ ] Image erfolgreich gebaut und gepusht
- [ ] Deployment erfolgreich
- [ ] Services antworten
- [ ] Smoke Tests bestanden

### Rollback Plan

Wenn Probleme auftreten:

```bash
# Sofortiger Rollback
kubectl rollout undo deployment/a-r-i

# Oder zurück zum vorigen Image
docker pull registry/a-r-i:v0.9.9
kubectl set image deployment/a-r-i \
  a-r-i=registry/a-r-i:v0.9.9 --record
```

- [ ] Rollback-Prozedur dokumentiert
- [ ] Rollback wurde getestet
- [ ] On-Call Ingenieur ist erreichbar

---

## Phase 6: Post-Deployment

### Monitoring

```bash
# Logs überwachen
kubectl logs -f deployment/a-r-i --all-containers

# Metrics
kubectl top pods -l app=a-r-i
```

- [ ] Logs werden gesamelt
- [ ] Metrics werden exportiert
- [ ] Alerts sind konfiguriert

### Dokumentation Aktualisieren

- [ ] Produktions-Keys dokumentieren (intern nur)
- [ ] Deployment-Datum aufzeichnen
- [ ] Known Issues aufschreiben
- [ ] Changelog aktualisieren

### Team Notification

- [ ] Team wird benachrichtigt
- [ ] Release Notes werden gesendet
- [ ] Documentations-Links werden gesendet
- [ ] Support-Team wird trainiert

---

## Troubleshooting

### Problem: "Public Key nicht geladen"

```bash
# Überprüfe Environment-Variable
echo $SPEC_PUBLIC_KEY

# Sollte mit "-----BEGIN PUBLIC KEY-----" starten
# Überprüfe Docker Compose / Kubernetes Secret
```

**Lösung**:
- [ ] SPEC_PUBLIC_KEY in Secrets Manager überprüfen
- [ ] Secrets neu laden
- [ ] Container neu starten

### Problem: "connection.json wird nicht initialisiert"

```bash
# Überprüfe Docker Volume
docker volume ls
docker volume inspect <volume-name>

# Prüfe Entrypoint Logs
docker logs <container-id> | grep "connection.json"
```

**Lösung**:
- [ ] Volume-Berechtigungen überprüfen
- [ ] docker-entrypoint.sh ist ausführbar
- [ ] Verzeichnis /app ist beschreibbar

### Problem: "Signatur-Validierung fehlgeschlagen"

```bash
# Überprüfe Public Key Format
openssl rsa -in key.pem -pubin -text -noout

# Prüfe Issuer in Specialization-Datei
jq '.issuer' test-spec.json
```

**Lösung**:
- [ ] Public Key ist valides RSA Format
- [ ] Issuer ist "kaufe-es.eu"
- [ ] Signature wurde mit privatem Schlüssel erstellt

---

## Kontakte & Referenzen

| Rolle | Name | Kontakt |
|-------|------|---------|
| DevOps Lead | ___________ | ___________ |
| Security Lead | ___________ | ___________ |
| Product Owner | ___________ | ___________ |
| On-Call | ___________ | ___________ |

**Wichtige Links**:
- [Specialization Key Management](./SPECIALIZATION_KEY_MANAGEMENT.md)
- [Backend TODO Cleanup](./BACKEND_TODO_CLEANUP.md)
- [Docker Setup Guide](./docker-setup.md) (falls vorhanden)
- [Connection JSON Init](./connection-json-init.md)

---

**Checkliste Datum**: _____________  
**Durchgeführt von**: _____________  
**Genehmigt von**: _____________

