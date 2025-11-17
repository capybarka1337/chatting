#!/bin/bash

# Nebula Chat Development Setup Script

echo "🛠️ Setting up Nebula Chat for development..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup and install landing page
echo "🏠 Setting up landing page..."
cd landing
npm install
cp .env.example .env.local 2>/dev/null || echo "VITE_API_URL=http://localhost:8787/api" > .env.local

# Setup and install frontend
echo "💬 Setting up frontend..."
cd ../frontend
npm install
cp .env.example .env.local 2>/dev/null || echo "VITE_API_URL=http://localhost:8787/api" > .env.local

# Setup and install backend
echo "⚙️ Setting up backend..."
cd ../backend
npm install

# Create local D1 database
echo "🗄️ Creating local database..."
wrangler d1 execute messenger-db --local --file=./../database/schema.sql 2>/dev/null || echo "Database already exists or will be created on first run"

# Go back to root
cd ..

echo "✅ Development setup complete!"
echo ""
echo "🚀 To start development:"
echo "1. Terminal 1: cd backend && npm run dev"
echo "2. Terminal 2: cd frontend && npm run dev"
echo "3. Terminal 3: cd landing && npm run dev"
echo ""
echo "🌐 Application URLs:"
echo "- Frontend: http://localhost:5173"
echo "- Landing: http://localhost:5174"
echo "- Backend API: http://localhost:8787"
echo ""
echo "📝 Don't forget to:"
echo "- Configure your Cloudflare credentials: wrangler auth login"
echo "- Update wrangler.toml with your database ID after first deployment"