# Helm usage (A.R.I.)

Minimale Helm-Struktur unter `helm/ari` zum Deploy der App als einzelner Service (Backend + gebündeltes Frontend) auf Kubernetes.

## Werte anpassen
- `values.yaml`: `image.repository` + `image.tag` setzen (z.B. auf euren Registry-Pfad), ggf. `ingress.enabled` auf `true` und Host/TLS hinterlegen.
- Ressourcen/ReplicaCount nach Bedarf erhöhen.

## Install/Upgrade
```bash
helm upgrade --install ari ./helm/ari \
  --set image.repository=your-registry/ki-app \
  --set image.tag=latest \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ari.example.com
```

## Struktur
- `Chart.yaml`: Chart-Metadaten
- `values.yaml`: Default-Werte
- `templates/deployment.yaml`: Pod/Container (Port 3000)
- `templates/service.yaml`: ClusterIP-Service
- `templates/ingress.yaml`: Optionaler Ingress (TLS/Hosts per values)
- `templates/_helpers.tpl`: Namens-/Label-Helper

Hinweise
- `connection.json`/Secrets müsst ihr in K8s als Secret/ConfigMap bereitstellen; dieses Chart nimmt nur das Image/Port mit. Ergänzt bei Bedarf Volumes/Env im Deployment-Template.
- Für private Registries `image.registrySecrets` setzen und ein entsprechendes Secret anlegen (`kubectl create secret docker-registry ...`).
