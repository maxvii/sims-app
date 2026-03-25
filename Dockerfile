FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm rebuild

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Placeholder — prisma generate only reads schema, doesn't connect
ENV DATABASE_URL="postgresql://x:x@x:5432/x"
RUN npx prisma generate && npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY start.sh ./start.sh

RUN mkdir -p /app/public/uploads && chmod 777 /app/public/uploads
RUN chmod +x /app/start.sh

EXPOSE 3000
CMD ["sh", "start.sh"]
