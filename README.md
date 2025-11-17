# Nebula Chat - Next Generation Messenger

A modern, real-time messaging application built with Cloudflare Workers, featuring unique communication channels and a beautiful glass-morphism UI.

## 🚀 Features

### Core Features
- **Real-time Messaging** - Instant message delivery via WebSocket
- **Unique Channel Types**:
  - **Mental Channels** - Personal communication spaces for different mindsets
  - **Cloud Rooms** - Persistent spaces that float across devices
  - **Direct Messages** - One-on-one conversations
- **Beautiful UI** - Glass-morphism design with smooth animations
- **Online Status** - See who's online and typing indicators
- **Message Reactions** - React to messages with emojis
- **Read Receipts** - Know when your messages are read
- **User Profiles** - Customizable avatars and color schemes

### Advanced Features
- **End-to-end encryption** (planned)
- **File sharing** via Cloudflare R2
- **Voice & video calls** (planned)
- **Message search** (planned)
- **Message editing & deletion**
- **Custom themes** (planned)

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Zustand** for state management
- **Socket.IO** for real-time communication
- **Framer Motion** for animations

### Backend (Cloudflare Workers)
- **Cloudflare Workers** for serverless API
- **Cloudflare D1** (SQLite) for database
- **Cloudflare KV** for session storage
- **WebSockets** for real-time messaging
- **JWT** for authentication

### Infrastructure
- **Cloudflare Pages** for frontend hosting
- **Cloudflare Workers** for backend API
- **Cloudflare D1** for database
- **Cloudflare R2** for file storage (planned)

## 📁 Project Structure

```
nebula-chat/
├── landing/              # Marketing landing page
│   ├── src/
│   │   ├── components/   # React components
│   │   └── App.tsx       # Main app component
│   ├── package.json
│   └── vite.config.ts
├── frontend/             # Main messenger application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── store/        # Zustand stores
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Cloudflare Workers API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── websocket/    # WebSocket server
│   │   ├── middleware/   # Request middleware
│   │   └── utils/        # Utility functions
│   ├── package.json
│   └── wrangler.toml
├── database/             # Database schema
│   └── schema.sql
├── ideas.md              # Future development ideas
└── README.md
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd nebula-chat

# Install dependencies for all packages
npm install
cd landing && npm install
cd ../frontend && npm install
cd ../backend && npm install
```

### 2. Environment Configuration

```bash
# Frontend environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URLs

# Backend environment (configured in wrangler.toml)
# Update wrangler.toml with your Cloudflare resource IDs
```

### 3. Database Setup

```bash
cd backend

# Create D1 database
wrangler d1 create messenger-db

# Update wrangler.toml with the database ID

# Run migrations (local)
npm run migrate-local

# Run migrations (production)
npm run migrate
```

### 4. Local Development

```bash
# Start backend (Cloudflare Workers dev server)
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev

# Start landing page (in another terminal)
cd landing
npm run dev
```

The applications will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8787
- Landing: http://localhost:5174

## 🚀 Deployment

### 1. Backend Deployment

```bash
cd backend

# Deploy to Cloudflare Workers
npm run deploy

# Run database migrations
npm run migrate
```

### 2. Frontend Deployment

```bash
cd frontend

# Deploy to Cloudflare Pages
npm run deploy
```

### 3. Landing Page Deployment

```bash
cd landing

# Deploy to Cloudflare Pages
npm run deploy
```

## 📊 Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-worker.your-subdomain.workers.dev/api
VITE_WS_URL=wss://your-worker.your-subdomain.workers.dev
```

### Backend (wrangler.toml)
```toml
[vars]
JWT_SECRET = "your-production-jwt-secret"
ENVIRONMENT = "production"
CORS_ORIGIN = "https://your-domain.pages.dev"
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/avatar` - Upload avatar
- `PUT /api/user/color-scheme` - Update color scheme
- `GET /api/user/search` - Search users

### Dialogs (Direct Messages)
- `GET /api/dialogs` - Get user dialogs
- `POST /api/dialogs` - Create new dialog
- `GET /api/dialogs/:id/messages` - Get dialog messages

### Channels
- `GET /api/channels` - Get user channels
- `POST /api/channels` - Create new channel
- `GET /api/channels/:id/messages` - Get channel messages
- `POST /api/channels/:id/join` - Join channel
- `POST /api/channels/:id/leave` - Leave channel

### Messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/reactions` - Add reaction
- `DELETE /api/messages/:id/reactions/:emoji` - Remove reaction

## 🔌 WebSocket Events

### Client to Server
- `message` - Send message
- `typing` - Typing indicator
- `join_room` - Join channel room
- `leave_room` - Leave channel room
- `reaction` - Add/remove reaction
- `read_receipt` - Mark message as read

### Server to Client
- `message` - New message received
- `typing` - User is typing
- `online_status` - Online users list
- `reaction` - Message reaction
- `read_receipt` - Message read receipt

## 🎨 UI Components

### Core Components
- `MessageList` - Display messages with reactions
- `DialogList` - List of user conversations
- `ChannelList` - List of channels
- `UserAvatar` - User avatar with color scheme
- `TypingIndicator` - Typing animation
- `MessageReactions` - Message reaction display

### Pages
- `LoginPage` - User authentication
- `RegisterPage` - User registration
- `ChatPage` - Main chat interface
- `ProfilePage` - User profile settings

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- SQL injection prevention
- XSS protection

## 🚀 Performance Optimizations

- Cloudflare's global network
- Database indexing
- WebSocket connection pooling
- Lazy loading components
- Image optimization
- Code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Join our Discord server (link coming soon)
- Email us at support@nebulachat.com

## 🗺️ Roadmap

See [ideas.md](./ideas.md) for upcoming features and development ideas.

---

Built with ❤️ using Cloudflare's global infrastructure