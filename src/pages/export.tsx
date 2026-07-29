import { Elysia } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";

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

export const exportPage = new Elysia().use(html()).get("/export", () => (
  <Layout title="Export" currentPath="/export">
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
  </Layout>
));
