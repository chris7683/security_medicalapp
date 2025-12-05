#!/bin/bash

echo "🔒 Opening backend to accept certificate..."
echo ""
echo "1. Browser will open https://localhost:4443/health"
echo "2. Click 'Advanced' or 'Show Details'"
echo "3. Click 'Proceed to localhost' or 'Accept the Risk'"
echo "4. You should see: {\"status\":\"ok\"}"
echo ""
echo "After accepting, your frontend will be able to connect!"
echo ""

# Try to open in default browser
if command -v open &> /dev/null; then
  open https://localhost:4443/health
elif command -v xdg-open &> /dev/null; then
  xdg-open https://localhost:4443/health
else
  echo "Please manually open: https://localhost:4443/health"
fi
