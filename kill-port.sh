#!/bin/bash
PORT=${1:-4443}
echo "🔍 Finding process on port $PORT..."
PID=$(lsof -ti:$PORT)
if [ -z "$PID" ]; then
  echo "✅ No process found on port $PORT"
else
  echo "🛑 Killing process $PID on port $PORT..."
  kill -9 $PID
  echo "✅ Process killed"
fi
