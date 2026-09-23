# Local development environment

`docker-compose.dev.yml` runs the **infrastructure** the platform needs; the API
and webapp run **natively** for a fast edit/reload loop. Created for the LSevin
Shop sub-system (`docs/LSEVIN_SHOP_REQUIREMENTS_FEATURES.md`).

## 1. Start the infrastructure

```bash
cd deployments/docker
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

| Service      | Address                     | Notes |
|--------------|-----------------------------|-------|
| PostgreSQL   | `localhost:5432`            | `lsevin` / `lsevin` / db `lsevin` |
| Redis        | `localhost:6379`            | cache / rate-limit |
| EventStoreDB | `localhost:2113`            | in-memory (no persisted streams) |
| MinIO (S3)   | `localhost:9000`            | bucket `lsevin-media`, anonymous read |
| MinIO console| `localhost:9001`            | `minioadmin` / `minioadmin` |

**First boot only**, Postgres loads:

1. `auto_backups/schema_backup.sql` — the full platform schema (structure only).
2. `dev-seed/10_dev_seed.sql` — Finance currencies + FX rates + country→currency
   defaults + the `shop_pricing_mode` setting, a warehouse, delivery & payment
   methods, an 8-product demo catalogue, and identity roles.

`down` keeps the volume; `down -v` wipes it and re-runs the seed.

## 2. Apply Shop schema migrations

The `shop` schema in the dump predates the migration runner, so baseline the
pre-existing migrations once, then apply the Shop ones:

```bash
cd frontend/webapp
export DATABASE_URL=postgres://lsevin:lsevin@localhost:5432/lsevin
node scripts/migrate.mjs --baseline=$(ls db/migrations/*.sql | xargs -n1 basename | grep -vE '0018|0019' | paste -sd,)
pnpm migrate            # applies 0018_shop_v01 + 0019_shop_analytics_events
```

## 3. Run the API (needed for auth / login)

```bash
cd src/API/LSevin.Api
ASPNETCORE_URLS="http://localhost:5003" \
ConnectionStrings__database="Host=localhost;Port=5432;Database=lsevin;Username=lsevin;Password=lsevin" \
ConnectionStrings__cache="localhost:6379" \
ConnectionStrings__eventstore="esdb://localhost:2113?tls=false" \
dotnet watch
```

The webapp's sign-in is a credentials provider that calls this API, so guest
shopping works without it but anything authenticated (order history, admin) needs
it up.

## 4. Run the webapp

```bash
cd frontend/webapp
pnpm install      # first time
pnpm dev          # http://localhost:3000
```

Copy `frontend/webapp/.env.local.example` to `.env.local` if the local file does
not exist. It points at the dev infrastructure and API port `5003`.

## Kubernetes alternative

To run the same disposable infrastructure in a local Kubernetes cluster instead
of Compose, follow `deployments/kubernetes/development/README.md`. Both workflows
use identical localhost ports, so the API and webapp commands above do not
change.

## 5. Get an admin account

Register through the app UI (`/en/auth/...`), then promote yourself:

```bash
psql "postgres://lsevin:lsevin@localhost:5432/lsevin" \
  -v email='you@example.com' -f deployments/docker/dev-seed/promote-admin.sql
```

## Shop URLs

| Surface | URL |
|---|---|
| Storefront home | `/en/n/app/mobile/shop` (also `/fa/…` RTL, `/ar/…`) |
| Product | `/en/n/app/mobile/shop/product/aroma-diffuser-300ml` |
| Category | `/en/n/app/mobile/shop/category/wellness` |
| Search | `/en/n/app/mobile/shop/search?q=bike` |
| Cart / checkout | `/en/n/app/mobile/shop/cart`, `/checkout` |
| Order | `/en/n/app/mobile/shop/order/<orderNumber>` |
| Admin | `/en/admin/shop` (dashboard, orders, products, inventory, settings) |

## Tests

```bash
cd frontend/webapp
ACCOUNTING_TEST_DATABASE_URL=postgres://lsevin:lsevin@localhost:5432/lsevin \
  pnpm vitest run src/features/shop
```

## Online payment gateway (Zarinpal)

The adapter is wired (`src/features/shop/server/shop-payment.service.ts`). It needs
a merchant id: set `ZARINPAL_MERCHANT_ID` (+ `ZARINPAL_SANDBOX=true`) in
`.env.local`, or configure it in Admin → Payment Gateways, and enable the gateway.
Until then, checkout uses the **bank-transfer** method (`bank_transfer`), which an
admin confirms from the order detail page ("Record manual payment").



Docker Compose is running locally and verified healthy:
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- EventStoreDB: localhost:2113
- MinIO: localhost:9000
- MinIO console: localhost:9001
PostgreSQL contains 571 application tables.


cd deployments/docker
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build

For Kubernetes, install kind, then run:
./deployments/kubernetes/development/up.ps1



Run the API with hot reload:
$env:ASPNETCORE_ENVIRONMENT='Development'
$env:ASPNETCORE_URLS='http://localhost:5003'
$env:ConnectionStrings__database='Host=localhost;Port=5432;Database=lsevin;Username=lsevin;Password=lsevin;Include Error Detail=true'
$env:ConnectionStrings__cache='localhost:6379'
$env:ConnectionStrings__eventstore='esdb://localhost:2113?tls=false'
dotnet watch --project src/API/LSevin.Api



Run the webapp separately:
cd frontend/webapp
Copy-Item .env.local.example .env.local
pnpm install
pnpm dev