import { Elysia } from "elysia";
import { openapi } from '@elysia/openapi'
import { categoryController } from "./controllers/categories";
import { transactionController } from "./controllers/transactions";

const app = new Elysia()
  .use(openapi())
  .use(categoryController)
  .use(transactionController)
  .get("/", () => "Hello Elysia")
  .listen(3067);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
