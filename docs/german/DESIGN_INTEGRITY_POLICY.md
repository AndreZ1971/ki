# Design-Integritätsrichtlinie – Social Media Poster

## 🔒 Verbindliche Vorgabe

Das bestehende Design der **Social-Media-Poster-Oberfläche** ist **final, bewusst gewählt und unveränderlich**.

Im Rahmen aller Erweiterungen, Refactorings oder funktionalen Ergänzungen **darf das Erscheinungsbild in keiner Weise verändert werden**.

Diese Regel ist **absolut verbindlich** und gilt für alle Beiträge und Entwicklungsarbeiten, unabhängig davon, ob Änderungen technisch, konzeptionell oder UX-seitig als „Verbesserung" betrachtet werden.

---

## ❌ Nicht erlaubt

Die folgenden Maßnahmen sind **ausdrücklich untersagt**:

- ❌ Änderungen an **Layout, Abständen (Spacing), Farben oder Typografie**
- ❌ Einführung neuer **Panels, Tabs, Modals oder UI-Flows**
- ❌ Umstrukturierung bestehender Komponenten oder Container
- ❌ Visuelle Reorganisation mit dem Ziel der „besseren Usability"
- ❌ Austausch, Entfernen oder Ersetzen bestehender UI-Elemente
- ❌ CSS-Änderungen außer zur Behebung von Bugs
- ❌ Layoutreflows oder Responsive-Design-Anpassungen
- ❌ Icon-, Farb- oder Schriftwechsel
- ❌ Größenänderungen von UI-Komponenten
- ❌ Umordnung oder Neuanordnung von Elementen

**Jegliche Abweichung davon gilt als Fehlumsetzung und wird abgelehnt.**

---

## ✅ Erlaubt (streng begrenzt)

Zulässig sind **ausschließlich**:

### Frontend (UI)
- ✅ **Funktionale Erweiterungen innerhalb bestehender UI-Container**
- ✅ Ergänzende **Input-Felder, Buttons oder Toggles**, 
  **nur**, wenn sie sich nahtlos in bestehende Komponenten einfügen
- ✅ Nutzung vorhandener **Styles, Klassen und UI-Komponenten**
- ✅ State-Management für neue Funktionen (Redux, Context, Zustand)
- ✅ Event-Handler und Callback-Funktionen
- ✅ Prop-Erweiterungen an bestehenden Komponenten
- ✅ Neue TypeScript-Typen für Frontend-Daten
- ✅ Validierung und Error-Handling in der UI

### Backend
- ✅ **Uneingeschränkte Erweiterung der Backend-Logik**, insbesondere:
  - ✅ Neue Services
  - ✅ Media-Pipelines
  - ✅ Upload-Handling
  - ✅ Plattform-spezifische Publishing-Logik
  - ✅ Datenbanktabellen und Schemas
  - ✅ API-Endpoints
  - ✅ Authentifizierung und Authorization
  - ✅ Caching und Performance-Optimierungen

---

## 🎯 Ziel dieser Richtlinie

Das Ziel dieser Richtlinie ist es, die **klare Trennung zwischen visueller Stabilität und funktionaler Weiterentwicklung** sicherzustellen.

Die Aufgabe bei allen Arbeiten am Social-Media-Poster besteht **ausschließlich** darin:

> **Die funktionalen Fähigkeiten des bestehenden Systems zu erweitern –**  
> **nicht dessen Erscheinungsbild.**

### Begründung

- **Konsistenz:** Benutzer verlassen sich auf ein stabiles, bekanntes Interface
- **Produktivität:** Design-Änderungen erfordern zusätzliche Testing und Validierung
- **Fokus:** Entwicklung konzentriert sich auf Features, nicht auf Ästhetik
- **Wartbarkeit:** Stabiles UI bedeutet weniger Regressions-Tests
- **Compliance:** Designvorgaben sind oft stakeholder-approved und dokumentiert

---

## 🤖 Hinweis für KI-gestützte Entwicklung

*Gilt insbesondere für GitHub Copilot, ChatGPT und ähnliche KI-Systeme*

Automatisierte Code-Vorschläge dürfen:

- ❌ **Kein UI-Refactoring** durchführen
- ❌ **Kein Redesign** vorschlagen
- ❌ **Keine Layout-Optimierungen** implementieren
- ❌ **Keine CSS-Änderungen** außer Bugfixes vornehmen
- ❌ **Keine neuen Komponenten** mit eigenem Styling erstellen

Der Fokus muss **ausschließlich** liegen auf:

- ✅ Backend-Services
- ✅ Media-Verarbeitung
- ✅ Upload-Infrastruktur
- ✅ Plattform-Publishing-Logik
- ✅ State-Management
- ✅ API-Integration

