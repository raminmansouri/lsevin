# Caddy with the GeoIP plugin so it can resolve the visitor's country from their IP
# and forward it to the Next.js app as an `X-Country` header (used for first-paint
# language detection). Built with xcaddy; runtime image stays the slim alpine one.
FROM caddy:2-builder AS builder
# Maintained GeoIP module (builds against current Caddy v2; exposes {geoip2.country_code}).
RUN xcaddy build --with github.com/zhangjiayin/caddy-geoip2

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

COPY Caddyfile.server /etc/caddy/Caddyfile
