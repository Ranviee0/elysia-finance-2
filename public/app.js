/* Intercept hx-confirm and use the in-app daisyUI dialog instead of
   window.confirm — the native popup is unreliable in embedded browsers
   (VS Code's Simple Browser cancels it silently) and Chrome can suppress
   repeated dialogs, which makes htmx drop the request without feedback. */
document.addEventListener("htmx:confirm", (event) => {
  if (!event.detail.question) return;
  event.preventDefault();

  const dialog = document.getElementById("confirm_dialog");
  const message = document.getElementById("confirm_dialog_message");
  const ok = document.getElementById("confirm_dialog_ok");
  if (!dialog || !message || !ok) {
    if (window.confirm(event.detail.question)) event.detail.issueRequest(true);
    return;
  }

  message.textContent = event.detail.question;
  ok.onclick = () => {
    dialog.close();
    event.detail.issueRequest(true);
  };
  dialog.showModal();
});

/* Editing a transaction one field at a time. The API has a PATCH route per
   field, so each cell opens the dialog for its own field and saving sends a
   single request carrying a single value. Written by hand rather than with
   htmx because the routes take JSON: an amount has to arrive as a number and a
   cleared category as null, neither of which survives form encoding. */
const editing = { id: null, field: null };

/* Which control and which route belong to each field. `body` turns the input's
   string into what the route's schema expects. */
const FIELDS = {
  type: { label: "Type", input: "type", body: (value) => ({ type: value }) },
  amount: { label: "Amount", input: "amount", body: (value) => ({ amount: Number(value) }) },
  category: {
    label: "Category",
    input: "category",
    /* Empty means "no category", which the route clears on null — an empty
       string would be read as a missing field and change nothing. */
    body: (value) => ({ categoryId: value === "" ? null : Number(value) }),
  },
  time: {
    label: "Date & time",
    input: "time",
    /* datetime-local has no seconds and no zone; the route wants a timestamp,
       and the browser is the only place that knows the offset. */
    body: (value) => ({ transactionTime: new Date(value).toISOString() }),
  },
  note: { label: "Note", input: "note", body: (value) => ({ note: value }) },
};

const pad = (n) => String(n).padStart(2, "0");

const toLocalInputValue = (iso) => {
  const date = new Date(iso);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

const openField = (id, field, value) => {
  const form = document.getElementById("edit-field-form");
  const spec = FIELDS[field];
  if (!form || !spec) return;

  editing.id = id;
  editing.field = field;

  /* Only the field being edited is on screen; the rest stay in the DOM so the
     category list doesn't have to be rebuilt on every open. */
  form.querySelectorAll("fieldset[data-field]").forEach((set) => {
    set.classList.toggle("hidden", set.dataset.field !== field);
  });

  const input = form.elements[spec.input];
  input.value = field === "time" ? toLocalInputValue(value) : value;

  /* A category deleted since the page was loaded has no option to select,
     which would leave the box showing something other than the value it would
     send. Falling back to "No category" at least matches what is displayed. */
  if (field === "category" && input.value !== value) input.value = "";

  document.getElementById("edit_field_label").textContent = spec.label.toLowerCase();
  document.getElementById("edit_field_context").textContent = `Transaction #${id}`;

  const error = document.getElementById("edit_field_error");
  error.classList.add("hidden");
  error.textContent = "";

  document.getElementById("edit_field_modal").showModal();
  input.focus();
};

/* Wide screens: the cell that was clicked is the field being edited. */
window.openTransactionField = (cell) => {
  openField(cell.dataset.txId, cell.dataset.field, cell.dataset.value);
};

/* Phones: one target per row opens the chooser, and the field is picked from
   a list showing what each one currently holds. */
window.openTransactionMenu = (button) => {
  const menu = document.getElementById("edit_menu_modal");
  if (!menu) return;

  const id = button.dataset.txId;
  document.getElementById("edit_menu_context").textContent = `Transaction #${id}`;

  menu.querySelectorAll("#edit_menu_list button[data-field]").forEach((item) => {
    const field = item.dataset.field;
    item.querySelector(`[data-show="${field}"]`).textContent = button.dataset[`show${
      field.charAt(0).toUpperCase() + field.slice(1)
    }`];

    item.onclick = () => {
      /* Closed first so the two dialogs never stack: <dialog> keeps its own
         backdrop, and the second would open behind the first. */
      menu.close();
      openField(id, field, button.dataset[`value${field.charAt(0).toUpperCase() + field.slice(1)}`]);
    };
  });

  menu.showModal();
};

/* Delegated from the document rather than bound to the form: a boosted
   navigation swaps the body out, and a listener held on the old form element
   would go with it — the next save would then fall through to a plain submit. */
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (form.id !== "edit-field-form") return;

  event.preventDefault();

  const spec = FIELDS[editing.field];
  if (!spec) return;

  const error = document.getElementById("edit_field_error");
  const indicator = document.getElementById("transactions-loading");
  if (indicator) indicator.classList.add("htmx-request");

  const res = await fetch(`/transactions/${editing.field}/${editing.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(spec.body(form.elements[spec.input].value)),
  });

  if (indicator) indicator.classList.remove("htmx-request");

  if (!res.ok) {
    /* Handler routes reply with a plain string, Elysia's own validation with
       JSON — the same two shapes the htmx handlers unwrap. */
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.summary || parsed.message || text;
    } catch (e) { /* plain string */ }

    error.textContent = message || "Failed to save.";
    error.classList.remove("hidden");
    return;
  }

  document.getElementById("edit_field_modal").close();
  /* The running balance and the row order both depend on what just changed,
     so the list is re-fetched rather than patched in place. */
  if (window.refreshTransactions) window.refreshTransactions();
});
