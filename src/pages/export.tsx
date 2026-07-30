import { Elysia, t } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { auth } from "@/auth";
import { importCsv, type ImportResult } from "@/importCsv";
import { convertLegacyCsv } from "@/legacyCsv";
import { CsvParseError } from "@/csv";

const DownloadIcon = () => (
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
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

/* hx-boost is on at the body level and would swap the CSV into the page,
   so every download link opts out of it. */
const ExportRow = ({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) => (
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-box border border-base-content/10 p-4">
    <div class="min-w-0">
      <div class="font-medium">{title}</div>
      <div class="text-sm text-base-content/60">{description}</div>
    </div>
    <a href={href} download="" class="btn btn-primary btn-sm" hx-boost="false">
      <DownloadIcon />
      Download CSV
    </a>
  </div>
);

const ImportFailure = ({ errors }: { errors: string[] }) => (
  <div role="alert" class="alert alert-error alert-soft items-start">
    <div class="min-w-0">
      <p class="font-medium">Import aborted — nothing was changed.</p>
      <ul class="mt-2 list-disc pl-5 text-sm space-y-1">
        {errors.map((error) => (
          <li>{error}</li>
        ))}
      </ul>
    </div>
  </div>
);

const ImportOutcome = ({ result }: { result: ImportResult }) => {
  if (!result.ok) return <ImportFailure errors={result.errors} />;

  return (
    <div role="alert" class="alert alert-success alert-soft">
      <span>
        Imported {result.categories} categories and {result.transactions} transactions. Everything
        the account held before was replaced.
      </span>
    </div>
  );
};

/* A conversion can fail on its own terms, before the importer is ever handed
   anything, so the two stages report separately. */
export type LegacyOutcome =
  | { ok: false; errors: string[] }
  | {
    ok: true;
    categories: number;
    transactions: number;
    byType: Record<string, number>;
    nudged: number;
  };

const TYPE_LABELS: Record<string, string> = {
  INCOME: "income",
  EXPENSE: "expenses",
  TRANSFER_IN: "transfers in",
  TRANSFER_OUT: "transfers out",
};

const LegacyImportOutcome = ({ result }: { result: LegacyOutcome }) => {
  if (!result.ok) return <ImportFailure errors={result.errors} />;

  return (
    <div role="alert" class="alert alert-success alert-soft items-start">
      <div class="min-w-0">
        <p class="font-medium">
          Imported {result.transactions} transactions and {result.categories} categories.
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          {Object.entries(result.byType).map(([type, count]) => (
            <span class="badge badge-sm badge-ghost">
              {count} {TYPE_LABELS[type] ?? type}
            </span>
          ))}
        </div>
        {/* Worth saying out loud: the times in the app won't match the sheet to
            the second for these rows. */}
        {result.nudged > 0 ? (
          <p class="mt-2 text-sm">
            {result.nudged} row(s) shared a minute with another and were moved a second later, so
            every transaction has its own timestamp.
          </p>
        ) : null}
      </div>
    </div>
  );
};

const ReplaceWarning = () => (
  <div role="alert" class="alert alert-warning alert-soft">
    <span>
      This replaces every transaction and category on your account. There is no undo — export
      first.
    </span>
  </div>
);

const ConfirmField = () => (
  <fieldset class="fieldset">
    <legend class="fieldset-legend">Type REPLACE to confirm</legend>
    <input
      type="text"
      name="confirm"
      required
      pattern="REPLACE"
      autocomplete="off"
      placeholder="REPLACE"
      class="input w-full"
    />
  </fieldset>
);

const DataPage = ({
  user,
  result,
  legacy,
}: {
  user: { username: string };
  result?: ImportResult;
  legacy?: LegacyOutcome;
}) => (
  <Layout title="Data" currentPath="/export" user={user}>
    <div class="flex flex-col gap-4">
      <div class="card bg-base-100 shadow-md">
        <div class="card-body gap-4">
          <div>
            <h1 class="card-title text-lg sm:text-xl">Export</h1>
            <p class="text-sm text-base-content/60">
              Download a snapshot of each table. Exports always contain every row, ignoring the
              filters on the transactions page.
            </p>
          </div>
          <ExportRow
            title="Transactions"
            description="id, type, amount, times, category name and note"
            href="/transactions/csv"
          />
          <ExportRow
            title="Categories"
            description="id, name and color"
            href="/categories/csv"
          />
        </div>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body gap-4">
          <div>
            <h2 class="card-title text-lg sm:text-xl">Import</h2>
            <p class="text-sm text-base-content/60">
              Both files are required and must have exactly the columns the export writes.
              Categories are applied first and the transactions are re-pointed at them, so the ids
              in the files are not kept. If anything at all is wrong, nothing is written.
            </p>
          </div>

          {result ? <ImportOutcome result={result} /> : null}

          <ReplaceWarning />

          {/* A plain multipart submit rather than htmx: the response is a whole
              page with an outcome on it, and file inputs need no swapping. */}
          <form
            method="post"
            action="/import"
            enctype="multipart/form-data"
            class="flex flex-col gap-4"
            hx-boost="false"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Categories CSV</legend>
              <input
                type="file"
                name="categories"
                accept=".csv,text/csv"
                required
                class="file-input w-full"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Transactions CSV</legend>
              <input
                type="file"
                name="transactions"
                accept=".csv,text/csv"
                required
                class="file-input w-full"
              />
            </fieldset>
            <ConfirmField />
            <button type="submit" class="btn btn-error self-start">
              Replace all data
            </button>
          </form>
        </div>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body gap-4">
          <div>
            <h2 class="card-title text-lg sm:text-xl">Import a legacy spreadsheet</h2>
            <p class="text-sm text-base-content/60">
              For the older single-sheet format with{" "}
              <span class="font-mono text-xs">Transaction Type, Date, Time, Category, Notes, Amount, Balance</span>{" "}
              columns. It is converted on upload — the Balance column is only a running total, so it
              is read for nothing and discarded.
            </p>
          </div>

          {legacy ? <LegacyImportOutcome result={legacy} /> : null}

          {/* The conversion has to make a handful of choices the sheet doesn't
              record, and finding them out after the import would be worse. */}
          <div class="collapse collapse-arrow border border-base-content/10 rounded-box">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-medium">How rows are converted</div>
            <div class="collapse-content text-sm text-base-content/70">
              <ul class="list-disc pl-5 space-y-1">
                <li>
                  Income + category <span class="font-mono text-xs">Transfer</span> becomes a
                  transfer in; Expense + <span class="font-mono text-xs">Transfer</span> a transfer
                  out. Every other row becomes plain income or an expense.
                </li>
                <li>
                  <span class="font-mono text-xs">Transfer</span> is a type here rather than a
                  category, so those rows arrive with no category set.
                </li>
                <li>Categories are created from the names in the file and given colours automatically — you can recolour them afterwards.</li>
                <li>Dates and times are read as local wall-clock time, to the minute.</li>
                <li>
                  Two rows in the same minute would collide, so the later one is moved a second
                  forward.
                </li>
              </ul>
            </div>
          </div>

          <ReplaceWarning />

          <form
            method="post"
            action="/import/legacy"
            enctype="multipart/form-data"
            class="flex flex-col gap-4"
            hx-boost="false"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Legacy CSV</legend>
              <input
                type="file"
                name="legacy"
                accept=".csv,text/csv"
                required
                class="file-input w-full"
              />
            </fieldset>
            <ConfirmField />
            <button type="submit" class="btn btn-error self-start">
              Convert and replace all data
            </button>
          </form>
        </div>
      </div>
    </div>
  </Layout>
);

export const exportPage = new Elysia()
  .use(html())
  .use(auth)
  .get("/export", ({ user }) => <DataPage user={user} />, { requirePage: true })
  .post(
    "/import",
    async ({ body, user }) => {
      if (body.confirm !== "REPLACE") {
        return (
          <DataPage
            user={user}
            result={{ ok: false, errors: ['Type REPLACE in the confirmation box to run the import.'] }}
          />
        );
      }

      const [categoriesCsv, transactionsCsv] = await Promise.all([
        body.categories.text(),
        body.transactions.text(),
      ]);

      /* Called straight through rather than over HTTP like the read paths do —
         round-tripping two uploaded files through a second multipart request
         would buy nothing. */
      const result = await importCsv(user.id, categoriesCsv, transactionsCsv);

      return <DataPage user={user} result={result} />;
    },
    {
      body: t.Object({
        categories: t.File(),
        transactions: t.File(),
        confirm: t.String(),
      }),
      requirePage: true,
    },
  )
  .post(
    "/import/legacy",
    async ({ body, user }) => {
      if (body.confirm !== "REPLACE") {
        return (
          <DataPage
            user={user}
            legacy={{ ok: false, errors: ['Type REPLACE in the confirmation box to run the import.'] }}
          />
        );
      }

      let converted;
      try {
        converted = convertLegacyCsv(await body.legacy.text());
      } catch (error) {
        if (!(error instanceof CsvParseError)) throw error;
        return <DataPage user={user} legacy={{ ok: false, errors: [error.message] }} />;
      }

      if (!converted.ok) return <DataPage user={user} legacy={converted} />;

      /* The conversion only ever produces the export's own format, so the
         ordinary importer stays the single way anything reaches the database
         — including the all-or-nothing replace. */
      const result = await importCsv(user.id, converted.categoriesCsv, converted.transactionsCsv);

      return (
        <DataPage
          user={user}
          legacy={
            result.ok
              ? {
                ok: true,
                categories: result.categories,
                transactions: result.transactions,
                byType: converted.byType,
                nudged: converted.nudged,
              }
              : result
          }
        />
      );
    },
    {
      body: t.Object({
        legacy: t.File(),
        confirm: t.String(),
      }),
      requirePage: true,
    },
  );
