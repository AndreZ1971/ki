# Onboarding – Einstellungen für deinen KI-Agenten

**Version:** 5.0.0-alpha (Alpha-Container MVP)

Willkommen! Hier erfährst du, wie du deinen KI-Agenten als Shop-Besitzer beim ersten Mal einrichtest. Du brauchst keine technischen Vorkenntnisse – alles läuft direkt im Browser.

---

## 🎯 Schnellstart

1. **Frontend öffnen**: `https://my-working-space.de` (Production) oder `http://localhost:5173` (Entwicklung)
2. **Einstellungen ausfüllen**: Shop-URL, WooCommerce Schlüssel, OpenAI API-Key
3. **Verbindung testen**: Button "Verbindung testen" speichert und validiert Einstellungen
4. **Dashboard sofort nutzen**: Änderungen werden **ohne Neustart** aktiv! 🚀
5. **Erste Tools testen**: Probiere z.B. "Shop-Metriken" oder "Produktanalyse" aus

> 🆕 **Neu in v5.0.0-alpha**: Settings werden dynamisch geladen - keine Container-Restarts mehr nötig!

---

## 1. Einstellungen öffnen

Nach der Freischaltung deines Agenten erhältst du einen Link zu deiner persönlichen Agenten-Oberfläche.

1. Öffne den Link in deinem Browser.
2. Melde dich ggf. mit deinen Zugangsdaten an.
3. Klicke im Menü auf „Einstellungen" oder „Settings".

---

## 2. Zugangsdaten eintragen

Fülle alle Felder auf der Einstellungsseite sorgfältig aus:

- OpenAI API Key (falls bereitgestellt)
- Shop-URL und Zugangsdaten (z. B. WooCommerce)
- E-Mail-Konfiguration (für Benachrichtigungen)
- Weitere Felder nach Bedarf (z. B. Analytics, Social Media)

Hinweis: Die meisten Zugangsdaten erhältst du direkt von Woo oder deinem Support.

---

## 3. Einstellungen speichern

Klicke auf „Verbindung testen“. Das System:
1. **Speichert** alle Einstellungen in `connection.json`
2. **Validiert** WordPress & WooCommerce Verbindung
3. **Aktiviert** die Konfiguration **sofort** (kein Neustart!)

Bei Erfolg erscheint:
- ✅ WordPress-Test erfolgreich
- ✅ WooCommerce-Test erfolgreich

Bei Fehlern erhältst du eine Rückmeldung, was noch fehlt oder falsch ist.

> ⚡ **Alpha-Container Design**: Bei Container-Neustart werden Platzhalter wiederhergestellt. Einfach Settings erneut speichern oder JSON importieren!

### Gültigkeitsregeln (wichtig bei der Ersteinrichtung)

- WordPress, WooCommerce, OpenAI sind jeweils optional. Wenn du ein Feld einer Gruppe befüllst, müssen die restlichen Pflichtfelder dieser Gruppe ebenfalls korrekt sein (sonst bekommst du eine klare Fehlermeldung).
- Job-Einstellungen: `Job-Modus` kann „einmalig“ oder „Intervall“ sein.
	- Bei „einmalig“ wird `Job-Intervall` ignoriert.
	- Bei „Intervall“ muss `Job-Intervall (ms)` im Bereich 10 Sekunden bis 24 Stunden liegen.
- Die Settings-API zeigt dir im Fehlerfall an, welches Feld und welche Regel betroffen sind.

---

## 4. System nutzen

Nach erfolgreicher Einrichtung kannst du alle Funktionen deines Agenten direkt im Browser nutzen – z. B. Analysen, Content-Generatoren, Shop-Checks und mehr.

---

## 5. Hilfe & Support

Bei Fragen oder Problemen findest du Hilfe im Menüpunkt „Troubleshooting“ oder in der FAQ. Der Support steht dir jederzeit zur Verfügung.

---

> **Hinweis:** Diese Anleitung wird später mit Bildern ergänzt, um jeden Schritt noch anschaulicher zu machen.

---

## 6. Sicherheit & Unabhängigkeit (Das Schnellboot-Prinzip)

Wir wissen, wie wichtig dein Shop ist. Deshalb wurde der KI-Agent so gebaut, dass er **nicht-invasiv** arbeitet.

- **Dein Shop gehört dir:** Der Agent steuert den Shop nur über offizielle Schnittstellen (API), er verändert keinen Programmcode.
- **Kein Risiko:** Solltest du den Agenten jemals deaktivieren oder pausieren, läuft dein Shop sofort ganz normal weiter.
- **Die Analogie:** Stell dir deinen Shop als Boot vor. Der KI-Agent ist ein leistungsstarker Außenbordmotor, der daraus ein Schnellboot macht. Nimmst du den Motor weg, sinkt das Boot nicht – es wird einfach wieder zum Ruderboot. Du behältst die volle Kontrolle.

---

Letzte Aktualisierung: Dezember 2025
