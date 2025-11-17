-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    lastSeen TEXT NOT NULL,
    colorScheme TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    senderId TEXT NOT NULL,
    receiverId TEXT,
    channelId TEXT,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
    timestamp TEXT NOT NULL,
    edited BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mental', 'cloud', 'direct')),
    description TEXT,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    isPrivate BOOLEAN DEFAULT FALSE,
    colorScheme TEXT NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
);

-- Channel participants table
CREATE TABLE IF NOT EXISTS channel_participants (
    id TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    userId TEXT NOT NULL,
    joinedAt TEXT NOT NULL,
    FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(channelId, userId)
);

-- Dialogs table (for direct messages)
CREATE TABLE IF NOT EXISTS dialogs (
    id TEXT PRIMARY KEY,
    userId1 TEXT NOT NULL,
    userId2 TEXT NOT NULL,
    lastMessageId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (userId2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lastMessageId) REFERENCES messages(id) ON DELETE SET NULL,
    UNIQUE(userId1, userId2)
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    emoji TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(messageId, userId, emoji)
);

-- Read receipts table
CREATE TABLE IF NOT EXISTS read_receipts (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    readAt TEXT NOT NULL,
    FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(messageId, userId)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_receiverId ON messages(receiverId);
CREATE INDEX IF NOT EXISTS idx_messages_channelId ON messages(channelId);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_channel_participants_channelId ON channel_participants(channelId);
CREATE INDEX IF NOT EXISTS idx_channel_participants_userId ON channel_participants(userId);
CREATE INDEX IF NOT EXISTS idx_dialogs_userId1 ON dialogs(userId1);
CREATE INDEX IF NOT EXISTS idx_dialogs_userId2 ON dialogs(userId2);
CREATE INDEX IF NOT EXISTS idx_reactions_messageId ON reactions(messageId);
CREATE INDEX IF NOT EXISTS idx_read_receipts_messageId ON read_receipts(messageId);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);