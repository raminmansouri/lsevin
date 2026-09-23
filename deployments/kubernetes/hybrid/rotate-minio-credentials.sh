#!/bin/sh
set -eu

namespace="${1:-lsevin}"
access_key="LSV$(openssl rand -hex 8)"
secret_key="$(openssl rand -base64 30 | tr -d '\n')"
access_key_b64="$(printf %s "$access_key" | base64 -w0)"
secret_key_b64="$(printf %s "$secret_key" | base64 -w0)"

k3s kubectl -n "$namespace" patch secret api-secrets --type=merge -p \
  "{\"data\":{\"FileUploadOptions__S3__AccessKey\":\"$access_key_b64\",\"FileUploadOptions__S3__SecretKey\":\"$secret_key_b64\"}}" \
  >/dev/null

unset access_key secret_key access_key_b64 secret_key_b64
echo "MinIO API credentials rotated in namespace $namespace."
