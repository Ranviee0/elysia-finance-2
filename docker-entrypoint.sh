#!/bin/sh
set -e

# The volume comes up empty on the very first deploy, and SQLite will not
# create the parent directory itself.
mkdir -p "$(dirname "${DATABASE_URL#file:}")"

# Applies only pending migrations, so restarts and redeploys are no-ops and
# existing rows are left alone.
bun --bun run prisma migrate deploy

exec bun src/index.tsx
