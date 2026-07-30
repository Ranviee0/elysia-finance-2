# Deploying on Coolify

The app is a single container. The only state is the SQLite file, which lives on
a mounted volume at `/app/data/app.db` so restarts and redeploys leave it alone.

The repo is deployed as a **Public Repository** source, so Coolify clones it
over plain HTTPS with no GitHub App and no credentials. Nothing in the repo is
configuration: `.env` is untracked (see `.env.example`) and every deployed value
is set in Coolify.

## One-time setup

1. **New Resource → Public Repository**, then:
   - Repository URL: `https://github.com/Ranviee0/elysia-finance-2`
   - Branch: `main`
   - Build Pack: **Dockerfile**
   Coolify picks up `Dockerfile` in the repo root; nothing else to configure.
2. **Ports**: exposed port `3067`.
3. **Storages → Add → Volume Mount**:
   - Name: `finance-data` (anything)
   - Destination Path: `/app/data`
4. **Environment Variables**:
   | Key | Value | Notes |
   | --- | --- | --- |
   | `DATABASE_URL` | `file:/app/data/app.db` | Already the Dockerfile default; set it explicitly so it is visible. |
   | `COOKIE_SECURE` | `1` | Once the domain is served over HTTPS. Without it the session cookie is sent in the clear. |
   | `TZ` | `Asia/Bangkok` | Already the Dockerfile default. Pages render on the server, so this clock decides displayed times, the "today" filter, and analytics months. Leaving a container on UTC shows entries seven hours early. |
5. Set the domain, then **Deploy**.

## Triggering deploys

Deploys are manual: push to `main`, then hit **Redeploy** in Coolify. A
public-repository source has no GitHub App behind it, so nothing happens on
push by itself — which is the intent here.

## What happens on each deploy

`docker-entrypoint.sh` runs `prisma migrate deploy` before starting the server.
That applies only migrations that have not run yet, so an unchanged schema is a
no-op and existing rows are untouched. New migrations committed to the repo are
applied automatically on the next deploy.

## First login

The multi-user migration parks any pre-existing data on an `owner` account with
an unusable password hash. To claim it, open a terminal on the container in
Coolify and run:

```sh
bun run scripts/set-password.ts owner <your-password>
```

## Backups

The whole database is one file inside the volume. In Coolify, either use a
scheduled task running `cp /app/data/app.db /app/data/backup-$(date +%F).db`, or
back up the volume from the host at `/var/lib/docker/volumes/<volume>/_data`.

## Moving existing local data up

Copy your local `dev.db` into the volume once, before the first real use:

```sh
docker cp dev.db <container>:/app/data/app.db
```

Then restart the container so Prisma reopens the file.
