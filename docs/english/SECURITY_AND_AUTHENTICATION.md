# Security & Authentication - A.R.I.

## Overview

A.R.I. implements a complete JWT-based authentication system with protected routes in both frontend and backend.

## 🔐 Security Architecture

### Frontend Security

#### 1. Login System
- **Component**: `frontend/src/pages/auth/Login.tsx`
- **Features**:
  - Material-UI form with validation
  - Password visibility toggle
  - i18n support (DE/EN)
  - Error handling
  - Loading states

#### 2. Auth Context
- **File**: `frontend/src/context/AuthContext.tsx`
- **Functions**:
  - `login(username, password)` - Authentication
  - `logout()` - Token removal
  - `checkAuth()` - Session validation
  - State: `user`, `isAuthenticated`, `isLoading`

#### 3. Protected Routes
- **Component**: `frontend/src/components/ProtectedRoute.tsx`
- **Mechanism**:
  - Checks `isAuthenticated` before render
  - Redirects to `/login` if not authenticated
  - Loading screen during auth check
  - All 70+ routes are protected

### Backend Security

#### 1. Auth Middleware
- **File**: `backend/middleware/authMiddleware.ts`
- **Functions**:
  - JWT token validation
  - `Authorization: Bearer <token>` header
  - `request.user` population
  - Error handling with logger

#### 2. Auth Endpoints
- **File**: `backend/routes/app/api/auth/index.ts`
- **Endpoints**:
  - `POST /api/auth/login` - Login
  - `GET /api/auth/me` - User info
  - `POST /api/auth/logout` - Logout (client-side)

#### 3. User Management
- **Storage**: In-memory Map (TODO: DB in production)
- **Default User**:
  - Username: `admin`
  - Password: `admin123` (SHA256 hash)
  - Role: `admin`

## 🔑 JWT Token Management

### Token Creation
```typescript
jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' })
```

### Token Storage
- **Frontend**: `localStorage.getItem('authToken')`
- **Transmission**: `Authorization: Bearer <token>` header

### Token Validation
- **Backend**: JWT signature verification
- **Errors**: 401 Unauthorized for invalid/expired tokens

## 🛡️ Protected Areas

### All Frontend Routes
Every route in `App.tsx` is wrapped with `<ProtectedRoute>`:
- Dashboard (`/`)
- Analytics (`/analytics/*`)
- Marketing (`/marketing/*`)
- Products (`/products/*`)
- ML (`/ml/*`)
- Advanced Tools (`/advanced/*`)
- Payments (`/payments/*`)
- Settings (`/settings/*`)
- User Management (`/users`)

### Public Routes
- `/login` - Login page

## 📝 Default Login

**Development/Testing**:
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: In production, a secure password MUST be set!

## 🔄 Auth Flow

### Login Process
1. User enters credentials in login form
2. Frontend sends `POST /api/auth/login`
3. Backend verifies user & password
4. On success: Generate JWT token
5. Frontend stores token in `localStorage`
6. AuthContext sets `user` state
7. Redirect to `/dashboard`

### Session Check
1. App start: AuthContext calls `checkAuth()`
2. Read token from `localStorage`
3. `GET /api/auth/me` with token
4. Backend validates token
5. On success: Return user data
6. AuthContext sets `isAuthenticated=true`

### Logout
1. User clicks logout
2. `logout()` removes token from `localStorage`
3. AuthContext sets `user=null`
4. Redirect to `/login`

## 🚀 Production

### Environment Variables

```env
# Backend
JWT_SECRET=your-super-secret-key-change-me-in-production
```

### Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Replace default password
- [ ] Implement user database (instead of in-memory)
- [ ] Enforce HTTPS
- [ ] Implement token refresh
- [ ] Add rate limiting for login
- [ ] Add password reset flow
- [ ] Multi-factor authentication (optional)
- [ ] Session management & token revocation

## 🔧 Development

### Adding New Protected Route

```tsx
// App.tsx
<Route 
  path="/new-page" 
  element={<ProtectedRoute><NewPage /></ProtectedRoute>} 
/>
```

### Using User in Backend Route

```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user?.id || 'default';
  // ... additional logic
}
```

### Adding New User (Development)

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

## 📊 API Endpoints

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

### "Invalid token" Error
- Token expired (24h validity)
- JWT_SECRET incorrect
- Token corrupted
→ Solution: Login again

### Infinite Redirect Loop
- AuthContext not properly initialized
- Token in localStorage but invalid
→ Solution: `localStorage.clear()` and login again

### CORS Errors
- Check backend CORS config
- Credentials: true in CORS
→ Solution: Check `server.ts` CORS settings

## 📚 Further Information

- **JWT**: https://jwt.io/
- **React Context**: https://react.dev/reference/react/useContext
- **Fastify Auth**: https://fastify.dev/docs/latest/Guides/Getting-Started/#authentication

---

**Status**: ✅ Implemented & Tested  
**Version**: 1.0.0  
**Last Updated**: 2024-01-XX
