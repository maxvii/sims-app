FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate
RUN npx prisma db push --accept-data-loss
RUN node prisma/seed.cjs
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy the seeded database
COPY --from=builder /app/prisma/dev.db ./prisma/dev.db

# Data directory needs to be writable
RUN chown -R nextjs:nodejs /app/prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
