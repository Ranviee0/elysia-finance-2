import { Elysia } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { TransactionTable } from "@/components/TransactionTable";
import { TransactionList } from "@/components/TransactionList";
import { refreshTransactions } from "@/components/htmx";
import type { CategoryView, TransactionView } from "@/components/types";

const fetchTransactions = async () => {
  const res = await fetch("http://localhost:3067/transactions");
  const { transactions } = (await res.json()) as { transactions: TransactionView[] };
  return transactions;
};

const fetchCategories = async () => {
  const res = await fetch("http://localhost:3067/categories");
  const { categories } = (await res.json()) as { categories: CategoryView[] };
  return categories;
};

const TransactionsContent = ({ transactions }: { transactions: TransactionView[] }) => (
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
      <TransactionTable transactions={transactions} />
      <TransactionList transactions={transactions} />
    </div>
  </div>
);

export const transactionsPage = new Elysia()
  .use(html())
  .get("/fragments/transactions", async () => {
    const transactions = await fetchTransactions();
    return <TransactionsContent transactions={transactions} />;
  })
  .get("/", async () => {
    const [transactions, categories] = await Promise.all([
      fetchTransactions(),
      fetchCategories(),
    ]);

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    return (
      <Layout title="Finance" currentPath="/">
        <TransactionsContent transactions={transactions} />

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
                "hx-on::after-request": `if (event.detail.successful) { add_transaction_modal.close(); this.reset(); add_transaction_error.classList.add('hidden'); ${refreshTransactions}; } else { add_transaction_error.textContent = 'Failed to create transaction'; add_transaction_error.classList.remove('hidden'); }`,
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
      </Layout>
    );
  });
