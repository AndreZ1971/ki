

# Update-Planung: Settings-UI & Konfigurationsmanagement + Image Analysis Features

## Stand 16.12.2025

### ✅ Implementiert (aktuell)

#### Image Analyzer - Color Analysis
- **Live Color Palette Extraction**: Echte RGB-Analyse aus hochgeladenen Bildern
- **Dominant Color Detection**: Automatische Identifikation der Top-5 dominanten Farben
- **Smart Buffer Handling**: Flexible Verarbeitung verschiedener Bildformate (PNG, JPEG, WebP)
- **Performance-optimiert**: Sharp C-Bindings für schnelle Bildverarbeitung (50x50 Resizing)

---

## Geplante Features

### 1. Enhanced Color Analysis (v2.0)

- Shop-Verbindung Tab überarbeitet: höherer Kontrast, helle Eingabeflächen, Social-Style-Kartenfarben je Abschnitt.
- Hinweis-Texte aufgehellt (WordPress/WooCommerce/AI/Job), einheitliche Lesbarkeit.
- Dashboard: Light/Dark-Umschalter entfernt, festes Light-Theme für konsistenten Header.
- Frontend-Build geprüft (Vite/TS) nach UI-Anpassungen.

## Geplante Features

### 1. Enhanced Color Analysis (v2.0)

**Beschreibung:**
- **Echtzeit-Farb-Harmonien berechnen** (nicht hardcoded)
  - Complementary Color Pairs (für maximalen Kontrast)
  - Analogous Colors (harmonische Nachbarfarben)
  - Triadic Color Schemes (3-Farben-Balance)
  - Split-Complementary & Tetradic Harmonies
  
- **Brightness & Saturation real berechnen** (HSL/HSV)
  - Aus RGB-Buffer dynamisch per Pixel
  - Durchschnittswert aller Pixel
  
- **Color Psychology Integration**
  - Farb-Bedeutung für E-Commerce (Rot=Dringlichkeit, Blau=Vertrauen, Grün=Natur, etc.)
  - Conversion-Tipps basierend auf Farb-Psychologie
  
- **Kontrast-Analyse**
  - WCAG AA/AAA Accessibility-Check
  - Text-Lesbarkeit auf Hintergrund prüfen

**Beispiel Response:**
```json
{
  "success": true,
  "colors": {
    "palette": ["#FF6B35", "#004E89", "#1A535C", "#F7FFF7", "#FF006E"],
    "dominantColor": "#FF6B35",
    "harmonies": {
      "complementary": "#004E89",
      "analogous": ["#FF8C42", "#FF4500"],
      "triadic": ["#FF6B35", "#35FF6B", "#6B35FF"]
    },
    "brightness": 65,
    "saturation": 92,
    "psychology": {
      "primary": "Energetic & Dynamic",
      "ideal_for": "Call-to-Action, Sales, Energy"
    },
    "wcagCompliance": "AA",
    "recommendations": [
      "Use as accent color for CTA buttons",
      "Pair with #004E89 for high contrast",
      "Avoid on dark backgrounds for text"
    ]
  }
}
```

---

### 2. Download der aktuellen Konfiguration

- **Beschreibung:**
  - Ermögliche es dem Nutzer, die aktuelle `connection.json` direkt aus der Settings-UI als Datei herunterzuladen.
  - Optional: Auswahl, ob sensible Felder (z.B. Passwörter, API-Keys) maskiert oder ausgeblendet werden.

- **Vorteile:**
  - Einfache Sicherung und Migration der Konfiguration
  - Nutzerfreundlichkeit und Transparenz

### 3. Color Palette Export & Integration

**Beschreibung:**
- **Export-Formate:**
  - CSS Variables (`:root { --color-primary: #FF6B35; }`)
  - Tailwind Config (color palette für tailwind.config.js)
  - Figma JSON (für Design-System)
  - Adobe Color Library (.aco)
  - Sass/SCSS ($colors map)

- **Clipboard Copy**: Ein-Klick Copy einzelner Farben in Hex/RGB/HSL
  
- **Brand Guide Generator**: PDF mit Farb-Palette + Psychologie + Use-Cases

**Technische Umsetzung:**
```ts
// Export als CSS
const exportCSS = (colors: string[]) => {
  const css = colors.map((c, i) => `--color-${i}: ${c};`).join('\n');
  return `:root {\n${css}\n}`;
};

// Export als Tailwind
const exportTailwind = (colors: string[]) => {
  const map = Object.fromEntries(
    colors.map((c, i) => [`color-${i}`, c])
  );
  return `colors: { ${JSON.stringify(map)} }`;
};
```

---

### 4. A/B Testing Integration

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

## Color Analysis - Future Development Roadmap

### 🔥 Phase 1: Enhanced Color Intelligence (v2.0)
**Priorität: HOCH** | **Geschätzter Aufwand: 3-4 Tage**

- Echtzeit-Farb-Harmonien (Complementary, Analogous, Triadic)
- HSL/HSV-basierte Brightness/Saturation Berechnung
- Color Psychology Mapping
- WCAG Accessibility Checker
- Smart Recommendation Engine

**Why it matters:** Dieses Feature macht dein Tool von "Farb-Erkenne" zu "Farb-Strategie-Berater" 💎

### 📊 Phase 2: Export & Integration (v2.1)
**Priorität: MITTEL** | **Geschätzter Aufwand: 2-3 Tage**

- CSS/Tailwind/Figma/SCSS Exports
- Brand Guide PDF Generator
- One-Click Color Copy (Hex/RGB/HSL)
- Design System Integration

### 🧪 Phase 3: A/B Testing + Analytics (v2.2)
**Priorität: MITTEL** | **Geschätzter Aufwand: 5-7 Tage**

- Conversion-Rate Tracking pro Farbvariante
- Heat-Map Visualization
- ML-basierte Farb-Recommendations
- Historical Trend Analysis

### 🔍 Phase 4: Multi-Image & Brand Consistency (v3.0)
**Priorität: NIEDRIG** | **Geschätzter Aufwand: 4-5 Tage**

- Batch Color Analysis
- Brand Color Deviation Check
- Seasonal Variant Detection
- Competitive Color Analysis

---

**💡 Verkaufsargument:** "Nicht nur Farben erkennen, sondern Farb-Strategien entwickeln. Premium Features für echte E-Commerce Profis."

Letztes Update: 16.12.2025
