import { FastifyInstance } from 'fastify';

// Dummy user data for demonstration
const users = [
  { id: 1, name: 'Max Mustermann', email: 'max@example.com', role: 'admin' },
  { id: 2, name: 'Erika Musterfrau', email: 'erika@example.com', role: 'user' }
];

export default async function userRoutes(server: FastifyInstance) {
  // GET /api/users
  server.get('/users', async (_request, reply) => {
    reply.send({ success: true, users });
  });

  // GET /api/users/:id
  server.get('/users/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const user = users.find(u => u.id === id);
    if (user) {
      reply.send({ success: true, user });
    } else {
      reply.status(404).send({ success: false, error: 'User not found' });
    }
  });

  // POST /api/users
  server.post('/users', async (request, reply) => {
    const { name, email, role } = request.body as { name: string; email: string; role: string };
    const newUser = { id: users.length + 1, name, email, role };
    users.push(newUser);
    reply.send({ success: true, user: newUser });
  });

  // PUT /api/users/:id
  server.put('/users/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const { name, email, role } = request.body as { name?: string; email?: string; role?: string };
    const user = users.find(u => u.id === id);
    if (user) {
      user.name = name ?? user.name;
      user.email = email ?? user.email;
      user.role = role ?? user.role;
      reply.send({ success: true, user });
    } else {
      reply.status(404).send({ success: false, error: 'User not found' });
    }
  });

  // DELETE /api/users/:id
  server.delete('/users/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const deleted = users.splice(idx, 1)[0];
      reply.send({ success: true, user: deleted });
    } else {
      reply.status(404).send({ success: false, error: 'User not found' });
    }
  });
}
