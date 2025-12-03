

# Update-Planung: Settings-UI & Konfigurationsmanagement

## Geplante Features

### 1. Download der aktuellen Konfiguration

- **Beschreibung:**
  - Ermögliche es dem Nutzer, die aktuelle `connection.json` direkt aus der Settings-UI als Datei herunterzuladen.
  - Optional: Auswahl, ob sensible Felder (z.B. Passwörter, API-Keys) maskiert oder ausgeblendet werden.

- **Vorteile:**
  - Einfache Sicherung und Migration der Konfiguration
  - Nutzerfreundlichkeit und Transparenz

### 2. Import/Export-Optimierung

- **Beschreibung:**
  - Import-Funktion ist bereits vorhanden (Datei-Upload und Mapping).
  - Export-Funktion (Download) ergänzt die Import-Logik.

- **Vorschlag:**
  - Download-Button neben dem Import-Button in der Settings-UI
  - Download-Name: `connection.json`

### 3. Sicherheit & UX

- **Beschreibung:**
  - Platzhalter in Input-Feldern helfen beim Ausfüllen, sensible Daten werden nicht angezeigt.
  - Nach Speichern/Verbinden werden Felder geleert (Privacy by Design).

- **Optional:**
  - Hinweistext für Nutzer, warum Felder nach Speichern leer sind

## Technische Umsetzung (Vorschlag)

- Download-Button in `Settings.tsx`:
  - Aktuellen State als JSON serialisieren
  - Blob erzeugen und als Datei herunterladen
  - Optional: Maskierung sensibler Felder

- Beispiel-Code:

```ts
const handleExportConfig = () => {
  const data = { ...credentials };
  // Optional: sensible Felder maskieren
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'connection.json';
  a.click();
  URL.revokeObjectURL(url);
};
```

## Erweiterungsideen

- Backup/Restore-Optionen
- Versionierung der Konfiguration
- Automatischer Download nach erfolgreichem Speichern

---

Letztes Update: 03.12.2025
