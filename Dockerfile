FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
RUN npm rebuild

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_SECRET="sims-production-secret-2026-xK9mP2qR"
ENV NEXTAUTH_URL="https://sims.ai-gcc.com"
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_SECRET="sims-production-secret-2026-xK9mP2qR"
ENV NEXTAUTH_URL="https://sims.ai-gcc.com"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.env.production ./.env

RUN chown -R nextjs:nodejs /app/prisma /app/.env

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
