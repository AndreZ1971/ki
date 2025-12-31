# Initialisierung und Handling der connection.json im Container

## Ziel

Beim Ausliefern des KI-Agenten als Container (z. B. für Kubernetes/IaaS) soll die Konfigurationsdatei `connection.json` im Backend-Verzeichnis liegen und vom Nutzer über die Settings-UI befüllt werden können.

## Konzept

- **Erstauslieferung:**
  - Beim ersten Start des Containers wird eine leere oder mit Platzhaltern gefüllte `connection.json` im Backend-Verzeichnis angelegt.
  - Die Datei ist für den Container-Prozess schreibbar.
  - Der Entrypoint erstellt die Datei mit sicheren Platzhaltern automatisch (Idempotent).
- **Kundeneinrichtung:**
  - Der Kunde öffnet die Settings-UI, trägt die Zugangsdaten (OpenAI, WooCommerce, E-Mail etc.) ein und speichert.
  - Die Daten werden in die `connection.json` geschrieben.
  - Das System ist danach sofort einsatzbereit und mit dem Shop verbunden.
  - Die API maskiert geheime Felder bei `GET` (z. B. `****`) und entmaskiert bei `POST`, d. h. unveränderte Secrets bleiben erhalten.
  - Die Settings-UI sendet ein verschachteltes Payload (z. B. `wordpress`, `woocommerce`, `openAI` …); das Backend mappt dies auf die flache Struktur in `connection.json`.
- **Rechte:**
  - Die Datei muss für den Container-Prozess (z. B. Node.js) schreibbar sein.
  - Idealerweise wird sie beim ersten Speichern vom Backend-Prozess selbst angelegt, damit die Rechte passen.
- **Erste Schritte für den Kunden:**
  - Nach dem Start: Settings-UI öffnen, Felder ausfüllen, speichern.
  - Anleitung dokumentiert, welche Daten benötigt werden und wie vorzugehen ist.

## Umsetzungsmöglichkeiten

- **Dockerfile/Entrypoint:**
  - Leere oder Platzhalter-`connection.json` beim Build oder Start anlegen.
  - Beispiel (Dockerfile):
    ```dockerfile
    RUN echo '{ "openai": { "apiKey": "" }, "woocommerce": { "url": "", "consumerKey": "", "consumerSecret": "" }, "email": { "host": "", "port": 465, "secure": true, "user": "", "pass": "" } }' > /app/connection.json
    ```
  - Beispiel (entrypoint.sh):
    ```sh
    [ -f /app/connection.json ] || cat > /app/connection.json <<EOF
    { ... }
    EOF
    ```

- **Kubernetes/IaaS:**
  - Init-Container oder Volume-Mounts können genutzt werden, um die Datei bereitzustellen.

## Vorteile
- Keine Secrets im Image/Quellcode
- Nutzer kann Setup selbst durchführen
- Sicheres, Cloud-taugliches Onboarding

---

**ToDo:**
- Bei Auslieferung Container-Init für `connection.json` implementieren
- Anleitung für "Erste Schritte" ergänzen
- Rechte und Pfad im Backend-Code dokumentieren

---

## Validierungsregeln (Server)

- Gruppen (WordPress, WooCommerce, OpenAI) sind optional. Sobald innerhalb einer Gruppe Felder befüllt werden, müssen die Pflichtfelder dieser Gruppe gültig sein.
- `jobMode`: "once" oder "interval".
  - "once": `jobIntervalMs` wird ignoriert.
  - "interval": `jobIntervalMs` muss im Bereich 10 000–86 400 000 ms (10 s–24 h) liegen.
- Fehlerantworten enthalten Feld- und Regelhinweise zur schnellen Korrektur.
