# syntax=docker/dockerfile:1.4

############################
# Stage 1: Dependencies
############################
FROM node:20-alpine AS deps

# Install necessary system packages
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Enable Corepack and prepare a specific pnpm version
# Using a specific version instead of latest
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with --force flag to address lockfile compatibility
RUN pnpm install --no-frozen-lockfile --ignore-scripts

############################
# Stage 2: Build Application
############################
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack and prepare the same pnpm version
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy installed dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set build-time environment variables (adjust these as necessary)
ENV NODE_ENV=production \
    NEXT_PUBLIC_URL=http://lsevin-webapp \
    NEXT_PUBLIC_API_URL=http://lsevin-api/api/v1 \
    NEXT_PUBLIC_FILES_URL=http://5.61.29.142:8081/files \
    NEXT_PUBLIC_SOCKET_URL=http://lsevin-api/hubs \
    AUTH_URL=http://lsevin-webapp \
    AUTH_SECRET=Dj9bfnBVE0RXNAP6u8EZvXY8r3QsLYv9dYzMmzCwKHM= \
    AUTH_TRUST_HOST=true \
    WEBHOOK_KEY=U2FsdGVkX19d4y75XdwaEBcuX8YPIb7mpGlDHmnFFwB46CIEFm9kCo7CyllvDyvY1ZzvOq40QvY6Fc8MrNDldA==%

# Build the Next.js application
RUN pnpm build

############################
# Stage 3: Runner (Production)
############################
FROM node:20-alpine AS runner

WORKDIR /app

# Set runtime environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership of the files
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
