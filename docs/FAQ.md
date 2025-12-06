# FAQ – KI-Agent Business Plattform

Hier findest du Antworten auf die häufigsten Fragen rund um die Nutzung, Einrichtung und Fehlerbehebung der KI-Agent Plattform.

---

## Allgemein

**Was ist die KI-Agent Business Plattform?**
Die Plattform automatisiert Geschäftsprozesse mit KI und bietet Tools für Analyse, Content, Marketing und Payment – alles als Container-Lösung, ohne Quellcode-Installation.

**Brauche ich Programmierkenntnisse?**
Nein. Die Plattform ist für Endnutzer konzipiert und wird komplett als Container bereitgestellt.

---

## Einrichtung & Start

**Wie starte ich das System?**
  
1. Stelle sicher, dass Docker und Docker Compose installiert sind.
2. Platziere die `connection.json` im Hauptverzeichnis.
3. Starte mit `docker compose up -d`.
4. Öffne das Frontend im Browser (`http://localhost:5173`).
  

**Wie importiere ich meine Zugangsdaten?**
Nutze die Import-Funktion in der Settings-UI, um die `connection.json` hochzuladen. Die Felder werden automatisch befüllt.

**Was mache ich bei Verbindungsproblemen?**
  
- Prüfe, ob alle Zugangsdaten korrekt sind.
- Starte die Container neu.
- Kontrolliere die Logs mit `docker compose logs`.
- Wende dich an den Support, falls das Problem bleibt.
  

---

## Nutzung & Funktionen

**Welche Tools sind enthalten?**
  
- Analytics & Reporting
- Content- und E-Mail-Generatoren
- Social Media Automation
- Payment- und Shop-Health-Checks
- u. v. m. (Details siehe Bedienungsanleitung)
  

**Wie kann ich neue Funktionen nutzen?**
Alle Funktionen sind direkt im Frontend verfügbar. Updates werden automatisch bereitgestellt.

---

## Fehler & Support

**Was tun bei Fehlern oder Störungen?**
  
- Logs prüfen (`docker compose logs`)
- Einstellungen kontrollieren
- System neu starten
- Support kontaktieren
  

**Wie erhalte ich Updates?**
Updates werden automatisch per Container-Update (Watchtower) installiert.
  
**Wo finde ich weitere Hilfe?**
  
- Bedienungsanleitung im `docs`-Ordner
- Support-Kontakt im Frontend
- Weitere Dokus unter `/docs`
  
---
  
Letzte Aktualisierung: Dezember 2025
