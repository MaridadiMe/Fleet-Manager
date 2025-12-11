# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build   # creates /app/dist

# Production stage — small, secure, Debian-based (~150 MB)
FROM node:20-slim AS production
WORKDIR /app

# Only ca-certificates needed at runtime (for HTTPS calls)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nestjs

# Copy only what's needed
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built app from builder
COPY --from=builder /app/dist ./dist

USER nestjs
EXPOSE 3000

CMD ["node", "dist/main"]