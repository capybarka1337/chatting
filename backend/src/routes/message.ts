import { Hono } from 'hono';
import { Env } from '../types';

const messageRoutes = new Hono<{ Bindings: Env }>();

// Send message
messageRoutes.post('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { content, receiverId, channelId, type = 'text' } = await c.req.json();

    if (!content && type !== 'image') {
      return c.json({ success: false, error: 'Content is required' }, 400);
    }

    if (!receiverId && !channelId) {
      return c.json({ success: false, error: 'Receiver or channel ID is required' }, 400);
    }

    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create message
    await c.env.DB.prepare(`
      INSERT INTO messages (id, content, senderId, receiverId, channelId, type, timestamp, edited)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(messageId, content, payload.userId, receiverId, channelId, type, now, false).run();

    // Update dialog's last message if it's a direct message
    if (receiverId) {
      const dialog = await c.env.DB.prepare(`
        SELECT id FROM dialogs 
        WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)
      `).bind(payload.userId, receiverId, receiverId, payload.userId).first();

      if (dialog) {
        await c.env.DB.prepare(`
          UPDATE dialogs SET lastMessageId = ?, updatedAt = ? WHERE id = ?
        `).bind(messageId, now, dialog.id).run();
      }
    }

    // Get message with sender info
    const message = await c.env.DB.prepare(`
      SELECT m.*, u.username as sender_username, u.colorScheme as sender_colorScheme
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `).bind(messageId).first();

    return c.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        channelId: message.channelId,
        type: message.type,
        timestamp: message.timestamp,
        edited: message.edited,
        readBy: [],
        reactions: [],
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Edit message
messageRoutes.put('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const messageId = c.req.param('id');
    const { content } = await c.req.json();

    if (!content) {
      return c.json({ success: false, error: 'Content is required' }, 400);
    }

    // Check if message exists and belongs to user
    const message = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE id = ? AND senderId = ?'
    ).bind(messageId, payload.userId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found or access denied' }, 404);
    }

    // Update message
    await c.env.DB.prepare(`
      UPDATE messages SET content = ?, edited = ? WHERE id = ?
    `).bind(content, true, messageId).run();

    return c.json({
      success: true,
      data: {
        id: messageId,
        content,
        edited: true,
      },
    });
  } catch (error) {
    console.error('Edit message error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Delete message
messageRoutes.delete('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const messageId = c.req.param('id');

    // Check if message exists and belongs to user
    const message = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE id = ? AND senderId = ?'
    ).bind(messageId, payload.userId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found or access denied' }, 404);
    }

    // Delete message
    await c.env.DB.prepare(
      'DELETE FROM messages WHERE id = ?'
    ).bind(messageId).run();

    return c.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Add reaction
messageRoutes.post('/:id/reactions', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const messageId = c.req.param('id');
    const { emoji } = await c.req.json();

    if (!emoji) {
      return c.json({ success: false, error: 'Emoji is required' }, 400);
    }

    // Check if message exists
    const message = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE id = ?'
    ).bind(messageId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found' }, 404);
    }

    const reactionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Add reaction
    await c.env.DB.prepare(`
      INSERT INTO reactions (id, messageId, userId, emoji, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(reactionId, messageId, payload.userId, emoji, now).run();

    return c.json({
      success: true,
      data: {
        id: reactionId,
        messageId,
        userId: payload.userId,
        emoji,
        timestamp: now,
      },
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Remove reaction
messageRoutes.delete('/:id/reactions/:emoji', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const messageId = c.req.param('id');
    const emoji = c.req.param('emoji');

    // Remove reaction
    const result = await c.env.DB.prepare(`
      DELETE FROM reactions WHERE messageId = ? AND userId = ? AND emoji = ?
    `).bind(messageId, payload.userId, emoji).run();

    if (result.changes === 0) {
      return c.json({ success: false, error: 'Reaction not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Reaction removed successfully',
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { messageRoutes };