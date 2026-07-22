# syntax=docker/dockerfile:1.7

# This base stage contains settings shared by dependency installation and build.
FROM node:24-alpine AS base

# Some Node.js packages expect glibc compatibility when running on Alpine Linux.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Keep pnpm in a predictable path and disable anonymous Next.js telemetry.
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1

# Pin pnpm so local, Jenkins, and Docker builds use the same package manager.
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate


# -----------------------------------------------------------------------------
# Dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy only dependency files first. Source-code changes do not invalidate this
# layer, so Docker can reuse node_modules when package files did not change.
COPY package.json pnpm-lock.yaml ./

# The cache mount preserves downloaded pnpm packages even if this RUN layer must
# execute again. --frozen-lockfile prevents Docker from silently changing the
# dependency graph during a production build.
RUN --mount=type=cache,id=lsevin-webapp-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile


# -----------------------------------------------------------------------------
# Build
# -----------------------------------------------------------------------------
FROM base AS builder

# Reuse the dependency tree created in the previous stage.
COPY --from=dependencies /app/node_modules ./node_modules

# Source files are copied only after dependencies, preserving the dependency
# cache for ordinary TypeScript, CSS, image, and component changes.
COPY . .

# NEXT_PUBLIC_* values are compiled into browser JavaScript by Next.js, so they
# must be available during the image build.
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FILES_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG NEXT_PUBLIC_NESHAN_MAP_KEY

ENV NODE_ENV=production \
    SKIP_ENV_VALIDATION=true \
    NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_FILES_URL=${NEXT_PUBLIC_FILES_URL} \
    NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL} \
    NEXT_PUBLIC_MAPBOX_TOKEN=${NEXT_PUBLIC_MAPBOX_TOKEN} \
    NEXT_PUBLIC_NESHAN_MAP_KEY=${NEXT_PUBLIC_NESHAN_MAP_KEY}

# Preserve Next.js' incremental compilation cache across Docker builds.
# The three secrets are mounted only for this RUN instruction. They are not
# stored in Dockerfile ARG/ENV metadata or copied into the production image.
RUN --mount=type=cache,id=lsevin-webapp-next-cache,target=/app/.next/cache \
    --mount=type=secret,id=database_url \
    --mount=type=secret,id=auth_secret \
    --mount=type=secret,id=webhook_key \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    AUTH_SECRET="$(cat /run/secrets/auth_secret)" \
    WEBHOOK_KEY="$(cat /run/secrets/webhook_key)" \
    pnpm build


# -----------------------------------------------------------------------------
# Production runtime
# -----------------------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The production process does not run as root.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# This Dockerfile expects output: "standalone" in next.config.*.
# --chown avoids a slow additional recursive chown layer.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
