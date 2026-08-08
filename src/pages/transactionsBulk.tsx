import { Elysia } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { auth } from "@/auth";
import { apiBase } from "@/config";
import { forwardCookie } from "@/internalFetch";
import type { CategoryView } from "@/components/types";
import { toLocalInput } from "@/pages/transactions";

const fetchCategories = async (request: Request) => {
  const res = await fetch(`${apiBase}/categories`, { headers: forwardCookie(request) });
  const { categories } = (await res.json()) as { categories: CategoryView[] };
  return categories;
};

/* How many blank rows to open the page with — enough to paste a short
   statement's worth of entries without reaching for "+ Add row" first. */
const INITIAL_ROWS = 6;

const BulkRow = ({ categories, time }: { categories: CategoryView[]; time: string }) => (
  <tr>
    <td>
      <select data-field="type" class="select select-sm w-full">
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
        <option value="TRANSFER_OUT">Transfer out</option>
        <option value="TRANSFER_IN">Transfer in</option>
      </select>
    </td>
    <td>
      <input data-field="amount" type="number" step="0.01" min="0" class="input input-sm w-28" placeholder="0.00" />
    </td>
    <td>
      <select data-field="categoryId" class="select select-sm w-full">
        <option value="">No category</option>
        {categories.map((category) => (
          <option value={String(category.id)}>{category.name}</option>
        ))}
      </select>
    </td>
    <td>
      <input data-field="transactionTime" type="datetime-local" class="input input-sm w-full" value={time} />
    </td>
    <td>
      <input data-field="note" type="text" class="input input-sm w-full" placeholder="Optional" />
    </td>
    <td class="text-right">
      <button type="button" class="btn btn-ghost btn-xs text-error" onclick="removeBulkRow(this)" aria-label="Remove row">
        ✕
      </button>
    </td>
  </tr>
);

export const transactionsBulkPage = new Elysia()
  .use(html())
  .use(auth)
  .get("/transactions/bulk", async ({ request, user }) => {
    const categories = await fetchCategories(request);

    const start = new Date();
    const rows = Array.from({ length: INITIAL_ROWS }, (_, i) => {
      const time = new Date(start);
      /* Spaced a minute apart so a first-pass save doesn't immediately trip
         the server's one-minute-apart clash check across rows. */
      time.setMinutes(time.getMinutes() + i);
      return toLocalInput(time);
    });

    return (
      <Layout title="Bulk Add Transactions" currentPath="/transactions/bulk" user={user} wide>
        <div class="card bg-base-100 shadow-md">
          <div class="card-body p-0">
            <div class="flex items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
              <div class="flex items-center gap-2">
                <a href="/" class="btn btn-ghost btn-sm btn-circle" aria-label="Back to transactions">
                  ←
                </a>
                <h1 class="card-title text-lg sm:text-xl">Bulk Add Transactions</h1>
              </div>
              <div class="flex items-center gap-3">
                <span id="bulk-loading" class="htmx-indicator loading loading-spinner loading-sm"></span>
                <button type="button" class="btn btn-sm" onclick="addBulkRow()">
                  + Add row
                </button>
                <button type="button" id="bulk-save-btn" class="btn btn-primary btn-sm" onclick="submitBulkTransactions()">
                  Save all
                </button>
              </div>
            </div>
            <p id="bulk_error" class="text-error text-sm px-4 sm:px-6 pb-4 hidden"></p>
            <div class="overflow-x-auto px-4 sm:px-6 pb-6">
              <table id="bulk-table" class="table table-sm">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Date & time</th>
                    <th>Note</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((time) => (
                    <BulkRow categories={categories} time={time} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    );
  }, { requirePage: true });
