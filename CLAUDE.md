# ElysiaJS Documentation

This project uses ElysiaJS. Local docs are available offline:

- `docs/llms.txt` — table of contents / index of all ElysiaJS doc pages (~120 lines). Read this first to find the right topic.
- `docs/llms-full.txt` — full ElysiaJS documentation bundle (~18k lines). Do NOT read this file in full. Instead, `grep -n` for the relevant heading or keyword (found via `llms.txt`) and read only the matched section with a line-range offset.

When unsure about Elysia API/behavior, or a fix doesn't work on the first try, consult these local docs before guessing or relying on training data — they may reflect a newer version than what you know.

# daisyUI Documentation

This project uses daisyUI (Tailwind CSS component library) for all UI work. Local docs are available offline:

- `docs/daisyui-llms.txt` — full daisyUI 5 reference (component classes, install notes, theming) fetched from https://daisyui.com/llms.txt (~2.3k lines). `grep -n` for the relevant component/class name and read the matched section with a line-range offset rather than reading the whole file.

Whenever building or styling UI (HTML/JSX, forms, modals, tables, buttons, etc.), use daisyUI component classes per this reference instead of guessing class names or hand-rolling custom Tailwind utility combos.
