export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
});

export const dateOnlyFormat = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

export const timeOnlyFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const isInflow = (type: string) =>
  type === "INCOME" || type === "TRANSFER_IN";
