# Container Maintenance Guide - Update & Repair Modus

## Übersicht

A.R.I. bietet einen separaten **Maintenance Container** für sichere Updates und Reparaturen ohne Datenverlust. Der Maintenance-Workflow ermöglicht es, den Container mit einem neuen Image zu ersetzen, während alle Konfigurationsdaten vom alten Container übernommen werden.

### Wichtigste Merkmale

- ✅ **Zero-Config-Loss**: Configs werden vom alten Container kopiert
- ✅ **Kein erneutes Onboarding**: `connection.json` und `.env.production` bleiben erhalten
- ✅ **Getrennte Scripts**: Produktions-Container bleibt unberührt
- ✅ **Kubernetes/Terraform ready**: Standard K8s Jobs/CronJobs verwendbar
- ✅ **Fail-Fast**: Script bricht bei fehlenden Configs sofort ab

---

## Unterschied: Update vs. Repair (Kill)

Beide Modi verhalten sich **identisch** - der Unterschied ist nur semantisch für Monitoring/Logging:

| Modus | Verwendung | Verhalten |
|-------|------------|-----------|
| **update** | Geplante Updates, neue Features | Kopiert Configs, startet mit neuem Image |
| **repair** (kill) | Defekter Container, Crash Recovery | Kopiert Configs, startet mit neuem Image |

**Technisch:** Beide Modi führen den gleichen Prozess aus:
1. Configs vom alten Container kopieren
2. Alten Container stoppen
3. Neuen Container mit frischem Image + übernommenen Configs starten

---

## Dateien

### Production (Standard)
- `docker-compose.yml` - Normaler Produktionsbetrieb
- `backend/docker-entrypoint.sh` - Erstellt neue Configs bei erstem Start

### Maintenance (Update/Repair)
- `maintenance-docker-compose.yml` - Separates Compose-File für Wartung
- `backend/maintenance-entrypoint.sh` - Kopiert Configs vom alten Container

---

## Workflow: Container Update mit Docker Compose

### Schritt 1: Alter Container läuft

```bash
docker-compose up -d
# Container läuft auf Port 3000
```

### Schritt 2: Maintenance Container starten (parallel)

```bash
docker-compose -f maintenance-docker-compose.yml up -d
```

**Was passiert:**
- Neuer Container startet auf Port 3001
- Kopiert `connection.json` vom alten Container
- Kopiert `.env.production` vom alten Container
- Läuft parallel zum alten Container

### Schritt 3: Alten Container stoppen

```bash
docker-compose down
# Alter Container wird gestoppt und entfernt
```

### Schritt 4: Maintenance Container auf Port 3000 umstellen

```bash
# Maintenance Container stoppen
docker-compose -f maintenance-docker-compose.yml down

# Mit normalem Compose neu starten (hat jetzt die übernommenen Configs)
docker-compose up -d
```

**Ergebnis:** Container läuft mit neuem Image und alten Configs - **kein Onboarding nötig!**

---

## Workflow: Container Update mit Kubernetes

### Einmalige Updates (Job)

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ari-maintenance-update
spec:
  template:
    spec:
      containers:
      - name: ari-maintenance
        image: your-registry/ari:latest
        command: ["/bin/sh", "-c"]
        args: ["/app/maintenance-entrypoint.sh && node dist/index.js"]
        env:
        - name: MODE
          value: "update"
        - name: NODE_ENV
          value: "production"
        volumeMounts:
        - name: old-container-data
          mountPath: /mnt/old/data
          readOnly: true
        - name: old-container-root
          mountPath: /mnt/old
          readOnly: true
        - name: app-data
          mountPath: /app/data
      volumes:
      - name: old-container-data
        persistentVolumeClaim:
          claimName: ari-data-pvc
      - name: old-container-root
        persistentVolumeClaim:
          claimName: ari-root-pvc
      - name: app-data
        emptyDir: {}
      restartPolicy: OnFailure
