export type CategoryView = {
  id: number;
  name: string;
  color: string;
};

/* `color` is null when the transactions in this slice had no category, which
   is what tells the chart to fall back to gray. */
export type SummarySlice = {
  categoryId: number | null;
  name: string;
  color: string | null;
  total: number;
};

export type SummaryView = {
  income: SummarySlice[];
  expense: SummarySlice[];
};

export type TransactionView = {
  id: number;
  type: string;
  amount: string;
  transactionTime: string;
  note: string | null;
  categoryId: number | null;
  category: CategoryView | null;
  balance: number;
};
