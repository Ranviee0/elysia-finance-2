/* Hosts inject the port they expect the app on, so PORT wins when present. */
export const port = Number(process.env.PORT ?? 3067);

/* The page routes reach the API over HTTP in the same process, so the base
   has to follow whatever port we ended up listening on. */
export const apiBase = process.env.API_BASE_URL ?? `http://localhost:${port}`;
