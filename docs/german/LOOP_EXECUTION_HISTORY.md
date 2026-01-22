# Loop Execution History

## Überblick

Die **Loop Execution History** Ansicht zeigt alle automatischen Cronjob-Ausführungen der Agentic Loops in einer übersichtlichen Darstellung.

## Zugriff

1. Navigiere zu **Settings** → **Agentic Loops**
2. Klicke auf den Button **📜 Cronjob History**

## Funktionen

### Loop Selektor (Kacheln oben)

Für jeden Loop siehst du eine Zusammenfassungskarte mit:

- **Loop Name & Icon**: Identifizierung des Loops
  - 🚨 Anomaly Detection
  - 📊 Product Performance
  - 💳 Payment Recovery
  - 📈 Analytics Insights

- **Erfolgsquote (%)**: Prozentualer Anteil erfolgreicher Runs (nur wenn Runs > 0)
- **Runs**: Anzahl aller Ausführungen für diesen Loop
- **Ø Dauer**: Durchschnittliche Ausführungsdauer

**Hinweis**: Wenn ein Loop noch nie ausgeführt wurde, erscheint statt Prozent- und Durchschnittswerten „–"

### Filter-Optionen

Drei Filterbuttons oben links:

- **Alle**: Zeigt alle Runs (Standard)
- **✅ Erfolgreich**: Nur erfolgreiche Runs
- **❌ Fehlgeschlagen**: Nur fehlgeschlagene Runs

Die Tabelle wird automatisch gefiltert.

### Export-Funktionen

Zwei Export-Buttons oben rechts:

- **📥 JSON**: Lädt die gefilterten Run-Ergebnisse als JSON-Datei
  - Ideal für Debugging, Weiterverarbeitung oder Archivierung
  - Enthält vollständige Metadaten (Timestamps, Insights, Empfehlungen)

- **📥 CSV**: Lädt die gefilterten Run-Ergebnisse als CSV-Datei
  - Ideal für Reporting und Excel/Sheets-Import
  - Tabellarisches Format mit Spalten: Zeitstempel, Status, Dauer, Insights, Empfehlungen

### History-Tabelle

Die Tabelle zeigt alle Runs des ausgewählten Loops mit folgenden Spalten:

| Spalte | Beschreibung |
|--------|-------------|
| **Zeitstempel** | Datum und Uhrzeit des Run-Starts |
| **Status** | ✅ Erfolg oder ❌ Fehler |
| **Dauer** | Wie lange der Run gedauert hat (ms/s/m) |
| **Insights** | Anzahl der generierten Insights |
| **Empfehlungen** | Anzahl der generierten Empfehlungen |

**Bei Fehlern**: Zeigt zusätzlich eine Fehlermeldung unter der Zeile an.

### Summary-Statistiken (unten)

Nach der Tabelle erscheint eine Zusammenfassung mit:

- **Gesamt**: Anzahl der gefilterten Runs
- **Erfolgsrate**: Prozentualer Anteil erfolgreicher Runs (Gesamt)
- **Ø Dauer**: Durchschnittliche Ausführungsdauer aller gefilterten Runs
- **Gesamt Insights**: Summe aller Insights über alle gefilterten Runs

## Automatische Cronjobs

Die Agentic Loops laufen automatisch nach festgelegten Zeitplänen:

- **Anomaly Detection**: Täglich um 09:00 Uhr
- **Product Performance**: Montag & Donnerstag um 10:00 Uhr
- **Payment Recovery**: Alle 30 Minuten
- **Analytics Insights**: Täglich um 20:00 Uhr

Die History zeigt alle diese automatischen Runs, nicht nur die manuell gestarteten.

## Häufige Fragen

**F: Warum sehe ich bei einigen Loops nur Striche „–"?**  
A: Das bedeutet, dass dieser Loop noch nicht ausgeführt wurde oder keine Daten vorhanden sind.

**F: Wie lange werden die Run-Historien gespeichert?**  
A: Die Historien werden im Memory-Store gespeichert. Beim Neustart des Systems können ältere Einträge verloren gehen. Nutze den Export, um wichtige Daten zu archivieren.

**F: Kann ich die Daten für längere Zeiträume exportieren?**  
A: Der Export zeigt die letzten 100 Runs. Für längere Historien empfehlen wir regelmäßige manuelle Exporte.

**F: Warum hat ein Loop einen Status „Fehler"?**  
A: Klicke auf die Fehlerzeile, um die detaillierte Fehlermeldung zu sehen. Häufige Gründe: API-Fehler, unvollständige Daten, Netzwerkprobleme.

## Navigation

- **← Zurück**: Führt zurück zu den Settings
- **📜 Cronjob History**: Aktualisiert diese Seite (vom Dashboard aus)

## Tipps & Tricks

1. **Regelmäßige Exporte**: Nutze die Export-Funktion, um wichtige Historien zu archivieren
2. **Filter nutzen**: Filterung nach Erfolg/Fehler hilft beim Debugging
3. **Trends erkennen**: Vergleiche Durchschnittswerte über Zeit hinweg
4. **Fehleranalyse**: Exportiere Fehler als JSON für detaillierte Analyse
