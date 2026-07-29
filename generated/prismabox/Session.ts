import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const SessionPlain = t.Object(
  {
    id: t.String(),
    userId: t.Integer(),
    createdAt: t.Date(),
    expiresAt: t.Date(),
  },
  {
    additionalProperties: false,
    description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
  },
);

export const SessionRelations = t.Object(
  {
    user: t.Object(
      {
        id: t.Integer(),
        username: t.String(),
        passwordHash: t.String(),
        createdAt: t.Date(),
      },
      { additionalProperties: false },
    ),
  },
  {
    additionalProperties: false,
    description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
  },
);

export const SessionPlainInputCreate = t.Object(
  { expiresAt: t.Date() },
  {
    additionalProperties: false,
    description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
  },
);

export const SessionPlainInputUpdate = t.Object(
  { expiresAt: t.Optional(t.Date()) },
  {
    additionalProperties: false,
    description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
  },
);

export const SessionRelationsInputCreate = t.Object(
  {
    user: t.Object(
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
  },
  {
    additionalProperties: false,
    description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
  },
);

export const SessionRelationsInputUpdate = t.Partial(
  t.Object(
    {
      user: t.Object(
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
    },
    {
      additionalProperties: false,
      description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
    },
  ),
);

export const SessionWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          userId: t.Integer(),
          createdAt: t.Date(),
          expiresAt: t.Date(),
        },
        {
          additionalProperties: false,
          description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
        },
      ),
    { $id: "Session" },
  ),
);

export const SessionWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String() },
            {
              additionalProperties: false,
              description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
            },
          ),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.String() })], {
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
              id: t.String(),
              userId: t.Integer(),
              createdAt: t.Date(),
              expiresAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Session" },
);

export const SessionSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      user: t.Boolean(),
      userId: t.Boolean(),
      createdAt: t.Boolean(),
      expiresAt: t.Boolean(),
      _count: t.Boolean(),
    },
    {
      additionalProperties: false,
      description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
    },
  ),
);

export const SessionInclude = t.Partial(
  t.Object(
    { user: t.Boolean(), _count: t.Boolean() },
    {
      additionalProperties: false,
      description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
    },
  ),
);

export const SessionOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      expiresAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    {
      additionalProperties: false,
      description: `Sessions live in the database rather than in a signed cookie so that a
logout or a password change can actually revoke them.`,
    },
  ),
);

export const Session = t.Composite([SessionPlain, SessionRelations], {
  additionalProperties: false,
});

export const SessionInputCreate = t.Composite(
  [SessionPlainInputCreate, SessionRelationsInputCreate],
  { additionalProperties: false },
);

export const SessionInputUpdate = t.Composite(
  [SessionPlainInputUpdate, SessionRelationsInputUpdate],
  { additionalProperties: false },
);
