# Jenkins recovery

Build a new image from the health-hotfix source. The old image cannot pass `/api/health` because it does not contain the handler.

Use a visible health probe:

```groovy
try {
  timeout(time: 3, unit: 'MINUTES') {
    waitUntil {
      sleep 5
      return sh(
        returnStatus: true,
        script: '''
          curl --fail-with-body --show-error --silent \
            --connect-timeout 2 --max-time 5 \
            http://lsevin-providers-1:3000/api/health
        '''
      ) == 0
    }
  }
} catch (err) {
  sh '''
    echo "===== replica 1 state ====="
    docker inspect lsevin-providers-1 \
      --format 'status={{.State.Status}} exit={{.State.ExitCode}} error={{.State.Error}}' || true
    echo "===== replica 1 logs ====="
    docker logs --tail=250 lsevin-providers-1 || true
    echo "===== health response ====="
    curl --show-error --include --max-time 5 \
      http://lsevin-providers-1:3000/api/health || true
  '''
  throw err
}
```

Expected liveness response:

```json
{"status":"ok","service":"lsevin-providers-portal"}
```

After liveness passes, optionally check full readiness:

```bash
curl --fail-with-body --show-error --silent \
  --connect-timeout 2 --max-time 15 \
  http://lsevin-providers-1:3000/api/ready
```

`/api/ready` returns 503 until every required production setting and the database are available. Do not replace the rolling-start liveness probe with readiness unless all payment, storage, URL and database settings are intentionally required before traffic switching.
