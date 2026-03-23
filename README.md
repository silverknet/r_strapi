---
title: Strapi
description: A self-hosted version of Strapi using a Postgres database
tags:
  - strapi
  - postgresql
  - cms
  - javascript
---

# Strapi example

This example deploys self-hosted version of [Strapi](https://strapi.io/). Internally it uses a PostgreSQL database to store the data.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/strapi)

## Features

- Strapi
- Postgres

## Local development (Docker Postgres)

Requirements: **Docker** with Compose, **Node.js** 14.19.1–18.x, and (for syncing from production) **PostgreSQL client tools** so `pg_dump` is available — e.g. macOS: `brew install libpq` and follow Homebrew’s note about adding `libpq` to your `PATH`.

### 1. Environment

```bash
cp .env.example .env
```

Edit `.env`: secrets (`APP_KEYS`, `JWT_SECRET`, etc.) and `PG*` values that match `docker-compose.yml` (defaults: user `strapi`, password `password`, database `strapi`). If port **5432** is already in use, map another port in `docker-compose.yml` (e.g. `5433:5432`) and set `PGPORT=5433` in `.env`.

### 2. Start Postgres

```bash
npm run db:up
```

### 3. Install and run Strapi

```bash
npm install
npm run develop
```

Open [http://localhost:1337/admin](http://localhost:1337/admin). On an **empty** database, create the admin user on first visit.

**Other DB scripts**

| Command | What it does |
|--------|----------------|
| `npm run db:down` | Stop containers (data kept in the Docker volume) |
| `npm run db:reset` | **Delete** the local Postgres volume and start fresh (empty DB) — **destructive** |
| `npm run db:logs` | Tail Postgres logs |
| `npm run db:load-dump` | Load `./dump.sql` into local Postgres (if you created the file yourself) |
| `npm run db:sync-from-prod` | Dump production and restore into local Docker (see below) |

---

## Workflow: empty DB → production data → local schema

Use this when you want **live content from production**, then let **your current Git `schema.json` files** update the database (Strapi adds columns / tables for **additive** changes without wiping existing rows).

### A. Production URL (one-time setup)

1. In Railway, open your **Postgres** service and copy the connection URL (or build it from host, user, password, port, database).

2. Create **`.env.production.local`** in the project root (this file is **gitignored**):

   ```bash
   PRODUCTION_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

   Never commit this file.

### B. Full reset + import + Strapi sync

1. **Empty local database** (wipes Docker volume — all local DB data gone):

   ```bash
   npm run db:reset
   ```

   Wait a few seconds for Postgres to be ready (`npm run db:logs` if needed).

2. **Copy production into local Postgres**:

   ```bash
   npm run db:sync-from-prod
   ```

   This runs `pg_dump` against `PRODUCTION_DATABASE_URL`, writes `dump.sql` (gitignored), and restores it into Docker.

3. **Apply your local schemas** (from `src/api/**/schema.json`):

   ```bash
   npm run develop
   ```

   On startup, Strapi updates the database to match your code. **New fields** you added locally but not in prod usually appear as new columns; **existing rows** stay. Renaming/removing fields or strict required fields without defaults may need manual follow-up.

### C. When things go wrong

- **`pg_dump: command not found`** — install PostgreSQL client tools (`pg_dump` on `PATH`).
- **SSL / connection errors** to Railway — ensure the URL matches Railway’s docs; the URL usually includes SSL requirements.
- **Schema drift** — If production is **behind** your Git branch, a full dump still loads **prod’s** structure; `npm run develop` then **adds** what your branch needs. If your branch is **behind** prod, merge or deploy first, or expect fewer columns locally until you pull code.
- **Breaking schema changes** (remove field, change type) are not automatically “safe”; plan migrations or content fixes.

Production does **not** use `docker-compose.yml`; it uses Railway’s Postgres and `npm run start` after `npm run build`.

---

## How to use (Railway)

- Click the Railway button above
- Add the environment variables
  - If you do not add the Cloudinary related environment variables, your images/files will not be persisted between deploys.

## Notes

- After your app is deployed, visit the `/admin` endpoint to create your admin user.
- Railway's filesystem is ephemeral which is why any changes to the filesystem are not persisted between deploys. This is why, this example uses Cloudinary for storage.
- Database SSL: in **development** (`strapi develop`), TLS to Postgres is off by default so local Docker works. In **production** (`NODE_ENV=production`), SSL defaults on for managed hosts. Set `DATABASE_SSL=true|false` to override.

### Admin panel issues

- **`installHook.js` in the stack** usually means a **browser extension** (React DevTools, etc.) is wrapping the page — try **incognito** with extensions off to confirm.
- **`@retikolo/drag-drop-content-types`** is pinned to **`1.2.1`** in `package.json` so `npm install` does not pull a newer release that bundles its own React (that can white-screen the admin). Do not use `^` on that dependency unless you test the new version.
- After a **DB sync**, try **`npm run develop:clean`** or **`npm run build`** then **`npm run develop`** if the admin bundle looks stale.
- **`GET /admin/telemetry-properties` 401** before login is common; after login it should be **200**.
