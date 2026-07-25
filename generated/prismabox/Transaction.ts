import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TransactionPlain = t.Object(
  {
    id: t.Integer(),
    type: t.Union(
      [
        t.Literal("TRANSFER_IN"),
        t.Literal("TRANSFER_OUT"),
        t.Literal("INCOME"),
        t.Literal("EXPENSE"),
      ],
      { additionalProperties: false },
    ),
    amount: t.Number(),
    creationTime: t.Date(),
    transactionTime: t.Date(),
    note: __nullable__(t.String()),
    categoryId: __nullable__(t.Integer()),
  },
  { additionalProperties: false },
);

export const TransactionRelations = t.Object(
  {
    category: __nullable__(
      t.Object(
        { id: t.Integer(), name: t.String(), color: t.String() },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const TransactionPlainInputCreate = t.Object(
  {
    type: t.Union(
      [
        t.Literal("TRANSFER_IN"),
        t.Literal("TRANSFER_OUT"),
        t.Literal("INCOME"),
        t.Literal("EXPENSE"),
      ],
      { additionalProperties: false },
    ),
    amount: t.Number(),
    creationTime: t.Optional(t.Date()),
    transactionTime: t.Date(),
    note: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const TransactionPlainInputUpdate = t.Object(
  {
    type: t.Optional(
      t.Union(
        [
          t.Literal("TRANSFER_IN"),
          t.Literal("TRANSFER_OUT"),
          t.Literal("INCOME"),
          t.Literal("EXPENSE"),
        ],
        { additionalProperties: false },
      ),
    ),
    amount: t.Optional(t.Number()),
    creationTime: t.Optional(t.Date()),
    transactionTime: t.Optional(t.Date()),
    note: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const TransactionRelationsInputCreate = t.Object(
  {
    category: t.Optional(
      t.Object(
        {
          connect: t.Object(
            {
              id: t.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const TransactionRelationsInputUpdate = t.Partial(
  t.Object(
    {
      category: t.Partial(
        t.Object(
          {
            connect: t.Object(
              {
                id: t.Integer({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            disconnect: t.Boolean(),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const TransactionWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          type: t.Union(
            [
              t.Literal("TRANSFER_IN"),
              t.Literal("TRANSFER_OUT"),
              t.Literal("INCOME"),
              t.Literal("EXPENSE"),
            ],
            { additionalProperties: false },
          ),
          amount: t.Number(),
          creationTime: t.Date(),
          transactionTime: t.Date(),
          note: t.String(),
          categoryId: t.Integer(),
        },
        { additionalProperties: false },
      ),
    { $id: "Transaction" },
  ),
);

export const TransactionWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object({ id: t.Integer() }, { additionalProperties: false }),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.Integer() })], {
          additionalProperties: false,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              type: t.Union(
                [
                  t.Literal("TRANSFER_IN"),
                  t.Literal("TRANSFER_OUT"),
                  t.Literal("INCOME"),
                  t.Literal("EXPENSE"),
                ],
                { additionalProperties: false },
              ),
              amount: t.Number(),
              creationTime: t.Date(),
              transactionTime: t.Date(),
              note: t.String(),
              categoryId: t.Integer(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Transaction" },
);

export const TransactionSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      type: t.Boolean(),
      amount: t.Boolean(),
      creationTime: t.Boolean(),
      transactionTime: t.Boolean(),
      category: t.Boolean(),
      note: t.Boolean(),
      categoryId: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TransactionInclude = t.Partial(
  t.Object(
    { type: t.Boolean(), category: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const TransactionOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      amount: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      creationTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      transactionTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      note: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      categoryId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Transaction = t.Composite(
  [TransactionPlain, TransactionRelations],
  { additionalProperties: false },
);

export const TransactionInputCreate = t.Composite(
  [TransactionPlainInputCreate, TransactionRelationsInputCreate],
  { additionalProperties: false },
);

export const TransactionInputUpdate = t.Composite(
  [TransactionPlainInputUpdate, TransactionRelationsInputUpdate],
  { additionalProperties: false },
);
