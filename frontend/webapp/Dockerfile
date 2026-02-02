# syntax=docker/dockerfile:1.4

############################
# Stage 1: Dependencies
############################
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile --ignore-scripts

############################
# Stage 2: Build Application
############################
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Declare ARGs to receive values from docker compose build.args
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FILES_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG AUTH_SECRET
ARG WEBHOOK_KEY

# Convert ARGs to ENVs so Next.js can inline them at build time
ENV NODE_ENV=production \
    NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_FILES_URL=${NEXT_PUBLIC_FILES_URL} \
    NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL} \
    NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN} \
    AUTH_SECRET=${AUTH_SECRET} \
    WEBHOOK_KEY=${WEBHOOK_KEY}

RUN pnpm build

############################
# Stage 3: Runner (Production)
############################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]