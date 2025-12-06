# Deployment & Support – Technische Hinweise für Woo/Support

Diese Anleitung ist ausschließlich für Woo/Support/Technik gedacht und beschreibt die technischen Schritte zur Auslieferung und Inbetriebnahme des KI-Agenten.

---

## 1. Initiale Vorbereitung

- Stelle sicher, dass alle Container und Images bereit sind.
- Lege im Backend-Verzeichnis eine Datei `connection.json` an (leer oder mit Platzhaltern):

```json
{
  "openai": { "apiKey": "" },
  "woocommerce": { "url": "", "consumerKey": "", "consumerSecret": "" }
}
```

- Die Datei muss vorhanden sein, bevor das Backend gestartet wird.

---

## 2. Ausrollen beim Kunden

- Container und `connection.json` werden gemeinsam ausgeliefert.
- Nach dem Start ist das Backend erreichbar, das Frontend kann die Settings speichern.
- Der Endnutzer sieht und benötigt keine technischen Details.

---

## 3. Support & Fehlerbehebung

- Bei Problemen prüfe die Logs im Backend-Container.
- Kontrolliere, ob die `connection.json` vorhanden und korrekt befüllt ist.
- Bei API-Fehlern: Zugangsdaten prüfen, ggf. neu setzen und Backend neu starten.

---

Letzte Aktualisierung: Dezember 2025
