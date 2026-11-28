# Self-hosted multilingual embeddings (multilingual-e5-small, int8). ~0.5 GB RAM.
#   docker build -t lsevin-embedding:latest frontend/embedding-service
#
# The model is downloaded at BUILD time and baked into the image, so the running service never
# needs internet access (site A in Iran cannot rely on it) and starts in seconds.
# glibc base image: onnxruntime-node has no musl (alpine) build.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY download-model.mjs ./
RUN MODEL_CACHE_DIR=/models node download-model.mjs

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8089 HOST=0.0.0.0 MODEL_CACHE_DIR=/models
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /models /models
COPY package.json server.mjs ./
# The model files are only read at run time.
RUN chmod -R a-w /models
USER node
EXPOSE 8089
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
