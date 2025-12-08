### **Dashboard-Kategorien**
- Create Freebie
- Auto Product Creator
- Blogpost Generator
- ImageAnalyzer
- KI-Chatbot Ari (FloatingChatbot)
### **Marketing & Content**
- 📝 Blogpost Generator (KI-basierte, SEO-optimierte Blogposts)
- 🖼️ ImageAnalyzer (KI-Bildbewertung, automatisches Tagging, Qualitätsprüfung & Bild-SEO)
- 📧 E-Mail Marketing Automation
- 📊 Payment Success Tracking
- 🔒 Payment Validation & Security

# 🤖 KI-Chatbot Ari – Motivation & Support

**Funktionen:**
- Motivierende KI-Chat-Assistenz für Shop-Betreiber
- Soforthilfe, Tipps, News, Status-Updates
- Flexible Umschulung (z.B. auf neue Themen, Produktbereiche)
- Integration in alle Dashboard-Seiten als FloatingChatbot

**Bedienung:**
1. Im Dashboard unten rechts auf das Chatbot-Icon klicken.
2. Frage, Problem oder Wunsch eingeben – Ari antwortet direkt und motivierend.
3. Chatbot kann für alle Tools und Bereiche genutzt werden (z.B. Produktmanagement, Marketing, Analytics).
4. News, Status und Motivation werden automatisch eingeblendet.

**Technik:**
- React-Komponente `FloatingChatbot`
- Backend-Integration mit OpenAI GPT-4

**Funktionen:**
- Bild-Upload (JPG, PNG, WebP)
- KI-gestützte Bildbewertung (Qualität, Schärfe, Auflösung)
- Automatisches Tagging (Objekterkennung, Themen, Farben)
- SEO-Optimierung (Alt-Text, Dateiname-Vorschlag)

**Bedienung:**
1. Im Dashboard unter „Marketing & Content“ das Tool „ImageAnalyzer“ auswählen.
2. Bilddatei hochladen und Analyse starten.
3. Die Analyse zeigt Beschreibung, Tags, SEO-Alt-Text, Dateinamen-Vorschlag und Qualitätsmerkmale an.
4. Ergebnisse können für Produktbilder, Blogposts oder Medienverwaltung übernommen werden.
5. Zusätzlich steht der KI-Chatbot Ari jederzeit für Fragen und Motivation zur Verfügung.
# 🛠️ Tool-Übersicht

Das Dashboard bietet jetzt 50+ spezialisierte Tools plus den KI-Chatbot Ari:

- Produktmanagement (Auto Product Creator, Create Freebie, ...)
- Marketing & Content (Blogpost Generator, ImageAnalyzer, Email Marketing, ...)
- Analytics & Reporting (ShopMetrics, ConversionAnalysis, ...)
- Payment & Finanzen (PaymentSuccess, PaymentQuickCheck, ...)
- Advanced AI (StringGenerator, AutoFramplementator, ...)
- Social Media, Templates, Health, Settings, u.v.m.
- **KI-Chatbot Ari** als universeller Assistent

Alle Tools sind über das Dashboard erreichbar und können mit dem Chatbot kombiniert werden.

**API:**
- POST `/api/marketing/image/analyze` (FormData, Feld: `image`)
  - Response: `{ quality, tags, seo, description, metadata }`

- **Frontend-API-URL:** Die API-URL wird im Frontend über die Datei `.env.production` (Variable `VITE_API_URL`) gesetzt. Diese Datei ist ebenfalls lokal und nicht im Repo.
- **Import/Export:** Die Settings-UI bietet Import/Export für die `connection.json`.
Ein vollständiges **AI Agent System** für WooCommerce/WordPress mit moderner React-Oberfläche:

- 📧 E-Mail Marketing Automation
- 📱 Responsive Design (Desktop + Mobile)
### **Marketing & Content**

- 📊 Payment Success Tracking
- 🔒 Payment Validation & Security
    "port": 465,
- Automatisch via Vite (keine zusätzlichen Anforderungen)
## 🔧 Installation & Setup
Erstelle eine `.env` im Projektroot:




```dotenv





npm run start:agent      # Agent im Production-Mode



npm run email-marketing  # E-Mail Kampagnen



### **Docker**







### **Dashboard-Kategorien**







- Create Freebie



- Auto Product Creator



#### **🔧 Advanced (6 Seiten)**



- String Generator



- Auto Framplementator



- WooCommerce Sync




























- Payment Issue Detector






























- Payment Quick Check






















































  - Ohne Permalinks: `https://example.com/index.php`







---







## E2E-Test (Shop)







1. Freebie erzeugen






3. Checkout (0,00 €)



4. Download-Link in Bestellbestätigung
5. ZIP & Cover öffnen
6. Kategorie & Slug prüfen

---






## Troubleshooting
























---







## Sicherheit







- **DB-Pass rotieren** und `wp-config.php` aktualisieren



- **Application Password** neu erzeugen, alte deaktivieren



- **Woo CK/CS** neu generieren, alte revoken



- **WP Salts** erneuern



- **.env** nie ins Repo!







- **connection.json und .env.production** nie ins Repo!







---







## 🚀 Deployment







### **Production mit PM2**







```bash



# Backend bauen



cd backend



npm run build







# PM2 starten (ecosystem.config.cjs wird automatisch erkannt)



pm2 start ecosystem.config.cjs







# Logs überwachen



pm2 logs ki-agent







# Status prüfen



pm2 status

# Neustart
pm2 restart ki-agent

# Auto-Start beim Server-Reboot



pm2 startup



pm2 save







# connection.json im Backend-Verzeichnis muss vorhanden und befüllt sein



```bash







