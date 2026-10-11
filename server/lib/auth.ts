import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'navisense-dev-secret';

export async function registerAdmin(email: string, password: string, name: string, organizationName: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'User already exists', status: 400 };
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        organizationId: organization.id,
        role: 'admin',
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, organizationId: organization.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: organization.id,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      token,
      status: 201,
    };
  } catch (error) {
    console.error('Register error:', error);
    return { error: 'Registration failed', status: 500 };
  }
}

export async function loginAdmin(email: string, password: string) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return { error: 'Invalid email or password', status: 401 };
    }

    // Check password
    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { error: 'Invalid email or password', status: 401 };
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, organizationId: user.organizationId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      },
      token,
      status: 200,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Login failed', status: 500 };
  }
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}
