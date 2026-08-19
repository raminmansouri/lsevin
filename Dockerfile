# syntax=docker/dockerfile:1.7

# One Dockerfile, three targets:
#   development -> Next.js dev server
#   build       -> production build
#   production  -> minimal standalone runtime

FROM node:22.23.2-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN npm install --global pnpm@9.15.9

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=lsevin-providers-pnpm,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

FROM dependencies AS development
ENV NODE_ENV=development \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --chown=node:node . .
RUN mkdir -p /app/.next /app/public/uploads /var/lib/lsevin/private-files \
    && chown -R node:node /app/.next /app/public/uploads /var/lib/lsevin/private-files
USER node
EXPOSE 3000
CMD ["pnpm", "exec", "next", "dev", "--hostname", "0.0.0.0"]

FROM dependencies AS build
COPY . .

# NEXT_PUBLIC_* values are compiled into browser code by Next.js.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_DEFAULT_LOCALE=fa-IR
ARG NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Tehran
ARG NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE \
    NEXT_PUBLIC_DEFAULT_TIMEZONE=$NEXT_PUBLIC_DEFAULT_TIMEZONE \
    NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN=$NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN

RUN --mount=type=cache,id=lsevin-providers-next,target=/app/.next/cache,sharing=locked \
    pnpm exec next build

FROM node:22.23.2-alpine AS production
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

RUN mkdir -p /app/public/uploads /var/lib/lsevin/private-files \
    && chown -R node:node /app/public/uploads /var/lib/lsevin/private-files

USER node
EXPOSE 3000
CMD ["node", "server.js"]
