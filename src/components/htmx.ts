/* Inline handlers shared by the table and list variants of each page.
   On success the whole content card is re-fetched so entry counts and
   running balances stay correct without a full page reload. */

/* Carries the date filters along so a create/edit/delete doesn't silently
   reset the view back to the default range. */
export const refreshTransactions =
  "htmx.ajax('GET', '/fragments/transactions?' + new URLSearchParams(new FormData(document.getElementById('transaction-filter-form'))), { target: '#transactions-content', swap: 'outerHTML' })";

export const refreshCategories =
  "htmx.ajax('GET', '/fragments/categories', { target: '#categories-content', swap: 'outerHTML' })";
