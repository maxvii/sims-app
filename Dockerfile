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
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/web-push ./node_modules/web-push
COPY --from=builder /app/node_modules/http_ece ./node_modules/http_ece
COPY --from=builder /app/node_modules/asn1.js ./node_modules/asn1.js
COPY --from=builder /app/node_modules/bn.js ./node_modules/bn.js
COPY --from=builder /app/node_modules/minimist ./node_modules/minimist
COPY --from=builder /app/node_modules/inherits ./node_modules/inherits
COPY --from=builder /app/node_modules/safer-buffer ./node_modules/safer-buffer
COPY --from=builder /app/node_modules/pdfkit ./node_modules/pdfkit
COPY --from=builder /app/node_modules/fontkit ./node_modules/fontkit
COPY --from=builder /app/node_modules/restructure ./node_modules/restructure
COPY --from=builder /app/node_modules/brotli ./node_modules/brotli
COPY --from=builder /app/node_modules/clone ./node_modules/clone
COPY --from=builder /app/node_modules/deep-equal ./node_modules/deep-equal
COPY --from=builder /app/node_modules/png-js ./node_modules/png-js
COPY --from=builder /app/node_modules/unicode-trie ./node_modules/unicode-trie
COPY --from=builder /app/node_modules/tiny-inflate ./node_modules/tiny-inflate
COPY --from=builder /app/node_modules/unicode-properties ./node_modules/unicode-properties
COPY --from=builder /app/node_modules/dfa ./node_modules/dfa
COPY --from=builder /app/node_modules/linebreak ./node_modules/linebreak
COPY --from=builder /app/node_modules/base64-js ./node_modules/base64-js
COPY start.sh ./start.sh

RUN mkdir -p /app/public/uploads && chmod 777 /app/public/uploads
RUN chmod +x /app/start.sh

EXPOSE 3000
CMD ["sh", "start.sh"]
