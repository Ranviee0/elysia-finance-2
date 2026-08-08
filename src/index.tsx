import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { staticPlugin } from "@elysiajs/static";
import { categoryController } from "./controllers/categories";
import { transactionController } from "./controllers/transactions";
import { categoryPage } from "./pages/category";
import { transactionsPage } from "./pages/transactions";
import { transactionsBulkPage } from "./pages/transactionsBulk";
import { exportPage } from "./pages/export";
import { analyticsPage } from "./pages/analytics";
import { authPage } from "./pages/auth";
import { port } from "./config";

const app = new Elysia()
  .use(openapi())
  .use(staticPlugin({ maxAge: 0 }))
  .use(staticPlugin({ assets: "node_modules/htmx.org/dist", prefix: "/vendor/htmx", maxAge: 0 }))
  .use(authPage)
  .use(categoryController)
  .use(transactionController)
  .use(transactionsPage)
  .use(transactionsBulkPage)
  .use(categoryPage)
  .use(exportPage)
  .use(analyticsPage)
  /* Binding all interfaces, not loopback, so a container's ingress can
     actually reach the server. */
  .listen({ port, hostname: "0.0.0.0" });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