```

### Zeitgesteuerte Updates (CronJob)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ari-maintenance-scheduled
spec:
  schedule: "0 2 * * *"  # Täglich um 2 Uhr nachts
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ari-maintenance
            image: your-registry/ari:latest
            command: ["/bin/sh", "-c"]
            args: ["/app/maintenance-entrypoint.sh && node dist/index.js"]
            env:
            - name: MODE
              value: "repair"
            - name: NODE_ENV
              value: "production"
            volumeMounts:
            - name: old-container-data
              mountPath: /mnt/old/data
              readOnly: true
            - name: old-container-root
              mountPath: /mnt/old
              readOnly: true
            - name: app-data
              mountPath: /app/data
          volumes:
          - name: old-container-data
            persistentVolumeClaim:
              claimName: ari-data-pvc
          - name: old-container-root
            persistentVolumeClaim:
              claimName: ari-root-pvc
          - name: app-data
            emptyDir: {}
          restartPolicy: OnFailure
```

**Cron-Syntax Beispiele:**
- `"0 2 * * *"` - Täglich um 2:00 Uhr
- `"0 2 * * 0"` - Jeden Sonntag um 2:00 Uhr
- `"0 */6 * * *"` - Alle 6 Stunden

---

## Terraform Integration

### Beispiel: K8s CronJob mit Terraform

```hcl
resource "kubernetes_cron_job_v1" "ari_maintenance" {
  metadata {
    name      = "ari-maintenance"
    namespace = "production"
  }

  spec {
    schedule = "0 2 * * *"

    job_template {
      metadata {}
      
      spec {
        template {
          metadata {}
          
          spec {
            container {
              name  = "ari-maintenance"
              image = "your-registry/ari:latest"
              
              command = ["/bin/sh", "-c"]
              args    = ["/app/maintenance-entrypoint.sh && node dist/index.js"]

              env {
                name  = "MODE"
                value = "update"
              }

              env {
                name  = "NODE_ENV"
                value = "production"
              }

              volume_mount {
                name       = "old-data"
                mount_path = "/mnt/old/data"
                read_only  = true
              }

              volume_mount {
                name       = "old-root"
                mount_path = "/mnt/old"
                read_only  = true
              }
            }

            volume {
              name = "old-data"
              persistent_volume_claim {
                claim_name = "ari-data-pvc"
              }
            }

            volume {
              name = "old-root"
              persistent_volume_claim {
                claim_name = "ari-root-pvc"
              }
            }

            restart_policy = "OnFailure"
          }
        }
      }
    }
  }
}
```

---

## Umgebungsvariablen

| Variable | Werte | Beschreibung |
|----------|-------|--------------|
| `MODE` | `update`, `repair` (kill) | Betriebsmodus (semantisch, technisch identisch) |
| `NODE_ENV` | `production` | Node.js Umgebung |
| `PORT` | `3000` (Standard) | API Port |

---

## Volume Mapping

### Docker Compose

```yaml
volumes:
  # Alter Container (read-only)
  - ari-old-data:/mnt/old/data:ro      # .env.production
  - ari-old-root:/mnt/old:ro           # connection.json
  
  # Neuer Container (read-write)
  - ./backend/data:/app/data:rw
  - ./.env.production:/app/.env.production:ro
```

### Kubernetes

```yaml
volumeMounts:
  - name: old-container-data
    mountPath: /mnt/old/data
    readOnly: true
  - name: old-container-root
    mountPath: /mnt/old
    readOnly: true
  - name: app-data
    mountPath: /app/data
```

---

## Fehlerbehandlung

### Script bricht ab wenn:

```bash
# connection.json nicht gefunden
[Maintenance] ❌ FEHLER: /mnt/old/connection.json nicht gefunden!
exit 1

# .env.production nicht gefunden
[Maintenance] ❌ FEHLER: /mnt/old/data/.env.production nicht gefunden!
exit 1
```

**Fail-Fast-Strategie:** Keine halbgaren Zustände - wenn Configs fehlen, crasht der Container sofort.

### Troubleshooting

