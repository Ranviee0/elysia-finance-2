import { Elysia, t } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { PieChart } from "@/components/PieChart";
import { apiBase } from "@/config";
import { auth } from "@/auth";
import { forwardCookie } from "@/internalFetch";
import type { SummaryView } from "@/components/types";

const pad = (n: number) => String(n).padStart(2, "0");

/* Value format expected by <input type="month">. */
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
};

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

/* A missing or malformed month falls back to this one rather than erroring —
   the page always has something to draw. */
const resolveMonth = (month?: string) => {
  if (!month || !MONTH_PATTERN.test(month)) return currentMonth();

  const [, rawMonth] = month.split("-").map(Number);
  if (!rawMonth || rawMonth < 1 || rawMonth > 12) return currentMonth();

  return month;
};

const monthLabel = (month: string) => {
  const [year, index] = month.split("-").map(Number);
  return new Date(year!, index! - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

type View = "income" | "expense";

const resolveView = (view?: string): View => (view === "expense" ? "expense" : "income");

const fetchSummary = async (month: string, request: Request) => {
  const res = await fetch(`${apiBase}/transactions/summary?month=${month}`, {
    headers: forwardCookie(request),
  });
  return (await res.json()) as SummaryView;
};

const SUB_TABS: { view: View; label: string }[] = [
  { view: "income", label: "Income" },
  { view: "expense", label: "Expense" },
];

const AnalyticsContent = ({
  summary,
  month,
  view,
}: {
  summary: SummaryView;
  month: string;
  view: View;
}) => {
  const slices = summary[view];
  const label = view === "income" ? "Total income" : "Total expense";

  return (
    <div id="analytics-content" class="card bg-base-100 shadow-md">
      <div class="card-body p-0">
        <div class="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
          <h1 class="card-title text-lg sm:text-xl">Analytics</h1>
          <div class="flex items-center gap-3">
            <span id="analytics-loading" class="htmx-indicator loading loading-spinner loading-sm"></span>
            <input
              type="month"
              name="month"
              value={month}
              class="input input-sm"
              aria-label="Month"
              hx-get="/fragments/analytics"
              hx-target="#analytics-content"
              hx-swap="outerHTML"
              hx-trigger="change"
              hx-include="[name='view']"
              hx-indicator="#analytics-loading"
            />
          </div>
        </div>

        {/* The active sub-tab travels with the month picker's request, so
            changing month keeps you on the chart you were looking at. */}
        <input type="hidden" name="view" value={view} />

        <div role="tablist" class="tabs tabs-border px-4 sm:px-6">
          {/* A real href keeps the tab keyboard-focusable and working without
              JS; hx-get takes precedence over the page-level hx-boost, so the
              click still swaps just the card. */}
          {SUB_TABS.map((tab) => (
            <a
              role="tab"
              href={`/analytics?month=${month}&view=${tab.view}`}
              aria-selected={view === tab.view ? "true" : "false"}
              class={`tab ${view === tab.view ? "tab-active" : ""}`}
              hx-get={`/fragments/analytics?month=${month}&view=${tab.view}`}
              hx-target="#analytics-content"
              hx-swap="outerHTML"
              hx-push-url={`/analytics?month=${month}&view=${tab.view}`}
              hx-indicator="#analytics-loading"
            >
              {tab.label}
            </a>
          ))}
        </div>

        <div class="px-4 sm:px-6 py-6">
          <PieChart
            slices={slices}
            label={`${label} · ${monthLabel(month)}`}
            emptyMessage={`No ${view} recorded in ${monthLabel(month)}.`}
          />
        </div>

        <p class="px-4 sm:px-6 pb-4 text-xs text-base-content/50">
          Transfers in and out are excluded — only income and expense entries are counted.
        </p>
      </div>
    </div>
  );
};

const analyticsQuery = t.Object({
  month: t.Optional(t.String()),
  view: t.Optional(t.String()),
});

export const analyticsPage = new Elysia()
  .use(html())
  .use(auth)
  .get(
    "/fragments/analytics",
    async ({ query, request }) => {
      const month = resolveMonth(query.month);
      const summary = await fetchSummary(month, request);

      return <AnalyticsContent summary={summary} month={month} view={resolveView(query.view)} />;
    },
    { query: analyticsQuery, requirePage: true },
  )
  .get(
    "/analytics",
    async ({ query, request, user }) => {
      const month = resolveMonth(query.month);
      const summary = await fetchSummary(month, request);

      return (
        <Layout title="Analytics" currentPath="/analytics" user={user}>
          <AnalyticsContent summary={summary} month={month} view={resolveView(query.view)} />
        </Layout>
      );
    },
    { query: analyticsQuery, requirePage: true },
  );
