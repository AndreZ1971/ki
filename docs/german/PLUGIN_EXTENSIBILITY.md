# 🔌 A.R.I. – Plugin-Datenfähigkeit & Integrationsgrenzen

**Zielgruppe:** Interne Architektur- & Plattformdiskussion  
**Status:** Architektur-Guideline (kein Feature-Versprechen)  
**Version:** v7.0.x  

> **Wichtiger Hinweis:**  
> A.R.I. ist **kein Plugin-Framework** und **keine Integrationsplattform**.  
> Dieses Dokument beschreibt **architektonische Grenzen**, nicht eine Integrations-Roadmap.

---

## 1. Grundsatz: A.R.I. integriert keine Plugins, sondern Entscheidungssignale

A.R.I. ist ein **containerisiertes Execution- & Decision-Layer-System**, das **neben** einem  
**WooCommerce-Shop** operiert.

**Zentraler Architekturentscheid:**

> Plugins werden **nicht integriert, um Features zu erweitern**,  
> sondern **nur dann berücksichtigt**, wenn sie **zusätzliche, hochwertige Signale liefern**,  
> die die Entscheidungsqualität von A.R.I. messbar verbessern.

Der **Default-Zustand** ist:
- ❌ keine Plugin-Abhängigkeit  
- ❌ keine Pflicht-Integrationen  
- ❌ keine Plugin-Kompatibilitätsversprechen  

---

## 2. Warum Plugin-Daten überhaupt betrachtet werden

A.R.I. arbeitet primär mit:
- WooCommerce Core APIs  
- WordPress Core APIs  
- internen Analyse- & Entscheidungsmodellen  

**In Ausnahmefällen** existieren Plugins, die:
- aggregierte Verhaltensdaten liefern  
- langfristige Muster sichtbar machen  
- Informationen bereitstellen, die WooCommerce Core bewusst nicht abbildet  

➡️ Diese Daten **können** als **optionale Signale** genutzt werden.  
➡️ Sie **verändern keine Kernlogik** von A.R.I.

---

## 3. Klare Abgrenzung: Was A.R.I. bewusst nicht ist

A.R.I. ist **nicht**:

- ❌ ein Plugin-Sammler  
- ❌ ein universelles Integrations-Hub  
- ❌ ein Ersatz für jedes installierte Plugin  
- ❌ abhängig von Drittanbieter-APIs für Kernfunktionen  

Jede Plugin-Anbindung erzeugt:
- Pflegeaufwand  
- Versions- und API-Abhängigkeiten  
- Onboarding-Komplexität  
- Rückbau-Risiken  

Diese Kosten sind **strategisch relevanter** als die technische Machbarkeit.

---

## 4. Wann Plugin-Daten grundsätzlich zulässig sind

Eine Plugin-Datenquelle wird **nur dann** in Betracht gezogen, wenn **alle** Punkte erfüllt sind:

1. **Read-only**  
   - keine Steuerung  
   - keine Ausführung  
   - keine Geschäftslogik-Abhängigkeit  

2. **Optional**  
   - A.R.I. funktioniert vollständig ohne diese Daten  

3. **Graceful Degradation**  
   - Plugin fehlt → kein Funktionsverlust  
   - API nicht erreichbar → Fallback auf Core-Daten  

4. **Hoher Signalwert**  
   - messbare Verbesserung der Entscheidungsqualität  

5. **Begrenzter Scope**  
   - keine Quer- oder Kaskadenabhängigkeiten zu anderen Plugins  

---

## 5. Beispiel (bewusst neutral): Analytics-Plugins

Analytics-Plugins **können** aggregierte Informationen liefern, z. B.:

- Traffic-Verteilungen  
- Geräteklassen  
- zeitliche Nutzungsmuster  

**Architekturentscheidung:**

> A.R.I. nutzt solche Daten **ausschließlich als zusätzliche Kontextsignale**  
> und bleibt vollständig funktionsfähig, wenn sie nicht vorhanden sind.

Es entsteht **kein Produkt- oder Integrationsversprechen**.

---

## 6. Ticket-System & Sonderfälle

Eine bestehende Ticket-System-Anbindung dient:
- als **Machbarkeitsnachweis**  
- als **interner Referenzfall**  

Sie ist **kein allgemeines Modell**  
und **keine Blaupause** für weitere Integrationen.

---

## 7. Dokumentations- & Kommunikationsregel (kritisch)

### ❌ Nicht verwenden
- „A.R.I. integriert Plugin X“  
- Plugin-Listen in Marketing- oder Feature-Dokumenten  
- Versions- oder Support-Zusagen gegenüber Plugin-Herstellern  

### ✅ Stattdessen
- „A.R.I. kann optionale Datenquellen berücksichtigen“  
- „Plugin-Daten werden selektiv und nicht standardmäßig genutzt“  
- „Nicht-Integration ist eine bewusste Architekturentscheidung“  

---

## 8. Architektur-Maxime (Kurzform)

> **A.R.I. wird stabil durch Begrenzung, nicht durch Vollständigkeit.**  
>  
> Integration ist der Ausnahmefall.  
> Nicht-Integration ist der Normalzustand.

---

## 9. Interne Kurzfassung (für Übergaben / neue Chats)

> A.R.I. ersetzt viele klassische Plugins, kann aber in Ausnahmefällen Plugin-Daten  
> als optionale Signale nutzen.  
> Integration ist keine Feature-Frage, sondern eine Governance-Entscheidung.  
> Nicht-Integration ist explizit Teil des Designs.
