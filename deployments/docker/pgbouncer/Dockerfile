ARG PGBOUNCER_VERSION=1.25.2

FROM alpine:3.22 AS build
ARG PGBOUNCER_VERSION

RUN apk add --no-cache \
      build-base \
      c-ares-dev \
      ca-certificates \
      libevent-dev \
      linux-headers \
      openssl-dev \
      pkgconf \
      wget

# Build only the server binary. The default `make` target also builds
# documentation and PgBouncer 1.25.x requires Pandoc for those man pages.
RUN wget -q \
      "https://www.pgbouncer.org/downloads/files/${PGBOUNCER_VERSION}/pgbouncer-${PGBOUNCER_VERSION}.tar.gz" \
      -O /tmp/pgbouncer.tar.gz \
    && tar -xzf /tmp/pgbouncer.tar.gz -C /tmp \
    && cd "/tmp/pgbouncer-${PGBOUNCER_VERSION}" \
    && ./configure \
      --prefix=/usr/local \
      --with-libevent=libevent \
      --with-cares \
    && make -j"$(getconf _NPROCESSORS_ONLN)" pgbouncer \
    && mkdir -p /usr/local/bin \
    && install -m 0755 pgbouncer /usr/local/bin/pgbouncer \
    && /usr/local/bin/pgbouncer --version

FROM alpine:3.22

RUN apk add --no-cache \
      c-ares \
      ca-certificates \
      libevent \
      libssl3 \
      postgresql17-client \
      su-exec \
      tzdata \
    && addgroup -S -g 10001 pgbouncer \
    && adduser -S -D -H -u 10001 -G pgbouncer pgbouncer \
    && mkdir -p /etc/pgbouncer \
    && chown -R pgbouncer:pgbouncer /etc/pgbouncer

COPY --from=build /usr/local/bin/pgbouncer /usr/local/bin/pgbouncer
COPY pgbouncer.ini.template /etc/pgbouncer/pgbouncer.ini.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh

USER pgbouncer
EXPOSE 6432
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
