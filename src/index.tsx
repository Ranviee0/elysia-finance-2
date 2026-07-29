import { Elysia } from "elysia";
import { openapi } from '@elysia/openapi'
import { html, Html } from "@elysia/html";
import { staticPlugin } from "@elysiajs/static";
import { categoryController } from "./controllers/categories";
import { transactionController } from "./controllers/transactions";
import { categoryPage } from "./pages/category";

const app = new Elysia()
  .use(openapi())
  .use(html())
  .use(staticPlugin({ maxAge: 0 }))
  .use(staticPlugin({ assets: "node_modules/htmx.org/dist", prefix: "/vendor/htmx", maxAge: 0 }))
  .use(categoryController)
  .use(transactionController)
  .use(categoryPage)
  .get("/", async () => {
    const [transactionsRes, categoriesRes] = await Promise.all([
      fetch("http://localhost:3067/transactions"),
      fetch("http://localhost:3067/categories"),
    ]);
    const { transactions } = (await transactionsRes.json()) as {
      transactions: {
        id: number;
        type: string;
        amount: string;
        transactionTime: string;
        note: string | null;
        categoryId: number | null;
        category: {
          id: number,
          name: string
          color: string
        } | null
        balance: number;
      }[];
    };
    const { categories } = (await categoriesRes.json()) as {
      categories: {
        id: number;
        name: string;
        color: string;
      }[];
    };

    const currency = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "THB",
    });
    const dateFormat = new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const dateOnlyFormat = new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    const timeOnlyFormat = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    return (
      <html lang="en" data-theme="light">
        <head>
          <title>Finance</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="/public/tailwind.css" />
          <script src="/vendor/htmx/htmx.min.js"></script>
        </head>
        <body class="min-h-screen bg-base-200 flex justify-center p-2 sm:p-10">
          <div class="w-full max-w-4xl">
            <div class="card bg-base-100 shadow-md">
              <div class="card-body p-0">
                <div class="flex items-baseline justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                  <h1 class="card-title text-lg sm:text-xl">Transactions</h1>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-base-content/60">{transactions.length} entries</span>
                    <button type="button" class="btn btn-primary btn-sm" onclick="add_transaction_modal.showModal()">
                      + Add Transaction
                    </button>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th class="hidden sm:table-cell">Date</th>
                        <th class="hidden sm:table-cell">Time</th>
                        <th class="text-right">Amount</th>
                        <th class="hidden md:table-cell">Category</th>
                        <th class="hidden sm:table-cell">Note</th>
                        <th class="text-right">Balance</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isInflow = tx.type === "INCOME" || tx.type === "TRANSFER_IN";

                        return (
                          <tr class="row-hover">
                            <td>
                              <span class={`badge badge-sm ${isInflow ? "badge-success" : "badge-error"}`}>
                                {tx.type}
                              </span>
                              <div class="mt-1 text-xs text-base-content/50 sm:hidden">
                                {dateFormat.format(new Date(tx.transactionTime))}
                              </div>
                            </td>
                            <td class="hidden sm:table-cell text-base-content/60">{dateOnlyFormat.format(new Date(tx.transactionTime))}</td>
                            <td class="hidden sm:table-cell text-base-content/60 tabular-nums">{timeOnlyFormat.format(new Date(tx.transactionTime))}</td>
                            <td class={`text-right font-semibold tabular-nums ${isInflow ? "text-success" : "text-error"}`}>
                              {isInflow ? "+" : "-"}
                              {currency.format(Number(tx.amount))}
                            </td>
                            <td class="hidden md:table-cell text-base-content/40">
                              <div class="flex flex-row gap-2">
                                <span
                                  class="inline-block w-4 h-4 rounded-full border border-base-content/20"
                                  style={`background-color: ${tx.category?.color}`}
                                />
                                {tx.category?.name ?? "—"} {tx.category?.id != null ? `(id: ${tx.category.id})` : "—"}
                              </div>
                            </td>
                            <td class="hidden sm:table-cell">{tx.note ?? <span class="text-base-content/40">—</span>}</td>
                            <td class="text-right tabular-nums">{currency.format(tx.balance)}</td>
                            <td class="text-right">
                              <button
                                type="button"
                                class="btn btn-ghost btn-xs text-error"
                                hx-delete={`/transactions/${tx.id}`}
                                hx-swap="none"
                                hx-confirm="Delete this transaction?"
                                {...{
                                  "hx-on::after-request": "if (event.detail.successful) location.reload();",
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <dialog id="add_transaction_modal" class="modal">
            <div class="modal-box">
              <h3 class="font-bold text-lg">Add Transaction</h3>
              <form
                id="add-transaction-form"
                class="mt-4 flex flex-col gap-4"
                hx-post="/transactions"
                hx-swap="none"
                {...{
                  "hx-on::config-request":
                    "if (!event.detail.parameters.categoryId) delete event.detail.parameters.categoryId; if (event.detail.parameters.transactionTime) event.detail.parameters.transactionTime = new Date(event.detail.parameters.transactionTime).toISOString();",
                  "hx-on::after-request":
                    "if (event.detail.successful) { add_transaction_modal.close(); location.reload(); } else { add_transaction_error.textContent = 'Failed to create transaction'; add_transaction_error.classList.remove('hidden'); }",
                }}
              >
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Type</legend>
                  <select name="type" required class="select w-full">
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="TRANSFER_OUT">Transfer out</option>
                    <option value="TRANSFER_IN">Transfer in</option>
                  </select>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Amount</legend>
                  <input type="number" name="amount" step="0.01" min="0" required class="input w-full" placeholder="0.00" />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Category</legend>
                  <label class="input w-full mb-2">
                    <input
                      type="search"
                      class="grow"
                      placeholder="Search"
                      oninput="Array.from(category_id_select.options).forEach((o) => { o.hidden = o.value !== '' && !o.textContent.toLowerCase().includes(this.value.toLowerCase()); });"
                    />
                  </label>
                  <select id="category_id_select" name="categoryId" class="select w-full">
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option value={String(category.id)}>{category.name}</option>
                    ))}
                  </select>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Date & time</legend>
                  <input type="datetime-local" name="transactionTime" required class="input w-full" value={nowLocal} />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Note</legend>
                  <input type="text" name="note" class="input w-full" placeholder="Optional" />
                </fieldset>
                <p id="add_transaction_error" class="text-error text-sm hidden"></p>
                <div class="modal-action">
                  <button type="button" class="btn" onclick="add_transaction_modal.close()">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
            <form method="dialog" class="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </body>
      </html>
    );
  })
  .listen(3067);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
