import { Html } from "@elysia/html";
import type { CategoryView } from "./types";
import { refreshCategories } from "./htmx";

/* Free-form text: the column is a plain String and the API accepts anything,
   so this stays an open field rather than a fixed list of choices.

   Unlike the color swatch, an edit here is committed explicitly. Typing is
   not a decision — half a word is a value the field would happily save — so
   the change only leaves the browser when Save is pressed.

   Save stays disabled until the text actually differs from what was
   rendered, which `defaultValue` still holds; that keeps it from firing a
   request that would write the value already in the database.

   Every handler here is positional (`previous`, `nextElementSibling`) because
   both layouts render a picker per category, so nothing in here can be
   addressed by id without colliding with its twin. */
export const CategoryTypePicker = ({
  category,
  size = "sm",
}: {
  category: CategoryView;
  size?: "sm" | "xs";
}) => {
  return (
    <div class="join">
      <input
        type="text"
        name="categoryType"
        value={category.categoryType ?? ""}
        placeholder="—"
        aria-label={`Type for ${category.name}`}
        class={`input input-${size} join-item w-28`}
        {...{
          oninput: "this.nextElementSibling.disabled = this.value === this.defaultValue",
          /* Enter is the reflex for a one-field edit, so route it to the
             button rather than letting it do nothing. */
          onkeydown:
            "if (event.key === 'Enter') { event.preventDefault(); if (!this.nextElementSibling.disabled) this.nextElementSibling.click(); }",
        }}
      />
      <button
        type="button"
        disabled
        class={`btn btn-${size} btn-primary join-item`}
        hx-patch={`/categories/category-type/${category.id}`}
        /* Scoped to this button's own input rather than an id: the table and
           the mobile list each render a picker for every category, so an id
           would match twice and htmx would send both values under one name —
           which the API rejects as an array. */
        hx-include="previous input"
        hx-swap="none"
        hx-indicator="#categories-loading"
        {...{
          "hx-on::after-request": `if (event.detail.successful) { category_error.classList.add('hidden'); ${refreshCategories}; } else { category_error.textContent = event.detail.xhr.responseText || 'Failed to update type'; category_error.classList.remove('hidden'); }`,
        }}
      >
        Save
      </button>
    </div>
  );
};
