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

# If booking needs envs in the bundle, prefer VITE_* (Vite only inlines those)
ARG VITE_PUBLIC_URL
ARG VITE_PUBLIC_API_URL
ENV NODE_ENV=production \
    VITE_PUBLIC_URL=${VITE_PUBLIC_URL} \
    VITE_PUBLIC_API_URL=${VITE_PUBLIC_API_URL}

RUN pnpm build

############################
# Stage 3: Runner (Production)
############################
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=4002 \
    HOSTNAME=0.0.0.0

# non-root user (optional, matches your style)
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 booking

# copy only built output
COPY --from=builder /app/dist ./dist

# install a tiny static server (npm avoids pnpm global-bin issues)
RUN npm i -g serve@14

RUN chown -R booking:nodejs /app
USER booking

EXPOSE 4002

# SPA mode so refresh works (React Router)
CMD ["serve", "-s", "dist", "-l", "4002"]