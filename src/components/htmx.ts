/* Inline handlers shared by the table and list variants of each page.
   On success the whole content card is re-fetched so entry counts and
   running balances stay correct without a full page reload. */

/* Carries the date filters along so a create/edit/delete doesn't silently
   reset the view back to the default range. */
export const refreshTransactions =
  "htmx.ajax('GET', '/fragments/transactions?' + new URLSearchParams(new FormData(document.getElementById('transaction-filter-form'))), { target: '#transactions-content', swap: 'outerHTML' })";

export const refreshCategories =
  "htmx.ajax('GET', '/fragments/categories', { target: '#categories-content', swap: 'outerHTML' })";

/* Reads the server's message out of a failed request. Handler routes reply
   with a plain string, while Elysia's own validation errors come back as
   JSON, so both shapes are unwrapped before falling back. */
export const errorMessage = (fallback: string) => {
  /* Single-quoted: the result is inlined into a double-quoted attribute. */
  const quoted = `'${fallback.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

  return (
    `(function () {` +
    `const body = event.detail.xhr.responseText;` +
    `if (!body) return ${quoted};` +
    `try { const parsed = JSON.parse(body); return parsed.summary || parsed.message || ${quoted}; }` +
    `catch (e) { return body; }` +
    `})()`
  );
};
