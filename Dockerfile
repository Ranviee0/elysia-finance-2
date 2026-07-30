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

RUN bun --bun run prisma generate \
    && bunx tailwindcss -i ./src/styles/input.css -o ./public/tailwind.css

EXPOSE 3067

CMD ["./docker-entrypoint.sh"]
