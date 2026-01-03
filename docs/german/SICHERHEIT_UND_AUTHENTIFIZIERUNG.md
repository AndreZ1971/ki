# Sicherheit & Authentifizierung - A.R.I.

## Übersicht

A.R.I. implementiert ein vollständiges JWT-basiertes Authentifizierungssystem mit geschützten Routen sowohl im Frontend als auch im Backend.

## 🔐 Sicherheitsarchitektur

### Frontend-Sicherheit

#### 1. Login-System
- **Komponente**: `frontend/src/pages/auth/Login.tsx`
- **Features**:
  - Material-UI Formular mit Validierung
  - Password-Sichtbarkeits-Toggle
  - i18n-Unterstützung (DE/EN)
  - Fehlerbehandlung
  - Loading States

#### 2. Auth Context
- **Datei**: `frontend/src/context/AuthContext.tsx`
- **Funktionen**:
  - `login(username, password)` - Authentifizierung
  - `logout()` - Token entfernen
  - `checkAuth()` - Session-Validierung
  - State: `user`, `isAuthenticated`, `isLoading`

#### 3. Protected Routes
- **Komponente**: `frontend/src/components/ProtectedRoute.tsx`
- **Mechanismus**:
  - Prüft `isAuthenticated` vor Render
  - Redirect zu `/login` bei fehlender Auth
  - Loading-Screen während Auth-Check
  - Alle 70+ Routes sind geschützt

### Backend-Sicherheit

#### 1. Auth Middleware
- **Datei**: `backend/middleware/authMiddleware.ts`
- **Funktionen**:
  - JWT-Token-Validierung
  - `Authorization: Bearer <token>` Header
  - `request.user` Population
  - Error Handling mit Logger

#### 2. Auth Endpoints
- **Datei**: `backend/routes/app/api/auth/index.ts`
- **Endpunkte**:
  - `POST /api/auth/login` - Login
  - `GET /api/auth/me` - User-Info
  - `POST /api/auth/logout` - Logout (Client-side)

#### 3. User Management
- **Speicher**: In-Memory Map (TODO: DB in Produktion)
- **Default User**:
  - Username: `admin`
  - Password: `admin123` (SHA256 Hash)
  - Role: `admin`

## 🔑 JWT-Token Management

### Token-Erstellung
```typescript
jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' })
```

### Token-Speicherung
- **Frontend**: `localStorage.getItem('authToken')`
- **Übertragung**: `Authorization: Bearer <token>` Header

### Token-Validierung
- **Backend**: JWT-Signatur-Prüfung
- **Fehler**: 401 Unauthorized bei Invalid/Expired

## 🛡️ Geschützte Bereiche

### Alle Frontend-Routes
Jede Route in `App.tsx` ist mit `<ProtectedRoute>` umwickelt:
- Dashboard (`/`)
- Analytics (`/analytics/*`)
- Marketing (`/marketing/*`)
- Produkte (`/products/*`)
- ML (`/ml/*`)
- Advanced Tools (`/advanced/*`)
- Payments (`/payments/*`)
- Settings (`/settings/*`)
- User Management (`/users`)

### Öffentliche Routes
- `/login` - Login-Seite

## 📝 Standard-Login

**Development/Testing**:
- Username: `admin`
- Password: `admin123`

⚠️ **WICHTIG**: In Produktion MUSS ein sicheres Passwort gesetzt werden!

## 🔄 Auth-Flow

### Login-Prozess
1. User gibt Credentials in Login-Form ein
2. Frontend sendet `POST /api/auth/login`
3. Backend prüft User & Passwort
4. Bei Erfolg: JWT-Token generieren
5. Frontend speichert Token in `localStorage`
6. AuthContext setzt `user` State
7. Redirect zu `/dashboard`

### Session-Check
1. App-Start: AuthContext ruft `checkAuth()`
2. Token aus `localStorage` lesen
3. `GET /api/auth/me` mit Token
4. Backend validiert Token
5. Bei Erfolg: User-Daten zurück
6. AuthContext setzt `isAuthenticated=true`

### Logout
1. User klickt Logout
2. `logout()` entfernt Token aus `localStorage`
3. AuthContext setzt `user=null`
4. Redirect zu `/login`

## 🚀 Produktion

### Environment Variables

```env
# Backend
JWT_SECRET=your-super-secret-key-change-me-in-production
```

### Sicherheits-Checkliste

- [ ] `JWT_SECRET` in Produktion ändern
- [ ] Default-Passwort ersetzen
- [ ] User-Datenbank implementieren (statt In-Memory)
- [ ] HTTPS erzwingen
- [ ] Token-Refresh implementieren
- [ ] Rate Limiting für Login
- [ ] Password-Reset Flow
- [ ] Multi-Factor Authentication (optional)
- [ ] Session-Management & Token-Revocation

## 🔧 Entwicklung

### Neue geschützte Route hinzufügen

```tsx
// App.tsx
<Route 
  path="/neue-seite" 
  element={<ProtectedRoute><NeueSeite /></ProtectedRoute>} 
/>
```

### User in Backend-Route nutzen

```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user?.id || 'default';
  // ... weitere Logik
}
```

### Neue User hinzufügen (Development)

```typescript
// backend/routes/app/api/auth/index.ts
const passwordHash = crypto.createHash('sha256').update('newPassword').digest('hex');

users.set('newUser', {
  id: '2',
  username: 'newUser',
  email: 'user@ari.local',
  role: 'user',
  passwordHash,
});
```

## 📊 API-Endpunkte

### POST /api/auth/login
**Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@ari.local",
    "role": "admin"
  }
}
```

### GET /api/auth/me
**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response**:
```json
{
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@ari.local",
    "role": "admin"
  }
}
```

## 🔍 Troubleshooting

### "Invalid token" Fehler
- Token expired (24h Gültigkeit)
- JWT_SECRET falsch
- Token beschädigt
→ Lösung: Erneut einloggen

### Infinite Redirect Loop
- AuthContext nicht korrekt initialisiert
- Token im localStorage aber invalid
→ Lösung: `localStorage.clear()` und erneut einloggen

### CORS-Fehler
- Backend CORS-Config prüfen
- Credentials: true in CORS
→ Lösung: `server.ts` CORS-Einstellungen

## 📚 Weiterführende Infos

- **JWT**: https://jwt.io/
- **React Context**: https://react.dev/reference/react/useContext
- **Fastify Auth**: https://fastify.dev/docs/latest/Guides/Getting-Started/#authentication

---

**Status**: ✅ Implementiert & Getestet  
**Version**: 1.0.0  
**Letzte Aktualisierung**: $(Get-Date -Format "yyyy-MM-dd")