### **Docker Deployment**







```bash



# Container bauen










docker-compose up -d







# Logs
docker-compose logs -f ki-agent

# Ressourcen-Monitoring
docker stats ki-agent
```text

### **Empfohlene Server-Specs (Agent-Only)**

| Komponente | Minimum | Empfohlen | Production |
|------------|---------|-----------|------------|
| vCPU | 2 | 3 | 4+ |
| RAM | 2 GB | 4 GB | 8 GB |
| Disk | 40 GB | 80 GB | 120 GB |
| Uptime | 99% | 99.9% | 99.99% |

**Hinweis:** WordPress/WooCommerce läuft auf separatem Server!

### **Ressourcen-Limits (docker-compose.yml)**

```yaml






    limits:



      cpus: '2'



      memory: 2G



    reservations:



      cpus: '0.5'



      memory: 512M



```




---

## 🏗️ Architektur




```



┌─────────────────────────────────────────────────────┐



│                  React Frontend                     │



│  (Dashboard, 46 Tool-Seiten, Framer Motion)        │



└──────────────────┬──────────────────────────────────┘



                   │ REST API



┌──────────────────┴──────────────────────────────────┐



│              Node.js Backend (Express)              │



│  ├─ Agent System (Scheduler, Jobs, Memory)         │



│  ├─ WooCommerce Client (REST API)                  │



│  ├─ WordPress Client (REST API + Media Upload)     │



│  ├─ OpenAI Integration (GPT-4, DALL-E 3)          │



│  └─ Error Handling (Retry, Circuit Breaker)       │



└──────────────────┬──────────────────────────────────┘



                   │ REST API



┌──────────────────┴──────────────────────────────────┐






│  ├─ WooCommerce REST API (/wp-json/wc/v3)         │



│  ├─ WordPress REST API (/wp-json/wp/v2)           │



│  └─ Media Library Upload                           │



└─────────────────────────────────────────────────────┘



```







---







## 🔐 Sicherheit







### **Best Practices**























### **Secrets Rotation**







# Alte Keys widerrufen, neue generieren







# OpenAI API Key rotieren



```











### **Logs Location**










backend/logs/

├── err.log          # Error-Log



























curl http://localhost:3000/health










docker inspect --format='{{.State.Health.Status}}' ki-agent










## Performance Monitoring































pm2 show ki-agent



```







---











```bash



# Port bereits belegt?



netstat -ano | findstr :3000







# Dependencies installieren



cd backend



rm -rf node_modules package-lock.json



npm install







# TypeScript neu kompilieren



npm run build



```















npm install










401 Unauthorized




 Application Password prüfen
 User-Rolle überprüfen (Editor/Administrator)



```nginx



# nginx.conf



client_max_body_size 50M;



```







// php.ini



upload_max_filesize = 50M

























## 📝 Changelog
## Version 1.8.0 (November 2025)

- ✨ Komplettes React Frontend (46 Tool-Seiten)
- 🎨 Framer Motion Animationen
- 📱 Responsive Design für alle Seiten
- 🔧 12 Payment & Finance Tools
- 🧠 6 Advanced System-Tools
- 📊 Erweiterte Analytics & Reporting
- 🚀 Docker-Support optimiert
- 📚 Umfassende README-Dokumentation

## Version 1.7.0
 🤖 AI-gestützte Content-Generierung


- 🎨 DALL-E 3 Bild-Generator
 🛒 Auto Product Creator


- 📧 E-Mail Marketing System
 💳 Payment-System mit Auto-Fix


 Made with ❤️ and ☕ for automated E-Commerce
- 🛒 Auto Product Creator
- 📊 Google Trends Integration
- 💰 Conversion-Optimierung
- 🩺 Shop Health Monitoring

## Version 1.5.0
- 💳 Payment-System mit Auto-Fix
- 🔍 Issue Detection
- ✅ Payment Verification
- 🚨 Emergency System


# Feature-Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen
git add .

# Tests & Linting
npm run lint
npm run type-check

# Push & Pull Request
git push origin feature/neue-funktion
```

### **Commit-Conventions**

```
feat: Neue Features
fix: Bug-Fixes
docs: Dokumentation
style: Formatierung
test: Tests hinzufügen
chore: Build/Tools-Anpassungen
```
- ✅ ESLint-Regeln befolgen
- ✅ Keine Secrets committen
- ✅ Aussagekräftige Commit-Messages

---

## 📄 Lizenz

Proprietary - Alle Rechte vorbehalten

---

## 🆘 Support

**Issues:** GitHub Issues  
**Dokumentation:** `/docs` Ordner  
**API-Docs:** `/docs/api`

## 🛠️ Onboarding / Erste Schritte

1. Repository klonen und Abhängigkeiten installieren
2. connection.json im Backend-Verzeichnis anlegen (leer oder mit Platzhaltern)
3. Frontend und Backend bauen
4. Settings-UI im Frontend öffnen, alle Zugangsdaten eintragen und speichern
5. API-URL im Frontend über .env.production setzen
6. System testen und Shop verbinden

---

## 🙏 Danksagungen

- **React Team** - Für das beste Frontend-Framework
- **OpenAI** - Für die leistungsstarken AI-APIs
- **WooCommerce** - Für die robuste E-Commerce-Plattform
- **Framer Motion** - Für butterweiche Animationen

---

**Made with ❤️ and ☕ for automated E-Commerce**
