import { Html } from "@elysia/html";

/* Re-fetches the whole content card so the entry count and the filter
   inputs themselves stay in sync with what is being shown. */
const applyFilters = "htmx.trigger(this.form, 'change')";

const setToday =
  "const p = (n) => String(n).padStart(2, '0');" +
  "const d = new Date();" +
  "const day = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());" +
  "this.form.from.value = day + 'T00:00';" +
  "this.form.until.value = day + 'T23:59';" +
  applyFilters;

const clearFilters =
  "this.form.from.value = '';" + "this.form.until.value = '';" + applyFilters;

export const TransactionFilters = ({ from, until }: { from: string; until: string }) => (
  <form
    id="transaction-filter-form"
    class="flex flex-wrap items-end gap-2 px-4 sm:px-6 pb-4"
    hx-get="/fragments/transactions"
    hx-target="#transactions-content"
    hx-swap="outerHTML"
    hx-trigger="change, submit"
    hx-indicator="#transactions-loading"
  >
    <fieldset class="fieldset grow basis-45">
      <legend class="fieldset-legend">From</legend>
      <input type="datetime-local" name="from" value={from} class="input input-sm w-full" />
    </fieldset>
    <fieldset class="fieldset grow basis-45">
      <legend class="fieldset-legend">Until</legend>
      <input type="datetime-local" name="until" value={until} class="input input-sm w-full" />
    </fieldset>
    <div class="join">
      <button type="button" class="btn btn-sm join-item" onclick={setToday}>
        Today
      </button>
      <button type="button" class="btn btn-sm join-item" onclick={clearFilters}>
        All time
      </button>
    </div>
  </form>
);
