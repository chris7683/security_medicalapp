#!/bin/bash
# Quick start script for HTTPS development

echo "🔒 Starting Healthcare App with HTTPS..."
echo ""

# Check if in correct directory
if [ ! -d "server" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

cd server

# Check if certificates exist
if [ ! -f "certs/server.crt" ] || [ ! -f "certs/server.key" ]; then
  echo "📝 Generating SSL certificates..."
  npm run generate-certs
  echo ""
fi

# Check if USE_HTTPS is set in .env
if [ ! -f ".env" ] || ! grep -q "USE_HTTPS=true" .env; then
  echo "📝 Configuring HTTPS in .env..."
  if [ ! -f ".env" ]; then
    touch .env
  fi
  if ! grep -q "USE_HTTPS" .env; then
    echo "" >> .env
    echo "# HTTPS Configuration" >> .env
    echo "USE_HTTPS=true" >> .env
    echo "HTTPS_PORT=4443" >> .env
  fi
  echo ""
fi

echo "✅ Starting server with HTTPS..."
echo "🌐 Backend will be available at: https://localhost:4443"
echo "⚠️  Browser will show security warning (normal for self-signed certs)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev:https
