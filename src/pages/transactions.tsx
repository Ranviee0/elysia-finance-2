import { Elysia, t } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { TransactionTable } from "@/components/TransactionTable";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFilters } from "@/components/TransactionFilters";
import { errorMessage, refreshTransactions } from "@/components/htmx";
import { apiBase } from "@/config";
import { auth } from "@/auth";
import { forwardCookie } from "@/internalFetch";
import type { CategoryView, TransactionView } from "@/components/types";
import { FIELD_LABELS } from "@/components/transactionFields";

const pad = (n: number) => String(n).padStart(2, "0");

/* Value format expected by <input type="datetime-local">, in local time.
   The API parses it as local time too, so no timezone juggling is needed. */
const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return toLocalInput(date);
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 0, 0);
  return toLocalInput(date);
};

/* An absent param means "first visit" and gets today's range; an empty
   one means the user cleared that bound on purpose, so it stays empty. */
const resolveRange = (query: { from?: string; until?: string }) => ({
  from: query.from ?? startOfToday(),
  until: query.until ?? endOfToday(),
});

const filterQuery = t.Object({
  from: t.Optional(t.String()),
  until: t.Optional(t.String()),
});

/* datetime-local omits seconds, which t.Date() won't accept, so widen it
   to a full ISO timestamp. Invalid input is dropped rather than 422'd. */
const toApiDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const fetchTransactions = async (
  { from, until }: { from: string; until: string },
  request: Request,
) => {
  const params = new URLSearchParams();
  const fromIso = from && toApiDate(from);
  const untilIso = until && toApiDate(until);
  if (fromIso) params.set("from", fromIso);
  if (untilIso) params.set("until", untilIso);

  const res = await fetch(`${apiBase}/transactions?${params}`, { headers: forwardCookie(request) });
  const { transactions } = (await res.json()) as { transactions: TransactionView[] };
  return transactions;
};

const fetchCategories = async (request: Request) => {
  const res = await fetch(`${apiBase}/categories`, { headers: forwardCookie(request) });
  const { categories } = (await res.json()) as { categories: CategoryView[] };
  return categories;
};

const TransactionsContent = ({
  transactions,
  from,
  until,
}: {
  transactions: TransactionView[];
  from: string;
  until: string;
}) => (
  <div id="transactions-content" class="card bg-base-100 shadow-md">
    <div class="card-body p-0">
      <div class="flex items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <h1 class="card-title text-lg sm:text-xl">Transactions</h1>
        <div class="flex items-center gap-3">
          <span id="transactions-loading" class="htmx-indicator loading loading-spinner loading-sm"></span>
          <span class="text-sm text-base-content/60">{transactions.length} entries</span>
          <button type="button" class="btn btn-primary sm:btn-sm" onclick="add_transaction_modal.showModal()">
            + Add<span class="hidden sm:inline"> Transaction</span>
          </button>
        </div>
      </div>
      <TransactionFilters from={from} until={until} />
      <TransactionTable transactions={transactions} />
      <TransactionList transactions={transactions} />
    </div>
  </div>
);

