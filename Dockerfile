FROM oven/bun:1

WORKDIR /app

# Dev deps stay in the image on purpose: the Prisma CLI runs migrations at
# container start, and it lives in devDependencies.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# The DB lives on a mounted volume so it outlives the container. Anything
# writing here at build time would be thrown away, so only runtime touches it.
ENV DATABASE_URL="file:/app/data/app.db"
ENV PORT=3067
ENV NODE_ENV=production

# Pages are rendered on the server, so the container clock is the one the UI
# reads: timestamps are stored as UTC, and everything user-facing — formatted
# times, the "today" filter range, the analytics month boundaries — is derived
# in whatever zone this names. A container defaulting to UTC shows Bangkok
# entries seven hours early. Override for a different locale.
ENV TZ=Asia/Bangkok

RUN bun --bun run prisma generate \
    && bunx tailwindcss -i ./src/styles/input.css -o ./public/tailwind.css

EXPOSE 3067

CMD ["./docker-entrypoint.sh"]
