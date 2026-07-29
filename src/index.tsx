import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { staticPlugin } from "@elysiajs/static";
import { categoryController } from "./controllers/categories";
import { transactionController } from "./controllers/transactions";
import { categoryPage } from "./pages/category";
import { transactionsPage } from "./pages/transactions";

const app = new Elysia()
  .use(openapi())
  .use(staticPlugin({ maxAge: 0 }))
  .use(staticPlugin({ assets: "node_modules/htmx.org/dist", prefix: "/vendor/htmx", maxAge: 0 }))
  .use(categoryController)
  .use(transactionController)
  .use(transactionsPage)
  .use(categoryPage)
  .listen(3067);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
