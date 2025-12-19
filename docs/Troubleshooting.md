# Troubleshooting – KI-Agent Business Plattform

Hier findest du schnelle Hilfe bei typischen Problemen und Störungen rund um die KI-Agent Plattform.

---

## Container startet nicht

- **Prüfe, ob Docker und Docker Compose installiert sind.**
- **Sind alle Ports frei?** (Standard: 5173 für Frontend, 3000 für Backend)
- **Fehlermeldung im Terminal?** Logs anzeigen mit:
  
  
  ```bash
  docker compose logs
  ```
  
- **Genügend Speicher/Ressourcen verfügbar?**

---

## Frontend lädt nicht / ist nicht erreichbar

- **Ist der Container gestartet?**
- **Rufe die URL im Browser auf:** `http://localhost:5173`
- **Browser-Cache leeren**
- **Logs prüfen:**
  
  
  ```bash
  docker compose logs frontend
  ```
  

---

## Backend/API funktioniert nicht

- **Backend-Container läuft?**
- **API-URL korrekt in der Settings-UI?**
- **Logs prüfen:**
  
  
  ```bash
  docker compose logs backend
  ```
  
- **connection.json korrekt ausgefüllt?**

---

## Verbindung zu externen Diensten (OpenAI, Shop, E-Mail) schlägt fehl

- **API-Keys und Zugangsdaten in der `connection.json` korrekt?**
- **Internetverbindung vorhanden?**
- **Fehlermeldung im Log?**
- **Rate Limits oder Zugangsbeschränkungen?**

---

## Einstellungen lassen sich nicht speichern / Import funktioniert nicht

- **Dateiformat der `connection.json` prüfen (UTF-8, gültige Struktur)**
- **Import-Funktion in der Settings-UI korrekt genutzt?**
- **Browser-Konsole auf Fehler prüfen**

### 400 Bad Request beim Speichern der Einstellungen

- Prüfe, ob innerhalb einer Gruppe (WordPress, WooCommerce, OpenAI) nur teilweise Felder befüllt wurden. Entweder komplett korrekt ausfüllen – oder Gruppe leer lassen.
- Wenn `Job-Modus = Intervall`: `Job-Intervall (ms)` muss zwischen 10 000 und 86 400 000 liegen (10 s–24 h). Bei `einmalig` wird das Intervall ignoriert.
- Backend-Logs zeigen genaue Hinweise zu Feld und Regel:
  
  ```bash
  docker compose logs backend | grep "Validation failed"
  ```
  
  oder gesamtes Log prüfen:
  
  ```bash
  docker compose logs -f backend
  ```

---

## System reagiert langsam oder hängt

- **Genügend Ressourcen (CPU/RAM) verfügbar?**
- **Zu viele parallele Jobs oder Nutzer?**
- **Logs auf Fehler oder Warnungen prüfen**
- **Container neu starten:**
  
  
  ```bash
  docker compose restart
  ```
  

---

## Fehler bleibt bestehen / nichts hilft

- **Alle Logs sammeln und an den Support senden**
- **Genaue Fehlerbeschreibung notieren**
- **Support-Kontakt im Frontend oder per E-Mail nutzen**

---

Letzte Aktualisierung: Dezember 2025
