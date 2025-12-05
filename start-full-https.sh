#!/bin/bash

echo "🔒 Starting Full Application with HTTPS..."
echo ""

# Check backend certificates
if [ ! -f "server/certs/server.crt" ]; then
  echo "📝 Generating backend certificates..."
  cd server && npm run generate-certs && cd ..
fi

# Check frontend certificates
if [ ! -f "client/ssl/cert.pem" ]; then
  echo "📝 Generating frontend certificates..."
  cd client
  mkdir -p ssl
  openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost" 2>/dev/null
  cd ..
  echo "✅ Frontend certificates generated"
fi

# Configure backend .env
cd server
if ! grep -q "USE_HTTPS=true" .env 2>/dev/null; then
  echo "" >> .env
  echo "# HTTPS Configuration" >> .env
  echo "USE_HTTPS=true" >> .env
  echo "HTTPS_PORT=4443" >> .env
  echo "FRONTEND_ORIGIN=https://localhost:4200" >> .env
fi
cd ..

echo "✅ Starting backend on https://localhost:4443"
cd server
npm run dev:https &
BACKEND_PID=$!
cd ..

sleep 3

echo "✅ Starting frontend on https://localhost:4200"
cd client
ng serve --ssl --ssl-key ssl/key.pem --ssl-cert ssl/cert.pem &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Application started!"
echo "   Frontend: https://localhost:4200"
echo "   Backend:  https://localhost:4443"
echo ""
echo "⚠️  Accept security warnings in browser for both URLs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
