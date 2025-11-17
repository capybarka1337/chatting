import { Hono } from 'hono';
import { User, Env } from '../types';

const userRoutes = new Hono<{ Bindings: Env }>();

// Get current user profile
userRoutes.get('/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, avatar, status, lastSeen, colorScheme FROM users WHERE id = ?'
    ).bind(payload.userId).first() as User;

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        colorScheme: user.colorScheme,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Update user profile
userRoutes.put('/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { username, email } = await c.req.json();

    if (!username && !email) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    // Check if username/email is already taken by another user
    if (username || email) {
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?'
      ).bind(username || '', email || '', payload.userId).first();

      if (existingUser) {
        return c.json({ success: false, error: 'Username or email already exists' }, 409);
      }
    }

    const now = new Date().toISOString();
    
    // Update user
    await c.env.DB.prepare(`
      UPDATE users 
      SET username = COALESCE(?, username), 
          email = COALESCE(?, email),
          updatedAt = ?
      WHERE id = ?
    `).bind(username, email, now, payload.userId).run();

    // Get updated user
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, avatar, status, lastSeen, colorScheme FROM users WHERE id = ?'
    ).bind(payload.userId).first() as User;

    return c.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        colorScheme: user.colorScheme,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Update avatar
userRoutes.post('/avatar', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const formData = await c.req.formData();
    const avatar = formData.get('avatar') as File;

    if (!avatar) {
      return c.json({ success: false, error: 'No avatar file provided' }, 400);
    }

    // In a real implementation, you would upload to Cloudflare R2
    // For now, we'll just return a placeholder URL
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.userId}`;
    
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE users SET avatar = ?, updatedAt = ? WHERE id = ?'
    ).bind(avatarUrl, now, payload.userId).run();

    return c.json({
      success: true,
      data: { avatar: avatarUrl },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Update color scheme
userRoutes.put('/color-scheme', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { colorScheme } = await c.req.json();

    if (!colorScheme) {
      return c.json({ success: false, error: 'Color scheme is required' }, 400);
    }

    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE users SET colorScheme = ?, updatedAt = ? WHERE id = ?'
    ).bind(colorScheme, now, payload.userId).run();

    return c.json({
      success: true,
      data: { colorScheme },
    });
  } catch (error) {
    console.error('Update color scheme error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Search users
userRoutes.get('/search', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const query = c.req.query('q');

    if (!query) {
      return c.json({ success: false, error: 'Search query is required' }, 400);
    }

    const users = await c.env.DB.prepare(`
      SELECT id, username, email, avatar, status, lastSeen, colorScheme 
      FROM users 
      WHERE (username LIKE ? OR email LIKE ?) AND id != ?
      LIMIT 20
    `).bind(`%${query}%`, `%${query}%`, payload.userId).all() as User[];

    return c.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        colorScheme: user.colorScheme,
      })),
    });
  } catch (error) {
    console.error('Search users error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { userRoutes };