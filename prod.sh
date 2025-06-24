#!/bin/bash

# Function to check if port is in use
check_port() {
    nc -z localhost $1 2>/dev/null
    return $?
}

# Try to free port 5001 if it's in use
if check_port 5001; then
    echo "Port 5001 is in use. Attempting to free it..."
    pkill -f "node.*dist/index.js" || true
fi

# Clean up previous build
rm -rf dist/* 2>/dev/null

# Build the client and server
echo "Building application..."
npm run build

# Set production environment variables
export NODE_ENV=production
export PORT=5001
export HOST=0.0.0.0

# Start the server in production mode
echo "Starting server in production mode..."
node dist/index.js
