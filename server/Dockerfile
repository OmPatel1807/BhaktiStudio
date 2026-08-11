# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code & generate Prisma Client
COPY . .
RUN npx prisma generate

# Stage 2: Production Execution Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

USER nodejs

EXPOSE 5001

CMD ["node", "src/server.js"]
