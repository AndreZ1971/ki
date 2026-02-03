# 🎯 EINFACH & KLAR - Nur 2 Schritte!

## ⚠️ WICHTIG: **ALLES ANDERE VERGESSEN!**

Vergiss alle anderen Dateien (wp-config-COMPLETE.php, FINALE_SETUP_ANLEITUNG.md, etc.)

**NUR diese eine Datei zählt:** `wp-config-FINAL.php`

---

## 🚀 **Schritt 1: Datei uploaden**

Datei: `wp-config-FINAL.php`

Upload zu deinem Server:
```
/var/www/vhosts/kaufe-es.eu/httpdocs/wordpress/wp-config.php
```

**Fertig! Der Private Key ist darin!**

---

## ✅ **Schritt 2: Testen**

Browser öffnen:
```
https://kaufe-es.eu/test-ari-signing.php
```

Sollte zeigen:
```
✅ SPECIALIZATION_PRIVATE_KEY definiert
✅ OpenSSL Extension geladen
✅ openssl_sign() verfügbar
✅ Signierung erfolgreich
```

---

## ⚠️ **WICHTIG - Danach!**

1. **In .gitignore eintragen:**
   ```
   wp-config.php
   ```

2. **NICHT ins Git committen!**

3. **Lokal eine Kopie speichern** (zur Sicherheit)

---

**Das war's!** Die wp-config.php ist jetzt aktiv mit dem Private Key drin. 🔐

Alles andere (externale Keys, .env Dateien, etc.) - **vergessen!**

