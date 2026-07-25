import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const CategoryPlain = t.Object(
  { id: t.Integer(), name: t.String(), color: t.String() },
  { additionalProperties: false },
);

export const CategoryRelations = t.Object(
  {
    transactions: t.Array(
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
          note: __nullable__(t.String()),
          categoryId: __nullable__(t.Integer()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const CategoryPlainInputCreate = t.Object(
  { name: t.String(), color: t.String() },
  { additionalProperties: false },
);

export const CategoryPlainInputUpdate = t.Object(
  { name: t.Optional(t.String()), color: t.Optional(t.String()) },
  { additionalProperties: false },
);

export const CategoryRelationsInputCreate = t.Object(
  {
    transactions: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.Integer({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const CategoryRelationsInputUpdate = t.Partial(
  t.Object(
    {
      transactions: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const CategoryWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          name: t.String(),
          color: t.String(),
        },
        { additionalProperties: false },
      ),
    { $id: "Category" },
  ),
);

export const CategoryWhereUnique = t.Recursive(
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
            { id: t.Integer(), name: t.String(), color: t.String() },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Category" },
);

export const CategorySelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      color: t.Boolean(),
      transactions: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const CategoryInclude = t.Partial(
  t.Object(
    { transactions: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const CategoryOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      color: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Category = t.Composite([CategoryPlain, CategoryRelations], {
  additionalProperties: false,
});

export const CategoryInputCreate = t.Composite(
  [CategoryPlainInputCreate, CategoryRelationsInputCreate],
  { additionalProperties: false },
);

export const CategoryInputUpdate = t.Composite(
  [CategoryPlainInputUpdate, CategoryRelationsInputUpdate],
  { additionalProperties: false },
);
