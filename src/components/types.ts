export type CategoryView = {
  id: number;
  name: string;
  color: string;
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
