# syntax=docker/dockerfile:1.4

############################
# Stage 1: Build
############################
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# If you rely on envs inside Vite bundle, they must be VITE_*
ARG VITE_PUBLIC_URL
ARG VITE_PUBLIC_API_URL
ENV NODE_ENV=production \
    VITE_PUBLIC_URL=${VITE_PUBLIC_URL} \
    VITE_PUBLIC_API_URL=${VITE_PUBLIC_API_URL}

RUN pnpm build

############################
# Stage 2: Run (nginx)
############################
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback for React Router under /booking
RUN printf '%s\n' \
'server {' \
'  listen 4002;' \
'  server_name _;' \
'  root /usr/share/nginx/html;' \
'  index index.html;' \
'' \
'  location /booking/ {' \
'    try_files $uri $uri/ /booking/index.html;' \
'  }' \
'}' > /etc/nginx/conf.d/default.conf

EXPOSE 4002
CMD ["nginx", "-g", "daemon off;"]