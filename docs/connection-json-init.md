# Initialisierung und Handling der connection.json im Container

## Ziel

Beim Ausliefern des KI-Agenten als Container (z. B. für Kubernetes/IaaS) soll die Konfigurationsdatei `connection.json` im Backend-Verzeichnis liegen und vom Nutzer über die Settings-UI befüllt werden können.

## Konzept

- **Erstauslieferung:**
  - Beim ersten Start des Containers wird eine leere oder mit Platzhaltern gefüllte `connection.json` im Backend-Verzeichnis angelegt.
  - Die Datei ist für den Container-Prozess schreibbar.
- **Kundeneinrichtung:**
  - Der Kunde öffnet die Settings-UI, trägt die Zugangsdaten (OpenAI, WooCommerce, E-Mail etc.) ein und speichert.
  - Die Daten werden in die `connection.json` geschrieben.
  - Das System ist danach sofort einsatzbereit und mit dem Shop verbunden.
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
