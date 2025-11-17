import { Hono } from 'hono';
import { Channel, Env } from '../types';

const channelRoutes = new Hono<{ Bindings: Env }>();

// Get all channels for current user
channelRoutes.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    // Get channels where user is a participant
    const channels = await c.env.DB.prepare(`
      SELECT c.*, 
             u.username as creator_username,
             u.colorScheme as creator_colorScheme
      FROM channels c
      JOIN channel_participants cp ON c.id = cp.channelId
      LEFT JOIN users u ON c.createdBy = u.id
      WHERE cp.userId = ?
      ORDER BY c.createdAt DESC
    `).bind(userId).all();

    // Get participant counts for each channel
    const channelsWithParticipants = await Promise.all(channels.map(async (channel: any) => {
      const participantCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM channel_participants WHERE channelId = ?'
      ).bind(channel.id).first();

      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        participants: [], // Would be populated if needed
        createdBy: channel.createdBy,
        createdAt: channel.createdAt,
        isPrivate: channel.isPrivate,
        colorScheme: channel.colorScheme,
        participantCount: participantCount?.count as number || 0,
      };
    }));

    return c.json({
      success: true,
      data: channelsWithParticipants,
    });
  } catch (error) {
    console.error('Get channels error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Create new channel
channelRoutes.post('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { name, type, description, isPrivate, participantIds } = await c.req.json();

    if (!name || !type) {
      return c.json({ success: false, error: 'Name and type are required' }, 400);
    }

    if (!['mental', 'cloud', 'direct'].includes(type)) {
      return c.json({ success: false, error: 'Invalid channel type' }, 400);
    }

    const channelId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Generate color scheme based on channel name
    const colorSchemes = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorScheme = colorSchemes[Math.abs(hash) % colorSchemes.length];

    // Create channel
    await c.env.DB.prepare(`
      INSERT INTO channels (id, name, type, description, createdBy, createdAt, isPrivate, colorScheme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(channelId, name, type, description, payload.userId, now, isPrivate || false, colorScheme).run();

    // Add creator as participant
    await c.env.DB.prepare(`
      INSERT INTO channel_participants (channelId, userId, joinedAt)
      VALUES (?, ?, ?)
    `).bind(channelId, payload.userId, now).run();

    // Add other participants if provided
    if (participantIds && Array.isArray(participantIds)) {
      for (const participantId of participantIds) {
        // Verify participant exists
        const user = await c.env.DB.prepare(
          'SELECT id FROM users WHERE id = ?'
        ).bind(participantId).first();

        if (user) {
          await c.env.DB.prepare(`
            INSERT INTO channel_participants (channelId, userId, joinedAt)
            VALUES (?, ?, ?)
          `).bind(channelId, participantId, now).run();
        }
      }
    }

    return c.json({
      success: true,
      data: {
        id: channelId,
        name,
        type,
        description,
        participants: [payload.userId, ...(participantIds || [])],
        createdBy: payload.userId,
        createdAt: now,
        isPrivate: isPrivate || false,
        colorScheme,
      },
    });
  } catch (error) {
    console.error('Create channel error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get messages for a channel
channelRoutes.get('/:id/messages', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const channelId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Verify user is a participant
    const participant = await c.env.DB.prepare(
      'SELECT * FROM channel_participants WHERE channelId = ? AND userId = ?'
    ).bind(channelId, payload.userId).first();

    if (!participant) {
      return c.json({ success: false, error: 'Access denied' }, 403);
    }

    // Get messages
    const messages = await c.env.DB.prepare(`
      SELECT m.*, 
             u.username as sender_username,
             u.colorScheme as sender_colorScheme
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.channelId = ?
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `).bind(channelId, limit, offset).all();

    return c.json({
      success: true,
      data: messages.reverse().map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        channelId: msg.channelId,
        type: msg.type,
        timestamp: msg.timestamp,
        edited: msg.edited,
        readBy: [],
        reactions: [],
      })),
    });
  } catch (error) {
    console.error('Get channel messages error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Join channel
channelRoutes.post('/:id/join', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const channelId = c.req.param('id');

    // Check if channel exists
    const channel = await c.env.DB.prepare(
      'SELECT * FROM channels WHERE id = ?'
    ).bind(channelId).first();

    if (!channel) {
      return c.json({ success: false, error: 'Channel not found' }, 404);
    }

    // Check if already a participant
    const existingParticipant = await c.env.DB.prepare(
      'SELECT * FROM channel_participants WHERE channelId = ? AND userId = ?'
    ).bind(channelId, payload.userId).first();

    if (existingParticipant) {
      return c.json({ success: false, error: 'Already a member' }, 409);
    }

    // Add participant
    await c.env.DB.prepare(`
      INSERT INTO channel_participants (channelId, userId, joinedAt)
      VALUES (?, ?, ?)
    `).bind(channelId, payload.userId, new Date().toISOString()).run();

    return c.json({
      success: true,
      message: 'Joined channel successfully',
    });
  } catch (error) {
    console.error('Join channel error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Leave channel
channelRoutes.post('/:id/leave', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const channelId = c.req.param('id');

    // Remove participant
    const result = await c.env.DB.prepare(
      'DELETE FROM channel_participants WHERE channelId = ? AND userId = ?'
    ).bind(channelId, payload.userId).run();

    if (result.changes === 0) {
      return c.json({ success: false, error: 'Not a member of this channel' }, 404);
    }

    return c.json({
      success: true,
      message: 'Left channel successfully',
    });
  } catch (error) {
    console.error('Leave channel error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { channelRoutes };