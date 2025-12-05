#!/bin/bash
echo "Testing CORS preflight..."
echo ""
echo "OPTIONS request to https://localhost:4443/api/auth/login"
curl -k -X OPTIONS https://localhost:4443/api/auth/login \
  -H "Origin: https://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control|error)"