| Problem | Ursache | Lösung |
|---------|---------|--------|
| `connection.json nicht gefunden` | Volume nicht gemountet | Shared Volumes prüfen |
| `.env.production nicht gefunden` | Volume nicht gemountet | Shared Volumes prüfen |
| Container startet nicht | Permissions falsch | `chown nodeuser:nodejs` |
| Alter Container läuft noch | Nicht gestoppt | `docker-compose down` |

---

## Sicherheit

### Best Practices

1. **Read-Only Mounts:** Alte Container-Volumes nur read-only mounten
2. **Secrets Management:** Sensitive Daten in K8s Secrets statt Files
3. **RBAC:** K8s Service Accounts mit minimalen Permissions
4. **Image Scanning:** Neue Images vor Deployment scannen
5. **Rollback Plan:** Alte Images behalten für schnelles Rollback

### Permissions

```bash
# Automatisch gesetzt durch maintenance-entrypoint.sh
chown nodeuser:nodejs /app/connection.json
chmod 600 /app/connection.json
chown nodeuser:nodejs /app/data/.env.production
chmod 600 /app/data/.env.production
```

---

## Zero-Downtime Deployment

### Mit NGINX Load Balancer

```nginx
upstream backend {
    server app:3000;      # Alter Container
    server app-new:3001;  # Neuer Container (Maintenance)
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

**Workflow:**
1. Maintenance Container auf 3001 starten
2. NGINX leitet Traffic um auf 3001
3. Alten Container (3000) stoppen
4. Maintenance Container auf 3000 umstellen
5. NGINX zurück auf 3000

---

## Monitoring & Logging

### Logs anzeigen

```bash
# Docker Compose
docker-compose -f maintenance-docker-compose.yml logs -f

# Kubernetes
kubectl logs -f job/ari-maintenance-update
```

### Erfolgreiche Ausführung

```
[Maintenance] 🔧 Starte A.R.I. Maintenance Container: update Mode
[Maintenance] 📁 Erstelle benötigte Verzeichnisse...
[Maintenance] 🔐 Setze korrekte Berechtigungen...
[Maintenance] 📋 Kopiere connection.json vom alten Container...
[Maintenance] ✅ connection.json kopiert (2847 bytes)
[Maintenance] 📋 Kopiere .env.production vom alten Container...
[Maintenance] ✅ .env.production kopiert
[Maintenance] ✅ A.R.I. Maintenance Container (update) bereit...
[Maintenance] 📝 Configs übernommen - Onboarding nicht erforderlich!
```

---

## FAQ

### Muss ich nach Update erneut durch Onboarding?

**Nein!** Der Maintenance Container kopiert beide Config-Dateien (`connection.json` + `.env.production`), daher ist kein Onboarding nötig.

### Was passiert wenn Configs fehlen?

Script bricht sofort ab (Exit 1). Kein halbgarer Zustand, kein Silent Failure.

### Unterschied zwischen update und repair?

Technisch identisch - nur der Modus-Name ändert sich (für Logging/Monitoring).

### Kann ich automatische Updates einrichten?

Ja, mit K8s CronJob. Beispiel: `schedule: "0 2 * * *"` für tägliche Updates um 2 Uhr.

### Was ist wenn der alte Container schon gestoppt ist?

Dann fehlen die Shared Volumes und das Script bricht ab. Lösung: Alten Container kurz starten oder Configs manuell bereitstellen.

### Funktioniert das mit Automattic/WordPress.com?

Ja! Standard K8s Pattern, Terraform-kompatibel. Automattic kann CronJobs für automatische Updates nutzen.

---

## Support

Bei Problemen:
1. Logs prüfen: `docker-compose logs` oder `kubectl logs`
2. Volume Mounts verifizieren
3. Permissions prüfen
4. GitHub Issues: [AndreZ1971/ki](https://github.com/AndreZ1971/ki/issues)

---

**Version:** 7.5.0  
**Letzte Aktualisierung:** Januar 2026  
**Getestet mit:** Docker 24.x, Kubernetes 1.28+, Terraform 1.6+
