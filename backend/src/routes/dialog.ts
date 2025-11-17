import { Hono } from 'hono';
import { Dialog, User, Message, Env } from '../types';

const dialogRoutes = new Hono<{ Bindings: Env }>();

// Get all dialogs for current user
dialogRoutes.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    // Get all dialogs for the user
    const dialogs = await c.env.DB.prepare(`
      SELECT d.*, 
             u.id as participant_id,
             u.username as participant_username,
             u.email as participant_email,
             u.avatar as participant_avatar,
             u.status as participant_status,
             u.lastSeen as participant_lastSeen,
             u.colorScheme as participant_colorScheme,
             m.id as last_message_id,
             m.content as last_message_content,
             m.type as last_message_type,
             m.timestamp as last_message_timestamp,
             m.senderId as last_message_senderId
      FROM dialogs d
      JOIN users u ON (CASE WHEN d.userId1 = ? THEN u.id = d.userId2 ELSE u.id = d.userId1 END)
      LEFT JOIN messages m ON d.lastMessageId = m.id
      WHERE d.userId1 = ? OR d.userId2 = ?
      ORDER BY d.updatedAt DESC
    `).bind(userId, userId, userId).all();

    // Format dialogs and get unread counts
    const formattedDialogs = await Promise.all(dialogs.map(async (dialog: any) => {
      const participantId = dialog.participant_id;
      
      // Get unread count
      const unreadResult = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE ((senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?))
        AND receiverId = ?
        AND id NOT IN (
          SELECT messageId FROM read_receipts WHERE userId = ?
        )
      `).bind(participantId, userId, userId, participantId, userId, userId).first();

      const unreadCount = unreadResult?.count as number || 0;

      return {
        id: dialog.id,
        participant: {
          id: dialog.participant_id,
          username: dialog.participant_username,
          email: dialog.participant_email,
          avatar: dialog.participant_avatar,
          status: dialog.participant_status,
          lastSeen: dialog.participant_lastSeen,
          colorScheme: dialog.participant_colorScheme,
        },
        lastMessage: dialog.last_message_id ? {
          id: dialog.last_message_id,
          content: dialog.last_message_content,
          type: dialog.last_message_type,
          timestamp: dialog.last_message_timestamp,
          senderId: dialog.last_message_senderId,
        } : null,
        unreadCount,
        isTyping: false, // This would be managed by WebSocket
        lastActivity: dialog.updatedAt,
      };
    }));

    return c.json({
      success: true,
      data: formattedDialogs,
    });
  } catch (error) {
    console.error('Get dialogs error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Create new dialog
dialogRoutes.post('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { participantId } = await c.req.json();

    if (!participantId) {
      return c.json({ success: false, error: 'Participant ID is required' }, 400);
    }

    if (participantId === payload.userId) {
      return c.json({ success: false, error: 'Cannot create dialog with yourself' }, 400);
    }

    // Check if dialog already exists
    const existingDialog = await c.env.DB.prepare(`
      SELECT id FROM dialogs 
      WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)
    `).bind(payload.userId, participantId, participantId, payload.userId).first();

    if (existingDialog) {
      return c.json({ success: false, error: 'Dialog already exists' }, 409);
    }

    // Check if participant exists
    const participant = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(participantId).first();

    if (!participant) {
      return c.json({ success: false, error: 'Participant not found' }, 404);
    }

    const dialogId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create dialog
    await c.env.DB.prepare(`
      INSERT INTO dialogs (id, userId1, userId2, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).bind(dialogId, payload.userId, participantId, now, now).run();

    // Get participant info
    const participantInfo = await c.env.DB.prepare(
      'SELECT id, username, email, avatar, status, lastSeen, colorScheme FROM users WHERE id = ?'
    ).bind(participantId).first() as User;

    return c.json({
      success: true,
      data: {
        id: dialogId,
        participant: participantInfo,
        lastMessage: null,
        unreadCount: 0,
        isTyping: false,
        lastActivity: now,
      },
    });
  } catch (error) {
    console.error('Create dialog error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get messages for a dialog
dialogRoutes.get('/:id/messages', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const dialogId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Verify dialog belongs to user
    const dialog = await c.env.DB.prepare(`
      SELECT * FROM dialogs 
      WHERE id = ? AND (userId1 = ? OR userId2 = ?)
    `).bind(dialogId, payload.userId, payload.userId).first();

    if (!dialog) {
      return c.json({ success: false, error: 'Dialog not found' }, 404);
    }

    // Get messages
    const messages = await c.env.DB.prepare(`
      SELECT m.*, 
             u.username as sender_username,
             u.colorScheme as sender_colorScheme
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE (m.receiverId = ? AND m.senderId = ?) OR (m.receiverId = ? AND m.senderId = ?)
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `).bind(
      payload.userId, dialog.userId1 === payload.userId ? dialog.userId2 : dialog.userId1,
      dialog.userId1 === payload.userId ? dialog.userId2 : dialog.userId1, payload.userId,
      limit, offset
    ).all();

    // Mark messages as read
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO read_receipts (messageId, userId, readAt)
      SELECT id, ?, ? 
      FROM messages 
      WHERE receiverId = ? AND id NOT IN (
        SELECT messageId FROM read_receipts WHERE userId = ?
      )
    `).bind(payload.userId, new Date().toISOString(), payload.userId, payload.userId).run();

    return c.json({
      success: true,
      data: messages.reverse().map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        type: msg.type,
        timestamp: msg.timestamp,
        edited: msg.edited,
        readBy: [], // Would be populated from read_receipts
        reactions: [], // Would be populated from reactions table
      })),
    });
  } catch (error) {
    console.error('Get dialog messages error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { dialogRoutes };