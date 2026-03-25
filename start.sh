#!/bin/sh
echo "Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy
echo "Starting server..."
node server.js