export const transactionsPage = new Elysia()
  .use(html())
  .use(auth)
  .get(
    "/fragments/transactions",
    async ({ query, request, set }) => {
      /* Every refresh asks for the same URL, and the response carries no
         freshness headers of its own — which browsers are free to read as
         "cache it". A second edit would then redraw the list from the copy
         taken after the first one and look like it did nothing. */
      set.headers["cache-control"] = "no-store";

      const range = resolveRange(query);
      const transactions = await fetchTransactions(range, request);
      return <TransactionsContent transactions={transactions} {...range} />;
    },
    { query: filterQuery, requirePage: true },
  )
  .get("/", async ({ query, request, user }) => {
    const range = resolveRange(query);
    const [transactions, categories] = await Promise.all([
      fetchTransactions(range, request),
      fetchCategories(request),
    ]);

    const nowLocal = toLocalInput(new Date());

    return (
      <Layout title="Finance" currentPath="/" user={user}>
        <TransactionsContent transactions={transactions} {...range} />

        <dialog id="add_transaction_modal" class="modal modal-bottom sm:modal-middle">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Add Transaction</h3>
            <form
              id="add-transaction-form"
              class="mt-4 flex flex-col gap-4"
              hx-post="/transactions"
              hx-swap="none"
              hx-indicator="#transactions-loading"
              {...{
                "hx-on::config-request":
                  "if (!event.detail.parameters.categoryId) delete event.detail.parameters.categoryId; if (event.detail.parameters.transactionTime) event.detail.parameters.transactionTime = new Date(event.detail.parameters.transactionTime).toISOString();",
                "hx-on::after-request": `if (event.detail.successful) { add_transaction_modal.close(); this.reset(); add_transaction_error.classList.add('hidden'); ${refreshTransactions}; } else { add_transaction_error.textContent = ${errorMessage("Failed to create transaction")}; add_transaction_error.classList.remove('hidden'); }`,
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
          <form method="dialog" class="modal-backdrop" hx-boost="false">
            <button>close</button>
          </form>
        </dialog>

        {/* The phone-sized way in: one big target per row opens this, and the
            field is picked from a list instead of by hitting a cell. Filled in
            by app.js from the row that opened it. */}
        <dialog id="edit_menu_modal" class="modal modal-bottom sm:modal-middle">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Edit transaction</h3>
            <p id="edit_menu_context" class="text-sm text-base-content/60"></p>
            {/* Roomy rows: this is the thumb-sized way into editing, so the
                targets are sized for a thumb rather than packed like a list. */}
            <ul id="edit_menu_list" class="menu menu-lg w-full px-0 gap-2">
              {(["type", "amount", "category", "time", "note"] as const).map((field) => (
                <li>
                  <button
                    type="button"
                    data-field={field}
                    class="flex flex-col items-start gap-1 py-4 rounded-box border border-base-content/10"
                  >
                    <span class="text-xs uppercase tracking-wide text-base-content/50">
                      {FIELD_LABELS[field]}
                    </span>
                    <span data-show={field} class="font-medium truncate w-full"></span>
                  </button>
                </li>
              ))}
            </ul>
            <div class="modal-action">
              <button type="button" class="btn" onclick="edit_menu_modal.close()">
                Cancel
              </button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop" hx-boost="false">
            <button>close</button>
          </form>
        </dialog>

        {/* One field at a time, because that is exactly what the server
            offers: a PATCH route each for type, amount, category, time and
            note. Every control lives here and app.js shows the one the clicked
            cell asked for, so a save is a single request that touches a single
            column — nothing else on the row is rewritten. */}
        <dialog id="edit_field_modal" class="modal modal-bottom sm:modal-middle">
          <div class="modal-box">
            <h3 class="font-bold text-lg">
              Edit <span id="edit_field_label"></span>
            </h3>
            <p id="edit_field_context" class="text-sm text-base-content/60"></p>
            {/* hx-boost is on at the body level and would turn this submit
                into a navigation, sending the field as a query string and
                throwing the page away before the PATCH is ever made. */}
            <form id="edit-field-form" class="mt-4 flex flex-col gap-4" hx-boost="false">
              <fieldset class="fieldset hidden" data-field="type">
                <select name="type" class="select w-full">
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER_OUT">Transfer out</option>
                  <option value="TRANSFER_IN">Transfer in</option>
                </select>
              </fieldset>
              <fieldset class="fieldset hidden" data-field="amount">
                <input type="number" name="amount" step="0.01" min="0" class="input w-full" />
              </fieldset>
              <fieldset class="fieldset hidden" data-field="category">
                <label class="input w-full mb-2">
                  <input
                    type="search"
                    class="grow"
                    placeholder="Search"
                    oninput="Array.from(edit_category_select.options).forEach((o) => { o.hidden = o.value !== '' && !o.textContent.toLowerCase().includes(this.value.toLowerCase()); });"
                  />
                </label>
                <select id="edit_category_select" name="category" class="select w-full">
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option value={String(category.id)}>{category.name}</option>
                  ))}
                </select>
              </fieldset>
              <fieldset class="fieldset hidden" data-field="time">
                <input type="datetime-local" name="time" class="input w-full" />
              </fieldset>
              <fieldset class="fieldset hidden" data-field="note">
                <input type="text" name="note" class="input w-full" placeholder="Optional" />
              </fieldset>
              <p id="edit_field_error" class="text-error text-sm hidden"></p>
              <div class="modal-action">
                <button type="button" class="btn" onclick="edit_field_modal.close()">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" class="modal-backdrop" hx-boost="false">
            <button>close</button>
          </form>
        </dialog>

        {/* The refresh is defined once in htmx.ts and inlined into attributes
            everywhere else; app.js needs the same one call. */}
        <script>{`window.refreshTransactions = function () { ${refreshTransactions} };`}</script>
      </Layout>
    );
  }, { requirePage: true });
