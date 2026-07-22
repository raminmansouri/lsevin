# syntax=docker/dockerfile:1.7

# This file builds a Next.js application with Node.js 24 on Alpine Linux.
# Expensive dependency installation is cached and is not repeated for normal source-code changes.

# -----------------------------------------------------------------------------
# 1. Shared Node.js and pnpm base
# -----------------------------------------------------------------------------
FROM node:24-alpine AS base

WORKDIR /app

# pnpm 10 is installed once in a reusable Docker layer.
# This layer is rebuilt only when the Node base image or this command changes.
RUN npm install --global pnpm@10

ENV NEXT_TELEMETRY_DISABLED=1

# -----------------------------------------------------------------------------
# 2. Install dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy only dependency manifests first.
# Changing application source files does not invalidate this dependency layer.
COPY package.json pnpm-lock.yaml ./

# BuildKit keeps downloaded pnpm packages in a persistent cache.
# If package.json or pnpm-lock.yaml changes, pnpm still downloads only missing packages.
RUN --mount=type=cache,id=providers-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# 3. Build Next.js
# -----------------------------------------------------------------------------
FROM dependencies AS build

# Source code is copied only after dependencies are installed.
COPY . .

# NEXT_PUBLIC values are intentionally public and are compiled into browser code.
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FILES_URL

ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FILES_URL=$NEXT_PUBLIC_FILES_URL

# Reuse Next.js' own incremental build cache between builds.
RUN --mount=type=cache,id=providers-next-cache,target=/app/.next/cache,sharing=locked \
    pnpm build

# -----------------------------------------------------------------------------
# 4. Production image
# -----------------------------------------------------------------------------
FROM base AS production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run the website as a non-root Linux user.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy the built application, source migrations, and installed dependencies.
# Migrations can therefore run from the exact same immutable image that is deployed.
COPY --from=build --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

# package.json must contain: "start": "next start".
CMD ["pnpm", "start"]
