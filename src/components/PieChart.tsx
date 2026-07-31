import { Html } from "@elysia/html";
import { currency } from "./format";
import type { SummarySlice } from "./types";

/* Transactions with no category still have to be drawn, so they get a neutral
   gray that no category picker can produce as a "real" colour. */
export const UNCATEGORIZED_COLOR = "#9ca3af";

const SIZE = 240;
const RADIUS = 112;
const CENTER = SIZE / 2;

const sliceColor = (slice: SummarySlice) => slice.color ?? UNCATEGORIZED_COLOR;

/* Angles run clockwise from twelve o'clock, which is where a reader expects a
   pie to start. */
const pointOnCircle = (angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [
    CENTER + RADIUS * Math.cos(radians),
    CENTER + RADIUS * Math.sin(radians),
  ] as const;
};

const arcPath = (startAngle: number, endAngle: number) => {
  const [x1, y1] = pointOnCircle(startAngle);
  const [x2, y2] = pointOnCircle(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const EmptyState = ({ message }: { message: string }) => (
  <div class="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <div class="w-28 h-28 rounded-full border-4 border-dashed border-base-content/15"></div>
    <p class="text-sm text-base-content/60">{message}</p>
  </div>
);

/* The pie answers "roughly how is this split"; the table underneath carries the
   exact figures, names the slices without relying on colour, and stays readable
   past the handful of slices a pie can distinguish on its own. */
export const PieChart = ({
  slices,
  label,
  emptyMessage,
}: {
  slices: SummarySlice[];
  label: string;
  emptyMessage: string;
}) => {
  const total = slices.reduce((sum, slice) => sum + slice.total, 0);

  if (slices.length === 0 || total <= 0) {
    return <EmptyState message={emptyMessage} />;
  }

  /* Subtotals for the group headers, and the count that decides whether the
     headers earn their space at all — with everything in one group they would
     just be a banner repeating the total. */
  const groupTotals = new Map<string, number>();
  for (const slice of slices) {
    groupTotals.set(slice.categoryType, (groupTotals.get(slice.categoryType) ?? 0) + slice.total);
  }
  const showGroups = groupTotals.size > 1;

  let angle = 0;
  const drawn = slices.map((slice) => {
    const share = slice.total / total;
    const start = angle;
    angle += share * 360;

    return { slice, share, start, end: angle };
  });

  return (
    <div class="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
      <div class="shrink-0">
        <div class="text-center mb-2">
          <div class="text-xs uppercase tracking-wide text-base-content/50">{label}</div>
          <div class="text-2xl font-semibold tabular-nums">{currency.format(total)}</div>
        </div>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          class="w-56 h-56"
          role="img"
          aria-label={`${label}: ${currency.format(total)} across ${drawn.length} categories`}
        >
          {/* A lone slice is a full circle, and an arc whose start and end
              coincide would collapse to nothing. */}
          {drawn.length === 1 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill={sliceColor(drawn[0]!.slice)}
            >
              <title>
                {drawn[0]!.slice.name}: {currency.format(drawn[0]!.slice.total)} (100%)
              </title>
            </circle>
          ) : (
            drawn.map(({ slice, share, start, end }) => (
              <path
                d={arcPath(start, end)}
                fill={sliceColor(slice)}
                stroke="var(--color-base-100)"
                stroke-width="2"
              >
                <title>
                  {slice.name}: {currency.format(slice.total)} ({(share * 100).toFixed(1)}%)
                </title>
              </path>
            ))
          )}
        </svg>
      </div>

      <div class="w-full overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {drawn.flatMap(({ slice, share }, index) => {
              /* The API already ordered same-typed slices together, so a
                 change of type between neighbours is exactly a group break. */
              const startsGroup =
                showGroups && slice.categoryType !== drawn[index - 1]?.slice.categoryType;

              return [
                ...(startsGroup
                  ? [
                      <tr class="bg-base-200">
                        <th class="text-xs uppercase tracking-wide text-base-content/60">
                          {slice.categoryType || "No type"}
                        </th>
                        <th class="text-right tabular-nums text-xs">
                          {currency.format(groupTotals.get(slice.categoryType)!)}
                        </th>
                        <th class="text-right tabular-nums text-xs text-base-content/60">
                          {((groupTotals.get(slice.categoryType)! / total) * 100).toFixed(1)}%
                        </th>
                      </tr>,
                    ]
                  : []),
                <tr>
                  <td>
                    <span class={`inline-flex items-center gap-2 ${showGroups ? "pl-3" : ""}`}>
                      <span
                        class="inline-block w-3 h-3 rounded-full border border-base-content/20 shrink-0"
                        style={`background-color: ${sliceColor(slice)}`}
                      ></span>
                      <span class={slice.categoryId === null ? "text-base-content/60" : ""}>
                        {slice.name}
                      </span>
                    </span>
                  </td>
                  <td class="text-right tabular-nums">{currency.format(slice.total)}</td>
                  <td class="text-right tabular-nums text-base-content/60">
                    {(share * 100).toFixed(1)}%
                  </td>
                </tr>,
              ];
            })}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th class="text-right tabular-nums">{currency.format(total)}</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
