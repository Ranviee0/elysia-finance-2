/* Inline handlers shared by the table and list variants of each page.
   On success the whole content card is re-fetched so entry counts and
   running balances stay correct without a full page reload. */

export const refreshTransactions =
  "htmx.ajax('GET', '/fragments/transactions', { target: '#transactions-content', swap: 'outerHTML' })";

export const refreshCategories =
  "htmx.ajax('GET', '/fragments/categories', { target: '#categories-content', swap: 'outerHTML' })";
