import { Html } from "@elysia/html";
import type { TransactionView } from "./types";
import { FIELD_LABELS, fieldValue, type EditableFieldName } from "./transactionFields";

/* The API updates one field per route, so the UI edits one field per action:
   on a wide screen a cell is its own edit affordance, and saving it PATCHes
   exactly that route. Nothing else on the row is sent, so two edits to
   different fields can't overwrite each other.

   The current value rides along on the element, which is enough for the dialog
   to open filled in without another request. Phones get the chooser in
   TransactionEditMenuButton instead — these targets are too small to aim at. */
export const EditableField = ({
  transaction,
  field,
  class: className = "",
  children,
}: {
  transaction: TransactionView;
  field: EditableFieldName;
  class?: string;
  children?: any;
}) => (
  <button
    type="button"
    /* A dotted underline on hover rather than a button look: five buttons per
       row would drown the numbers they sit next to. */
    class={`cursor-pointer rounded-sm text-left hover:underline hover:decoration-dotted hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${className}`}
    title={`Edit ${FIELD_LABELS[field].toLowerCase()}`}
    aria-label={`Edit ${FIELD_LABELS[field].toLowerCase()}`}
    data-tx-id={String(transaction.id)}
    data-field={field}
    data-value={fieldValue(transaction, field)}
    onclick="openTransactionField(this)"
  >
    {children}
  </button>
);
