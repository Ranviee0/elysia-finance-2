/* Intercept hx-confirm and use the in-app daisyUI dialog instead of
   window.confirm — the native popup is unreliable in embedded browsers
   (VS Code's Simple Browser cancels it silently) and Chrome can suppress
   repeated dialogs, which makes htmx drop the request without feedback. */
document.addEventListener("htmx:confirm", (event) => {
  if (!event.detail.question) return;
  event.preventDefault();

  const dialog = document.getElementById("confirm_dialog");
  const message = document.getElementById("confirm_dialog_message");
  const ok = document.getElementById("confirm_dialog_ok");
  if (!dialog || !message || !ok) {
    if (window.confirm(event.detail.question)) event.detail.issueRequest(true);
    return;
  }

  message.textContent = event.detail.question;
  ok.onclick = () => {
    dialog.close();
    event.detail.issueRequest(true);
  };
  dialog.showModal();
});
