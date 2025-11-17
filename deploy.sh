#!/bin/bash

# Nebula Chat Deployment Script

echo "🚀 Starting Nebula Chat Deployment..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Deploy backend
echo "📦 Deploying backend to Cloudflare Workers..."
cd backend
npm install
npm run deploy

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Deploy frontend
echo "🎨 Deploying frontend to Cloudflare Pages..."
cd ../frontend
npm install
npm run build
npm run deploy

# Deploy landing page
echo "🏠 Deploying landing page to Cloudflare Pages..."
cd ../landing
npm install
npm run build
npm run deploy

echo "✅ Deployment complete!"
echo "🌐 Your Nebula Chat is now live!"
echo ""
echo "Next steps:"
echo "1. Update your DNS records to point to Cloudflare"
echo "2. Configure custom domains in Cloudflare dashboard"
echo "3. Update environment variables with your production URLs"
echo "4. Test all features are working correctly"