import { Html } from "@elysia/html";
import type { TransactionView } from "./types";
import { currency, dateOnlyFormat, timeOnlyFormat, isInflow } from "./format";
import { refreshTransactions } from "./htmx";

export const TransactionList = ({ transactions }: { transactions: TransactionView[] }) => (
  <ul class="list md:hidden">
    {transactions.map((tx) => {
      const inflow = isInflow(tx.type);
      const when = new Date(tx.transactionTime);

      return (
        <li class="list-row items-center">
          <div class="list-col-grow flex flex-col gap-1.5 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class={`badge badge-sm ${inflow ? "badge-success" : "badge-error"}`}>
                {tx.type}
              </span>
              <span class={`font-semibold tabular-nums ${inflow ? "text-success" : "text-error"}`}>
                {inflow ? "+" : "-"}
                {currency.format(Number(tx.amount))}
              </span>
            </div>
            <div class="flex items-center justify-between gap-2 text-xs text-base-content/60">
              <span class="tabular-nums">
                {dateOnlyFormat.format(when)} · {timeOnlyFormat.format(when)}
              </span>
              <span class="inline-flex items-center gap-1.5">
                {tx.category ? (
                  <>
                    <span
                      class="inline-block w-3 h-3 rounded-full border border-base-content/20"
                      style={`background-color: ${tx.category.color}`}
                    />
                    {tx.category.name} (id: {tx.category.id})
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class={`truncate ${tx.note ? "text-base-content/70" : "text-base-content/40"}`}>
                {tx.note ?? "—"}
              </span>
              <span class="tabular-nums text-base-content/60 shrink-0">
                Balance: {currency.format(tx.balance)}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-square text-error"
            aria-label="Delete transaction"
            hx-delete={`/transactions/${tx.id}`}
            hx-swap="none"
            hx-confirm="Delete this transaction?"
            hx-indicator="#transactions-loading"
            {...{
              "hx-on::after-request": `if (event.detail.successful) ${refreshTransactions};`,
            }}
          >
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
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </li>
      );
    })}
  </ul>
);
