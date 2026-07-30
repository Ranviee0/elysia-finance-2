import type { TransactionView } from "./types";
import { currency, dateOnlyFormat, timeOnlyFormat } from "./format";

/* The five fields the API can update on their own — one PATCH route each, and
   one editor each in the UI. Date and time are a single field here because
   they are a single column on the server. */
export type EditableFieldName = "type" | "amount" | "category" | "time" | "note";

export const FIELD_LABELS: Record<EditableFieldName, string> = {
  type: "Type",
  amount: "Amount",
  category: "Category",
  time: "Date & time",
  note: "Note",
};

/* What the editor loads: the raw value in the form the input and the route
   expect, rather than the formatted version on screen. */
export const fieldValue = (transaction: TransactionView, field: EditableFieldName) => {
  switch (field) {
    case "type":
      return transaction.type;
    case "amount":
      return String(transaction.amount);
    case "category":
      return transaction.categoryId === null ? "" : String(transaction.categoryId);
    case "time":
      return transaction.transactionTime;
    case "note":
      return transaction.note ?? "";
  }
};

/* What the chooser shows next to each field name, so picking one doesn't mean
   remembering what the row said. */
export const fieldDisplay = (transaction: TransactionView, field: EditableFieldName) => {
  switch (field) {
    case "type":
      return transaction.type;
    case "amount":
      return currency.format(Number(transaction.amount));
    case "category":
      return transaction.category ? transaction.category.name : "No category";
    case "time": {
      const when = new Date(transaction.transactionTime);
      return `${dateOnlyFormat.format(when)} · ${timeOnlyFormat.format(when)}`;
    }
    case "note":
      return transaction.note ?? "—";
  }
};
