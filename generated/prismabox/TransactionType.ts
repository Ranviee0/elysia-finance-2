import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TransactionType = t.Union(
  [
    t.Literal("TRANSFER_IN"),
    t.Literal("TRANSFER_OUT"),
    t.Literal("INCOME"),
    t.Literal("EXPENSE"),
  ],
  { additionalProperties: false },
);
