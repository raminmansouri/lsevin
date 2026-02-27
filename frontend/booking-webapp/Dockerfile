# syntax=docker/dockerfile:1.4

############################
# Stage 1: Dependencies
############################
FROM node:20-alpine AS deps

# required by some native dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ensure pnpm is available
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

############################
# Stage 2: Build Application
############################
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# reuse installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

COPY . .

# build the Vite app
RUN pnpm build

############################
# Stage 3: Runner (Production)
############################
FROM node:20-alpine AS runner

WORKDIR /app

# set production environment
ENV NODE_ENV=production \
    PORT=3000

# simple static server for the generated output
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm add -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 4002

CMD ["serve", "-s", "dist", "-l", "4002"]