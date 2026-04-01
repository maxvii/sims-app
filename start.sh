#!/bin/sh
echo "Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Checking if database needs seeding..."
EVENT_COUNT=$(node -e "
const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();
prisma.event.count().then(c => { console.log(c); prisma.\$disconnect(); }).catch(() => { console.log('0'); prisma.\$disconnect(); });
" 2>/dev/null)

if [ "$EVENT_COUNT" = "0" ] || [ -z "$EVENT_COUNT" ]; then
  echo "No events found. Running seed..."
  node prisma/seed.cjs && echo "Seed completed successfully." || echo "WARNING: Seed failed, continuing anyway."
else
  echo "Database already has $EVENT_COUNT events. Skipping seed."
fi

echo "Starting server..."
node server.js
