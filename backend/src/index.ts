import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { dialogRoutes } from './routes/dialog';
import { channelRoutes } from './routes/channel';
import { messageRoutes } from './routes/message';
import { WebSocketServer } from './websocket/server';

const app = new Hono<{ Bindings: Env }();

// CORS middleware
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://your-domain.pages.dev',
      'https://your-domain.com'
    ];
    return allowedOrigins.includes(origin) || origin.endsWith('.pages.dev') ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'Nebula Chat API',
    timestamp: new Date().toISOString()
  });
});

// Public routes
app.route('/auth', authRoutes);

// Protected routes
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = await WebSocketServer.verifyToken(token, c.env.JWT_SECRET);
    c.set('jwtPayload', payload);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
});

app.route('/api/user', userRoutes);
app.route('/api/dialogs', dialogRoutes);
app.route('/api/channels', channelRoutes);
app.route('/api/messages', messageRoutes);

// WebSocket upgrade handling
app.get('/socket.io/', async (c) => {
  return await WebSocketServer.handleUpgrade(c);
});

export default {
  fetch: app.fetch,
  websocket: WebSocketServer.handleWebSocket,
};