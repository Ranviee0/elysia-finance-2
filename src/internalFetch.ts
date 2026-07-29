/* Page routes render by calling this app's own JSON API over HTTP. That
   second request is a fresh connection with no cookies of its own, so the
   caller's session has to be handed along explicitly or the API answers 401. */
export const forwardCookie = (request: Request) => ({
    cookie: request.headers.get("cookie") ?? "",
});
