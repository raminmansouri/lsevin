FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf '%s\n' \
'server {' \
'  listen 4002;' \
'  server_name _;' \
'  location = /booking { return 301 /booking/; }' \
'  location /booking/ {' \
'    alias /usr/share/nginx/html/;' \
'    try_files $uri $uri/ /index.html;' \
'  }' \
'}' > /etc/nginx/conf.d/default.conf

EXPOSE 4002
CMD ["nginx", "-g", "daemon off;"]