import { Elysia } from "elysia";
import { openapi } from '@elysia/openapi'
import { html, Html } from "@elysia/html";
import { staticPlugin } from "@elysiajs/static";
import { categoryController } from "./controllers/categories";
import { transactionController } from "./controllers/transactions";

const app = new Elysia()
  .use(openapi())
  .use(html())
  .use(staticPlugin())
  .use(categoryController)
  .use(transactionController)
  .get("/", async () => {
    const res = await fetch("http://localhost:3067/transactions");
    const { transactions } = (await res.json()) as {
      transactions: {
        id: number;
        type: string;
        amount: string;
        transactionTime: string;
        note: string | null;
        categoryId: number | null;
        balance: number;
      }[];
    };

    const currency = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });
    const dateFormat = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <html lang="en" data-theme="light">
        <head>
          <title>Finance</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="/public/tailwind.css" />
        </head>
        <body class="min-h-screen bg-base-200 flex justify-center p-2 sm:p-10">
          <div class="w-full max-w-4xl">
            <div class="card bg-base-100 shadow-md">
              <div class="card-body p-0">
                <div class="flex items-baseline justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                  <h1 class="card-title text-lg sm:text-xl">Transactions</h1>
                  <span class="text-sm text-base-content/60">{transactions.length} entries</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <thead>
                      <tr>
                        <th class="hidden sm:table-cell">ID</th>
                        <th>Type</th>
                        <th class="text-right">Amount</th>
                        <th class="hidden md:table-cell">Category</th>
                        <th class="hidden sm:table-cell">Note</th>
                        <th class="text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isInflow = tx.type === "INCOME" || tx.type === "TRANSFER_IN";

                        return (
                          <tr class="row-hover">
                            <td class="hidden sm:table-cell text-base-content/40">#{tx.id}</td>
                            <td>
                              <span class={`badge badge-sm ${isInflow ? "badge-success" : "badge-error"}`}>
                                {tx.type}
                              </span>
                              <div class="mt-1 text-xs text-base-content/50 sm:hidden">
                                {dateFormat.format(new Date(tx.transactionTime))}
                              </div>
                            </td>
                            <td class={`text-right font-semibold tabular-nums ${isInflow ? "text-success" : "text-error"}`}>
                              {isInflow ? "+" : "-"}
                              {currency.format(Number(tx.amount))}
                            </td>
                            <td class="hidden md:table-cell text-base-content/40">{tx.categoryId ?? "—"}</td>
                            <td class="hidden sm:table-cell">{tx.note ?? <span class="text-base-content/40">—</span>}</td>
                            <td class="text-right tabular-nums">{currency.format(tx.balance)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  })
  .listen(3067);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
