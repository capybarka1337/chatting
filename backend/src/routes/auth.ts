import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, JWTPayload, Env } from '../types';

const authRoutes = new Hono<{ Bindings: Env }>();

// Generate JWT token
const generateToken = (user: User, env: Env): string => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate color scheme based on username
const generateColorScheme = (username: string): string => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-yellow-400 to-yellow-600',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Register
authRoutes.post('/register', async (c) => {
  try {
    const { username, email, password, colorScheme } = await c.req.json();

    if (!username || !email || !password) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    if (password.length < 6) {
      return c.json({ success: false, error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();

    if (existingUser) {
      return c.json({ success: false, error: 'Username or email already exists' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const userColorScheme = colorScheme || generateColorScheme(username);

    // Create user
    await c.env.DB.prepare(`
      INSERT INTO users (id, username, email, password, status, lastSeen, colorScheme, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'offline', ?, ?, ?, ?)
    `).bind(userId, username, email, hashedPassword, now, userColorScheme, now, now).run();

    // Get created user
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, status, lastSeen, colorScheme FROM users WHERE id = ?'
    ).bind(userId).first() as User;

    const token = generateToken(user, c.env);

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status,
          lastSeen: user.lastSeen,
          colorScheme: user.colorScheme,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    // Find user by email or username
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? OR username = ?'
    ).bind(email, email).first() as User;

    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Update last seen and status
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE users SET status = ?, lastSeen = ? WHERE id = ?'
    ).bind('online', now, user.id).run();

    const token = generateToken(user, c.env);

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          status: 'online',
          lastSeen: now,
          colorScheme: user.colorScheme,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = jwt.decode(token) as JWTPayload;

    if (payload?.userId) {
      // Update user status to offline
      const now = new Date().toISOString();
      await c.env.DB.prepare(
        'UPDATE users SET status = ?, lastSeen = ? WHERE id = ?'
      ).bind('offline', now, payload.userId).run();
    }

    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { authRoutes };