**Frontend-Code darf nur funktional ergänzt werden,**  
**nicht strukturell oder visuell verändert.**

---

## 📋 Implementierungs-Checkliste

### Vor jedem Frontend-Commit prüfen:

- [ ] **Kein CSS verändert** (außer Bugfixes)
- [ ] **Kein HTML-Struktur verändert** (außer in bestehenden Containern)
- [ ] **Keine neuen CSS-Klassen** mit eigenen Styles erstellt
- [ ] **Keine Komponenten verschoben oder umgeordnet**
- [ ] **Keine Farben, Fonts oder Icons geändert**
- [ ] **Bestehende Layout-Klassen weiterverwendet**
- [ ] **Neue Features passen in bestehende UI ein**
- [ ] **Responsive Design unverändert**

### Erlaubte Frontend-Änderungen:

- [ ] Neue TypeScript-Typen definiert
- [ ] Event-Handler hinzugefügt
- [ ] State-Variablen erweitert
- [ ] Validierungslogik hinzugefügt
- [ ] API-Calls implementiert
- [ ] Error-Handling verbessert
- [ ] Props an bestehende Komponenten ergänzt

---

## 🚨 Durchsetzung

### Pull Request Review

Pull Requests, die gegen diese Richtlinie verstoßen, werden:

1. **Nicht akzeptiert**, unabhängig davon, ob die Implementierung technisch korrekt ist
2. **Mit Verweis auf diese Policy abgelehnt**
3. **Zur Überarbeitung zurückgewiesen**, ohne Merge

### Code Review Kriteria

Reviewer müssen prüfen:

```typescript
// ❌ NICHT ERLAUBT - Layout-Änderung
.social-poster-post-card {
  padding: 20px; // War: 16px - NICHT ERLAUBT
}

// ✅ ERLAUBT - Event-Handler
const handleMediaSelect = (files: FileList) => {
  // Neue Funktionalität
};

// ❌ NICHT ERLAUBT - Neue UI-Komponente
const MediaUploadPanel = () => {
  return <div>...</div>; // Neue visuelle Komponente
};

// ✅ ERLAUBT - Hook für State
const [uploadedAssets, setUploadedAssets] = useState([]);
```

---

## 📞 Fragen zur Policy

### F: "Warum darf ich das Layout nicht verbessern?"
**A:** Das Layout ist intentional gestaltet und stakeholder-approved. Design-Änderungen brauchen formales Approval und breite Validierung. Diese Policy konzentriert Entwicklung auf Features statt Ästhetik.

### F: "Und wenn ich einen UI-Bug finde?"
**A:** Bugfixes sind erlaubt, wenn sie:
1. Die visuelle Konsistenz **nicht** verändern
2. Bestandteil einer definierten Issue sind
3. Minimal eingreifend sind (z.B. falsche Padding-Berechnung)

### F: "Was ist mit Dark-Mode oder Accessibility-Verbesserungen?"
**A:** Diese erfordern **formales Approval** und sind nicht Teil dieser Policy. Sie zählen als „Design-Change" und müssen separat genehmigt werden.

### F: "Kann ich neue Input-Felder hinzufügen?"
**A:** **Ja**, aber nur wenn:
1. Sie in bestehenden Containern platziert werden
2. Sie bestehende Styles verwenden
3. Sie nicht das Layout beeinflussen
4. Sie funktional notwendig sind (nicht nur ästhetisch)

---

## 📚 Referenzen & Dokumentation

- **Projekt-Dokumentation:** [SOCIAL_MEDIA_REFACTORING_COMPLETE.md](../SOCIAL_MEDIA_REFACTORING_COMPLETE.md)
- **Regression Tests:** [ISSUE_8_REGRESSION_TESTING.md](../ISSUE_8_REGRESSION_TESTING.md)
- **Verification:** [FINAL_VERIFICATION_REPORT.md](../FINAL_VERIFICATION_REPORT.md)
- **Dokumentations-Übersicht:** [DOKUMENTATION_ÜBERSICHT.md](../DOKUMENTATION_ÜBERSICHT.md)

---

## ✋ Wichtiger Hinweis

Diese Policy wird durch automatisierte Code-Review-Prozesse und manuelle Reviewer durchgesetzt.

**Commits, die diese Policy verletzen, werden blockiert.**

Keine Ausnahmen, unabhängig von:
- Der technischen Qualität
- Der beabsichtigten Verbesserung
- Der Dauer der Entwicklung
- Der Anzahl der betroffenen Dateien

---

**Policy Status:** ✅ AKTIV & VERBINDLICH  
**Gültig ab:** 22. Januar 2026  
**Letzte Aktualisierung:** 22. Januar 2026  

**Alle neuen und bestehenden Social-Media-Poster-Arbeiten müssen diese Policy befolgen.**
