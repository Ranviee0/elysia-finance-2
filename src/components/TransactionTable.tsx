import { Html } from "@elysia/html";
import type { TransactionView } from "./types";
import { currency, dateOnlyFormat, timeOnlyFormat, isInflow } from "./format";
import { refreshTransactions } from "./htmx";
import { EditableField } from "./EditableField";

export const TransactionTable = ({ transactions }: { transactions: TransactionView[] }) => (
  <div class="hidden md:block overflow-x-auto">
    <table class="table table-zebra">
      <thead>
        <tr>
          <th>Type</th>
          <th>Date</th>
          <th>Time</th>
          <th class="text-right">Amount</th>
          <th>Category</th>
          <th>Note</th>
          <th class="text-right">Balance</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => {
          const inflow = isInflow(tx.type);

          return (
            <tr class="row-hover">
              <td>
                <EditableField transaction={tx} field="type">
                  <span class={`badge badge-sm ${inflow ? "badge-success" : "badge-error"}`}>
                    {tx.type}
                  </span>
                </EditableField>
              </td>
              {/* Date and time are one field on the row and one route on the
                  server, so either cell opens the same editor. */}
              <td class="text-base-content/60">
                <EditableField transaction={tx} field="time">
                  {dateOnlyFormat.format(new Date(tx.transactionTime))}
                </EditableField>
              </td>
              <td class="text-base-content/60 tabular-nums">
                <EditableField transaction={tx} field="time">
                  {timeOnlyFormat.format(new Date(tx.transactionTime))}
                </EditableField>
              </td>
              <td class={`text-right font-semibold tabular-nums ${inflow ? "text-success" : "text-error"}`}>
                <EditableField transaction={tx} field="amount">
                  {inflow ? "+" : "-"}
                  {currency.format(Number(tx.amount))}
                </EditableField>
              </td>
              <td class="text-base-content/40">
                <EditableField transaction={tx} field="category" class="flex flex-row items-center gap-2">
                  {tx.category ? (
                    <>
                      <span
                        class="inline-block w-4 h-4 rounded-full border border-base-content/20"
                        style={`background-color: ${tx.category.color}`}
                      />
                      {tx.category.name} (id: {tx.category.id})
                    </>
                  ) : (
                    "—"
                  )}
                </EditableField>
              </td>
              <td>
                <EditableField transaction={tx} field="note">
                  {tx.note ?? <span class="text-base-content/40">—</span>}
                </EditableField>
              </td>
              <td class="text-right tabular-nums">{currency.format(tx.balance)}</td>
              <td class="text-right whitespace-nowrap">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  hx-delete={`/transactions/${tx.id}`}
                  hx-swap="none"
                  hx-confirm="Delete this transaction?"
                  hx-indicator="#transactions-loading"
                  {...{
                    "hx-on::after-request": `if (event.detail.successful) ${refreshTransactions};`,
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
