import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { registerAdmin, loginAdmin } from './lib/auth';
import { authMiddleware } from './lib/middleware';
import { prisma } from './lib/prisma';

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'navisense-api',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, organizationName } = req.body;

  if (!email || !password || !name || !organizationName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await registerAdmin(email, password, name, organizationName);
  return res.status(result.status || 500).json(result);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const result = await loginAdmin(email, password);
  return res.status(result.status || 500).json(result);
});

// Protected route example
app.get('/api/admin/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { organization: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: user.organization,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/admin', authMiddleware, (_req, res) => {
  res.json({
    message: 'Admin API ready',
    features: ['auth', 'organizations', 'buildings', 'floors', 'qr-codes'],
  });
});

app.listen(port, () => {
  console.log(`Navisense API running on http://localhost:${port}`);
  console.log(`Auth routes:`);
  console.log(`  POST /api/auth/register`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/admin/me (requires token)`);
});
