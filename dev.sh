#!/bin/bash

# Kill any existing processes on ports 3000 and 5000
pkill -f "node.*server/index.ts"
pkill -f "vite.*3001"

# Start the server in development mode
NODE_ENV=development npm run dev &
SERVER_PID=$!

# Wait briefly for the server to start
sleep 2

# Change to client directory and start Vite
cd client && npx vite --host 0.0.0.0 --port 3001 --clearScreen false --force &
CLIENT_PID=$!

# Function to handle cleanup
cleanup() {
    echo "Cleaning up processes..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for processes
wait -n $SERVER_PID $CLIENT_PID

# If either process exits, clean up
cleanup
