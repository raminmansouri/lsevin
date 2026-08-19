# Deployment Root-Cause Audit — B74

## Failure observed

```text
> next dev -- -H 0.0.0.0
Invalid project directory provided, no such directory: /app/-H
```

## Cause

The Compose `web` command appended `-- -H 0.0.0.0` to `pnpm run dev`. pnpm
forwards arguments after the script name to the executed script. The `dev` script
is `next dev`, so Next received an option terminator followed by `-H`; that token
was therefore parsed as the positional project directory.

## System correction

- local Compose invokes only `corepack pnpm@9.15.9 run dev`;
- package lifecycle remains authoritative, including `predev`;
- no CLI arguments are injected by Compose;
- current Next.js default hostname is used;
- local web restart policy is `no`, so a startup defect is reported once;
- deployment contract statically rejects the bad forwarding pattern and restart loop.

Production remains unchanged because it runs the standalone `server.js` artifact,
not the development CLI. Kubernetes/Rancher also consume the production image and
therefore are not affected by this `next dev` argument issue.
