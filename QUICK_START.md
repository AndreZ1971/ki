# 🚀 SPEZIALISIERUNGS-SIGNIERUNG - QUICK START

**TL;DR:** Container prüft jetzt digital signierte Spezialisierungen mit RSA-4096. Manipulation unmöglich.

---

## 📦 Was du brauchst

### 1️⃣ **Private Key** (für WooCommerce)
```
Speicherort: Dein WooCommerce/WordPress
Format: PEM PKCS8
Länge: 4096 Bits
Verwendung: Spezialisierungen SIGNIEREN
Geheimnis: JA - nicht publizieren!
```

**Wurde gerade generiert** - siehe Terminal-Output vom letzten Befehl

### 2️⃣ **Public Key** (im Container)
```
Speicherort: backend/security/signatureVerifier.ts
Format: PEM SPKI (hardcoded im Code)
Länge: 4096 Bits
Verwendung: Signaturen PRÜFEN
Geheimnis: NEIN - kann öffentlich sein
Status: ✅ Bereits integriert
```

---

## 🔄 Wie es funktioniert

```
WooCommerce:                          Container:
-----------                           ----------

1. Kunde kauft Spec                   1. Kunde uploaded Spec
   ↓                                     ↓
2. PHP signiert mit                  2. Prüft Signatur mit
   Private Key (geheim)                 Public Key (öffentlich)
   ↓                                     ↓
3. { spec, signature }               3. Gültig? → Speichern
   wird gedownloadet                    Ungültig? → 401 Error
```

---

## ✅ Bereits implementiert

- [x] **Container-Code** - signatureVerifier.ts vorhanden
- [x] **Upload-Validierung** - Upload-Route prüft Signatur
- [x] **Tests** - 4 Test-Szenarien alle erfolgreich
- [x] **Backend** - Kompiliert ohne Fehler
- [x] **Frontend** - Kompiliert ohne Fehler

---

## 📝 Was du noch tun musst

### Schritt 1: Private Key speichern
Nimm den Private Key aus dem Terminal-Output und speichere ihn sicher:
```bash
~/.config/specialization-key.pem
```

### Schritt 2: WooCommerce PHP-Code
Folge der Anleitung in `SPECIALIZATION_SIGNING_GUIDE.md`:
```php
// Beispiel-Code vorhanden - Copy & Paste
openssl_sign($spec_json, $sig, $privateKey, OPENSSL_ALGO_SHA256);
```

### Schritt 3: Test
Upload eine Test-Spezialisierung und prüfen:
```bash
curl -X POST -F "file=@test.ari-spec" http://localhost:3001/api/specializations/upload
```

---

## 🛡️ Sicherheit

| Szenario | Resultat |
|----------|----------|
| **Echte Spec von WooCommerce** | ✅ Akzeptiert |
| **Manipulierte Spec** | ❌ Abgelehnt (401) |
| **Gefälschte Signatur** | ❌ Abgelehnt (401) |
| **Ohne Signatur** | ❌ Abgelehnt (401) |

---

## 📚 Dokumentation

```
SPECIALIZATION_SIGNING_GUIDE.md
  ↓
  Detaillierte PHP-Anleitung mit Beispielen
  
IMPLEMENTATION_COMPLETE.md
  ↓
  Technische Übersicht
  
SECURITY_IMPLEMENTATION_FINAL.md
  ↓
  Vollständige Checkliste
```

---

## 💡 Warum RSA-4096?

- **Asymmetrisch** - Private Key bleibt bei dir, Public Key im Container
- **Non-Repudiation** - WooCommerce kann nicht leugnen, es signiert zu haben
- **Tamper-Proof** - Selbst 1 Byte Änderung invalidiert Signatur
- **Industry Standard** - Wird überall für digitale Signaturen genutzt (PDF, Code-Signing, PKI)

---

## 🎯 Status

✅ **Implementierung: FERTIG**

Nächste Phase: WooCommerce Integration (deine Aufgabe)

---

**Fragen?** Schau dir `SPECIALIZATION_SIGNING_GUIDE.md` an - hat detaillierte PHP-Beispiele.
