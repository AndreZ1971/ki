# 🔧 A.R.I. – Konfigurations- & Bootstrapping-Modell (Final)

## Überblick

A.R.I. ist als IaaS-ähnliches, containerisiertes System konzipiert.
Der Container ist absichtlich funktionslos („dumm") ohne gültige Konfiguration.
**Dieses Verhalten ist Design und kein Fehler.**

---

## Single Source of Truth: connection.json

### connection.json ist die einzige Quelle der Wahrheit

`connection.json` enthält ALLE shop-spezifischen Daten:

- **Shop Base URL** (z. B. WooCommerce)
- **API-Credentials** (WooCommerce, OpenAI, WordPress)
- **Integrations- und Systemparameter**
- **Laufzeitrelevante Konfiguration**

Diese Datei ist:

- ✅ **Persistent** – Bleibt über Container-Updates bestehen
- ✅ **Update- & Replacement-sicher** – Wird bei Repair/Update nicht gelöscht
- ✅ **Bestandteil des Onboarding-Prozesses** – Wird vom Kunden gefüllt
- ✅ **Voraussetzung für jede Ausführung** – Ohne sie ist der Container nicht funktionsfähig

**Ohne gültige connection.json ist A.R.I. bewusst nicht betriebsfähig.**

### Wo wird connection.json gespeichert?

```
/app/backend/connection.json
```

### Wer schreibt in connection.json?

| Quelle | Wann? | Inhalt |
|--------|-------|--------|
| **Onboarding UI** | Beim Setup | Shop-URL, WooCommerce Keys, OpenAI Key |
| **System (Auto)** | Bei Container-Start | Subscription-Info (von Kubernetes ConfigMap) |
| **Kunde** | Später | Specializations, zusätzliche Integrationen |

---

## Environment Configuration: .env.production

### .env.production ist NICHT für Shop-Daten zuständig

`.env.production` wird **ausschließlich für generische Runtime-Konfiguration** verwendet:

- ✅ `NODE_ENV` – "production"
- ✅ `PORT` – Port-Nummer (z.B. 3000)
- ✅ `LOG_LEVEL` – Logging-Verbosity (debug, info, warn, error)
- ✅ `ADMIN_USER` / `ADMIN_PASS_HASH` – Fallback-Credentials (für Notfälle)

### Was gehört NICHT in .env.production?

| ❌ NICHT verwenden | ✅ Stattdessen |
|-------------------|----------------|
| SHOP_URL | connection.json → woocommerce.url |
| WOOCOMMERCE_KEY | connection.json → woocommerce.consumerKey |
| WOOCOMMERCE_SECRET | connection.json → woocommerce.consumerSecret |
| OPENAI_API_KEY | connection.json → openAI.apiKey |
| WORDPRESS_URL | connection.json → wordpress.url |

**Wichtig:**

- `.env.production` ist nicht Teil der fachlichen Systemkonfiguration
- `.env.production` kann sich zwischen Deployments ändern (ist ephemär)
- **Shop-Daten MÜSSEN in connection.json sein**

---

## ⚠️ Deprecation: Environment-basierte Shop-Übergabe

### Das alte Modell (deprecated)

Frühere Versionen von A.R.I. unterstützten die Übergabe von Shop-Endpunkten über **Environment-Variablen**:

```bash
# ❌ DEPRECATED - NICHT MEHR VERWENDEN!
SHOP_URL=https://mein-shop.de
WOOCOMMERCE_URL=https://mein-shop.de/wp-json/wc/v3
```

Dieses Vorgehen wurde aus folgenden Gründen bewusst ersetzt:

### Warum ist das deprecated?

| Problem | Impact |
|---------|--------|
| **Ephemäre Daten** | Env-Variablen verschwinden wenn Container neustartet |
| **Re-Onboarding nötig** | Nach jedem Update muss Shop-URL wieder eingegeben werden |
| **Keine Persistenz** | Konfiguration geht verloren bei Container-Replacement |
| **Nicht Cloud-native** | Widerspricht IaaS-Design (Container = stateless) |
| **Kubelet-Druck** | Kubernetes-Secrets für unkritische Daten ist overkill |

### Das neue Modell (aktuell)

**Persistente connection.json wird vom Kunden eingegeben und bleibt erhalten:**

```json
{
  "woocommerce": {
    "url": "https://mein-shop.de",
    "consumerKey": "ck_...",
    "consumerSecret": "cs_..."
  }
}
```

Vorteile:

- ✅ Daten überleben Container-Replacement
- ✅ Keine Re-Authentifizierung bei Updates
- ✅ Container kann migrate/replica-replace sein
- ✅ Konfigurationszustand ist explizit und sichtbar
- ✅ Keine versteckten Konfigurationsquellen

---

## 🔄 Bootstarpping-Fluss

### Szenario 1: Erster Start (Neuer Kunde)

```
1. Container startet
   ↓
2. Sucht: Gibt es connection.json?
   → NEIN!
   ↓
3. Frontend laden
   - Zeigt: "Willkommen zu A.R.I.!"
   - Onboarding-Wizard laden
   ↓
4. Kunde gibt Daten ein
   - Shop-URL: https://mein-shop.de
   - WooCommerce Keys
   - OpenAI API Key
   ↓
5. POST /api/config/save
   - Backend speichert in connection.json
   ↓
6. Container ist READY
   - Alle Tools verfügbar
```

### Szenario 2: Container-Restart (nach Update/Repair)

```
1. Container startet
   ↓
2. Sucht: Gibt es connection.json?
   → JA! (von altem Container übernommen)
   ↓
3. connection.json laden
   - Prüfe: Sind alle Required-Fields gefüllt?
   - Validiere: Sind Credentials noch gültig?
   ↓
4. Dashboard laden
   - Kein Onboarding (wir haben bereits Daten!)
   - Kunde sieht seine Daten
   ↓
5. Health Checks: GREEN ✅
   - Services aktualisieren sich automatisch
```

### Szenario 3: Korrupte connection.json

```
1. Container startet
   ↓
2. connection.json vorhanden, aber beschädigt
   - JSON-Parse-Fehler
   - Felder fehlen
   ↓
3. Frontend zeigt: "Fehler in der Konfiguration"
   - Mit Recovery-Option
   - Kunde kann Onboarding neu starten
   ↓
4. Wenn Kunde Repair wählt
   - Neue connection.json wird erstellt
   - Kunden können alte Daten wiedereingeben (wenn vorhanden)
```

---

## 🏗️ Design-Rationale

Dieses Modell stellt sicher, dass:

| Anforderung | Umsetzung |
|-------------|-----------|
| **Keine Volatilität** | Konfiguration nicht an Container-Runtime gebunden |
| **Cloud-agnostisch** | Docker, Kubernetes, Bare Metal = identisch |
| **IaaS-typisch** | Container = replicas, nicht unique |
| **Serviceorientiert** | A.R.I. agiert als verwalteter Service |
| **Zustandsexplizit** | Systemzustand klar, prüfbar, reproduzierbar |
| **Sicherheit** | Secrets sind lokal, nicht im Orchestrierungssystem |

---

## 📋 Zusammenfassung (DE)

| Frage | Antwort |
|-------|--------|
| **Wo ist die Shop-URL?** | In `connection.json` → `woocommerce.url` |
| **Wo kommen die WooCommerce Keys?** | Von Kunde im Onboarding, gespeichert in `connection.json` |
| **Wo kommt die Shop-URL von Kubernetes?** | ❌ NIRGENDWO - Das ist deprecated! |
| **Kann ich SHOP_URL in .env.production setzen?** | ❌ NEIN - Nur `connection.json`! |
| **Was ist die Single Source of Truth?** | `connection.json` – nicht .env, nicht Secrets, nicht ConfigMap |
| **Was wenn Container neustartet?** | `connection.json` wird erhalten, Kunde merkt nichts |
| **Was wenn connection.json fehlt?** | Onboarding-Wizard wird angezeigt |
| **Ist das ein Fehler oder Design?** | ✅ **Design** – Absichtlich so! |

---

## 🔗 Siehe auch

- [DEPLOYMENT.md](./DEPLOYMENT.md) – Kubernetes Integration
- [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) – Technische Konfiguration
- [Onboarding.md](./Onboarding.md) – Kundenerlebnis
