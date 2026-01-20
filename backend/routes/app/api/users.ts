import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../middleware/authMiddleware';
import crypto from 'crypto';

// Shared user store (same as auth routes)
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  passwordHash: string;
}

// Import from environment (same logic as auth)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH =
  process.env.ADMIN_PASS_HASH ||
  crypto.createHash('sha256').update(process.env.ADMIN_PASS || 'ARI#2026!Secure').digest('hex');

const users: Map<string, User> = new Map();
users.set(ADMIN_USER, {
  id: '1',
  username: ADMIN_USER,
  email: process.env.ADMIN_EMAIL || 'admin@ari.local',
  role: 'admin',
  passwordHash: ADMIN_PASS_HASH,
});

export default async function userRoutes(server: FastifyInstance) {
  // GET /api/users - nur für authentifizierte Admins
  server.get('/users', { preHandler: authMiddleware }, async (request, reply) => {
    // Nur Admins dürfen User-Liste sehen
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'Admin access required' });
    }
    
    // Konvertiere Map zu Array (ohne Passwort-Hashes)
    const userList = Array.from(users.values()).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role
    }));
    
    reply.send({ success: true, users: userList });
  });

  // GET /api/users/:id
  server.get('/users/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const user = users.get(id) || Array.from(users.values()).find(u => u.id === id);
    
    if (user) {
      // Entferne Passwort-Hash aus Response
      const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
      reply.send({ success: true, user: userWithoutPassword });
    } else {
      reply.status(404).send({ success: false, error: 'User not found' });
    }
  });

  // POST /api/users - nur Admins
  server.post('/users', { preHandler: authMiddleware }, async (request, reply) => {
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'Admin access required' });
    }
    
    const { username, email, role, password } = request.body as { username: string; email: string; role: 'admin' | 'user'; password: string };
    
    if (!username || !email || !password) {
      return reply.status(400).send({ success: false, error: 'Username, email and password required' });
    }
    
    if (users.has(username)) {
      return reply.status(409).send({ success: false, error: 'Username already exists' });
    }
    
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const newUser: User = {
      id: String(users.size + 1),
      username,
      email,
      role: role || 'user',
      passwordHash
    };
    
    users.set(username, newUser);
    
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    reply.send({ success: true, user: userWithoutPassword });
  });

  // PUT /api/users/:id
  server.put('/users/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const { username, email, role, password } = request.body as { username?: string; email?: string; role?: 'admin' | 'user'; password?: string };
    
    const user = users.get(id) || Array.from(users.values()).find(u => u.id === id);
    
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }
    
    // Nur Admin oder der User selbst darf updaten
    if (request.user?.role !== 'admin' && request.user?.id !== id) {
      return reply.status(403).send({ success: false, error: 'Access denied' });
    }
    
    // Update Felder
    if (username && username !== user.username) {
      // Username ändern: alte Map-Entry löschen, neue erstellen
      users.delete(user.username);
      user.username = username;
    }
    if (email) user.email = email;
    if (role && request.user?.role === 'admin') user.role = role; // Nur Admin darf Rolle ändern
    if (password) {
      user.passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    }
    
    users.set(user.username, user);
    
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    reply.send({ success: true, user: userWithoutPassword });
  });

  // DELETE /api/users/:id - nur Admins
  server.delete('/users/:id', { preHandler: authMiddleware }, async (request, reply) => {
    if (request.user?.role !== 'admin') {
      return reply.status(403).send({ success: false, error: 'Admin access required' });
    }
    
    const id = (request.params as { id: string }).id;
    const user = users.get(id) || Array.from(users.values()).find(u => u.id === id);
    
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }
    
    // Verhindere Löschen des letzten Admin
    const adminCount = Array.from(users.values()).filter(u => u.role === 'admin').length;
    if (user.role === 'admin' && adminCount <= 1) {
      return reply.status(403).send({ success: false, error: 'Cannot delete last admin user' });
    }
    
    users.delete(user.username);
    
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    reply.send({ success: true, user: userWithoutPassword });
  });
}
