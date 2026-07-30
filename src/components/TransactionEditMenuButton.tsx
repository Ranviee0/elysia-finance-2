import { Html } from "@elysia/html";
import type { TransactionView } from "./types";
import { FIELD_LABELS, fieldDisplay, fieldValue, type EditableFieldName } from "./transactionFields";

const FIELDS = Object.keys(FIELD_LABELS) as EditableFieldName[];

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.8"
    stroke="currentColor"
    class="w-5 h-5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
    />
  </svg>
);

/* Opens a chooser listing the row's five editable fields, each with its
   current value; picking one hands off to the same single-field dialog the
   table cells use. The whole row travels on the button — both the raw values
   the editor loads and the formatted ones the chooser shows — so neither step
   needs a request of its own. */
export const TransactionEditMenuButton = ({ transaction }: { transaction: TransactionView }) => {
  const values = Object.fromEntries(
    FIELDS.flatMap((field) => [
      [`data-value-${field}`, fieldValue(transaction, field)],
      [`data-show-${field}`, fieldDisplay(transaction, field)],
    ]),
  );

  return (
    <button
      type="button"
      class="btn btn-ghost btn-square"
      aria-label="Edit transaction"
      data-tx-id={String(transaction.id)}
      onclick="openTransactionMenu(this)"
      {...values}
    >
      <EditIcon />
    </button>
  );
};
