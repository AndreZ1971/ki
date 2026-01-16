# Container Maintenance Guide - Update & Repair Mode

## Overview

A.R.I. provides a separate **Maintenance Container** for safe updates and repairs without data loss. The maintenance workflow allows replacing the container with a new image while preserving all configuration data from the old container.

### Key Features

- ✅ **Zero-Config-Loss**: Configs are copied from the old container
- ✅ **No Re-Onboarding**: `connection.json` and `.env.production` are preserved
- ✅ **Separate Scripts**: Production container remains untouched
- ✅ **Kubernetes/Terraform Ready**: Standard K8s Jobs/CronJobs compatible
- ✅ **Fail-Fast**: Script aborts immediately if configs are missing

---

## Difference: Update vs. Repair (Kill)

Both modes behave **identically** - the difference is purely semantic for monitoring/logging:

| Mode | Use Case | Behavior |
|------|----------|----------|
| **update** | Planned updates, new features | Copies configs, starts with new image |
| **repair** (kill) | Broken container, crash recovery | Copies configs, starts with new image |

**Technical:** Both modes execute the same process:
1. Copy configs from old container
2. Stop old container
3. Start new container with fresh image + copied configs

---

## Files

### Production (Standard)
- `docker-compose.yml` - Normal production operation
- `backend/docker-entrypoint.sh` - Creates new configs on first start

### Maintenance (Update/Repair)
- `maintenance-docker-compose.yml` - Separate compose file for maintenance
- `backend/maintenance-entrypoint.sh` - Copies configs from old container

---

## Workflow: Container Update with Docker Compose

### Step 1: Old Container Running

```bash
docker-compose up -d
# Container runs on port 3000
```

### Step 2: Start Maintenance Container (parallel)

```bash
docker-compose -f maintenance-docker-compose.yml up -d
```

**What happens:**
- New container starts on port 3001
- Copies `connection.json` from old container
- Copies `.env.production` from old container
- Runs in parallel with old container

### Step 3: Stop Old Container

```bash
docker-compose down
# Old container is stopped and removed
```

### Step 4: Switch Maintenance Container to Port 3000

```bash
# Stop maintenance container
docker-compose -f maintenance-docker-compose.yml down

# Restart with normal compose (now has copied configs)
docker-compose up -d
```

**Result:** Container runs with new image and old configs - **no onboarding required!**

---

## Workflow: Container Update with Kubernetes

### One-Time Updates (Job)

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

### Scheduled Updates (CronJob)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ari-maintenance-scheduled
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
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

**Cron Syntax Examples:**
- `"0 2 * * *"` - Daily at 2:00 AM
- `"0 2 * * 0"` - Every Sunday at 2:00 AM
- `"0 */6 * * *"` - Every 6 hours

---

## Terraform Integration

### Example: K8s CronJob with Terraform

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

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `MODE` | `update`, `repair` (kill) | Operation mode (semantic, technically identical) |
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` (default) | API port |

---

## Volume Mapping

### Docker Compose

```yaml
volumes:
  # Old container (read-only)
  - ari-old-data:/mnt/old/data:ro      # .env.production
  - ari-old-root:/mnt/old:ro           # connection.json
  
  # New container (read-write)
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

## Error Handling

### Script aborts when:

```bash
# connection.json not found
[Maintenance] ❌ ERROR: /mnt/old/connection.json not found!
exit 1

# .env.production not found
[Maintenance] ❌ ERROR: /mnt/old/data/.env.production not found!
exit 1
```

**Fail-Fast Strategy:** No half-baked states - if configs are missing, the container crashes immediately.

### Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `connection.json not found` | Volume not mounted | Check shared volumes |
| `.env.production not found` | Volume not mounted | Check shared volumes |
| Container won't start | Wrong permissions | `chown nodeuser:nodejs` |
| Old container still running | Not stopped | `docker-compose down` |

---

## Security

### Best Practices

1. **Read-Only Mounts:** Mount old container volumes as read-only
2. **Secrets Management:** Use K8s Secrets instead of files for sensitive data
3. **RBAC:** K8s Service Accounts with minimal permissions
4. **Image Scanning:** Scan new images before deployment
5. **Rollback Plan:** Keep old images for quick rollback

### Permissions

```bash
# Automatically set by maintenance-entrypoint.sh
chown nodeuser:nodejs /app/connection.json
chmod 600 /app/connection.json
chown nodeuser:nodejs /app/data/.env.production
chmod 600 /app/data/.env.production
```

---

## Zero-Downtime Deployment

### With NGINX Load Balancer

```nginx
upstream backend {
    server app:3000;      # Old container
    server app-new:3001;  # New container (Maintenance)
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

**Workflow:**
1. Start maintenance container on 3001
2. NGINX redirects traffic to 3001
3. Stop old container (3000)
4. Switch maintenance container to 3000
5. NGINX back to 3000

---

## Monitoring & Logging

### View Logs

```bash
# Docker Compose
docker-compose -f maintenance-docker-compose.yml logs -f

# Kubernetes
kubectl logs -f job/ari-maintenance-update
```

### Successful Execution

```
[Maintenance] 🔧 Starting A.R.I. Maintenance Container: update Mode
[Maintenance] 📁 Creating required directories...
[Maintenance] 🔐 Setting correct permissions...
[Maintenance] 📋 Copying connection.json from old container...
[Maintenance] ✅ connection.json copied (2847 bytes)
[Maintenance] 📋 Copying .env.production from old container...
[Maintenance] ✅ .env.production copied
[Maintenance] ✅ A.R.I. Maintenance Container (update) ready...
[Maintenance] 📝 Configs transferred - Onboarding not required!
```

---

## FAQ

### Do I need to go through onboarding again after update?

**No!** The maintenance container copies both config files (`connection.json` + `.env.production`), so no onboarding is needed.

### What happens if configs are missing?

Script aborts immediately (Exit 1). No half-baked state, no silent failure.

### What's the difference between update and repair?

Technically identical - only the mode name changes (for logging/monitoring).

### Can I set up automatic updates?

Yes, with K8s CronJob. Example: `schedule: "0 2 * * *"` for daily updates at 2 AM.

### What if the old container is already stopped?

Then shared volumes are missing and the script aborts. Solution: Briefly start old container or provide configs manually.

### Does this work with Automattic/WordPress.com?

Yes! Standard K8s pattern, Terraform-compatible. Automattic can use CronJobs for automatic updates.

---

## Support

For issues:
1. Check logs: `docker-compose logs` or `kubectl logs`
2. Verify volume mounts
3. Check permissions
4. GitHub Issues: [AndreZ1971/ki](https://github.com/AndreZ1971/ki/issues)

---

**Version:** 6.9.1  
**Last Updated:** January 2026  
**Tested with:** Docker 24.x, Kubernetes 1.28+, Terraform 1.6+
