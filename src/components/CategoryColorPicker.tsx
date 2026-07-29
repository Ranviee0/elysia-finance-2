import { Html } from "@elysia/html";
import type { CategoryView } from "./types";
import { refreshCategories } from "./htmx";

/* Swatch that doubles as the editor: picking a color PATCHes the category
   straight away, so there is no separate save step. */
export const CategoryColorPicker = ({
  category,
  size = "w-8 h-8",
}: {
  category: CategoryView;
  size?: string;
}) => (
  <input
    type="color"
    name="color"
    value={category.color}
    aria-label={`Color for ${category.name}`}
    title="Change color"
    class={`${size} shrink-0 cursor-pointer rounded-md border border-base-content/20 bg-transparent p-0.5`}
    hx-patch={`/categories/color/${category.id}`}
    hx-trigger="change"
    hx-swap="none"
    hx-indicator="#categories-loading"
    {...{
      oninput: `document.querySelectorAll('[data-color-label="${category.id}"]').forEach(el => el.textContent = this.value)`,
      "hx-on::after-request": `if (event.detail.successful) { category_error.classList.add('hidden'); ${refreshCategories}; } else { category_error.textContent = event.detail.xhr.responseText || 'Failed to update color'; category_error.classList.remove('hidden'); }`,
    }}
  />
);
