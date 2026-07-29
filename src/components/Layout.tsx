import { Html } from "@elysia/html";

const links = [
  { href: "/", label: "Transactions" },
  { href: "/category", label: "Categories" },
];

const TransactionsIcon = () => (
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
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h10.5"
    />
  </svg>
);

const CategoriesIcon = () => (
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
      d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);

export const Layout = ({
  title,
  currentPath,
  children,
}: {
  title: string;
  currentPath: string;
  children?: any;
}) => (
  <html lang="en" data-theme="light">
    <head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#ffffff" />
      <link rel="stylesheet" href="/public/tailwind.css" />
      <script src="/vendor/htmx/htmx.min.js"></script>
      <script src="/public/app.js" defer></script>
    </head>
    <body class="min-h-screen bg-base-200 pb-24 sm:pb-10" hx-boost="true">
      <header class="navbar bg-base-100 shadow-sm sticky top-0 z-20">
        <div class="flex-1">
          <a href="/" class="px-2 text-lg font-semibold">
            Finance
          </a>
        </div>
        <nav role="tablist" class="tabs tabs-box hidden sm:flex">
          {links.map((link) => (
            <a
              role="tab"
              href={link.href}
              class={`tab ${currentPath === link.href ? "tab-active" : ""}`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      <main class="flex justify-center p-2 sm:p-6">
        <div class="w-full max-w-4xl">{children}</div>
      </main>
      <dialog id="confirm_dialog" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Are you sure?</h3>
          <p id="confirm_dialog_message" class="py-4"></p>
          <div class="modal-action">
            <button type="button" class="btn" onclick="confirm_dialog.close()">
              Cancel
            </button>
            <button id="confirm_dialog_ok" type="button" class="btn btn-error">
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" hx-boost="false">
          <button>close</button>
        </form>
      </dialog>
      <nav class="dock bg-base-100 sm:hidden z-20">
        <a href="/" class={currentPath === "/" ? "dock-active" : ""}>
          <TransactionsIcon />
          <span class="dock-label">Transactions</span>
        </a>
        <a href="/category" class={currentPath === "/category" ? "dock-active" : ""}>
          <CategoriesIcon />
          <span class="dock-label">Categories</span>
        </a>
      </nav>
    </body>
  </html>
);
