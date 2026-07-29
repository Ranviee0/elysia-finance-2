import { Elysia } from "elysia";
import { prisma } from "@/prisma";

export const SESSION_COOKIE = "sid";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/* Local dev is plain HTTP, where a `secure` cookie would never be sent back.
   Anything reachable off this machine has to run behind TLS and set
   COOKIE_SECURE=1, otherwise the session token travels in the clear. */
export const sessionCookieAttributes = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.COOKIE_SECURE === "1",
} as const;

export const hashPassword = (password: string) => Bun.password.hash(password);

/* Bun throws instead of returning false when the stored hash isn't a valid
   argon2 string — which is what the migration's backfilled `owner` row holds
   until someone sets a password on it. A bad hash is just a failed login. */
export const verifyPassword = async (password: string, hash: string) => {
    try {
        return await Bun.password.verify(password, hash);
    } catch {
        return false;
    }
};

export const createSession = (userId: number) =>
    prisma.session.create({
        data: {
            id: crypto.randomUUID(),
            userId,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
    });

export const findSessionUser = async (token?: string) => {
    if (!token) return null;

    const session = await prisma.session.findUnique({
        where: { id: token },
        include: { user: true },
    });
    if (!session) return null;

    if (session.expiresAt.getTime() <= Date.now()) {
        await prisma.session.delete({ where: { id: session.id } });
        return null;
    }

    return session.user;
};

/* Two ways to reject an anonymous request: JSON endpoints answer 401 so htmx
   can surface the message, while page routes send the browser to the login
   form. Both hand the handler a `user`, so a route that opts in can never
   read one that isn't there. */
export const auth = new Elysia({ name: "auth" }).macro({
    requireUser: {
        async resolve({ cookie, status }) {
            const user = await findSessionUser(cookie[SESSION_COOKIE]?.value as string | undefined);
            if (!user) return status(401, "Not logged in");
            return { user };
        },
    },
    requirePage: {
        async resolve({ cookie, headers, set, status }) {
            const user = await findSessionUser(cookie[SESSION_COOKIE]?.value as string | undefined);
            if (!user) {
                /* A fragment refresh from a page whose session just expired
                   would otherwise follow the 302 and swap the login form into
                   the content card, so htmx is told to navigate instead. */
                if (headers["hx-request"]) {
                    set.headers["hx-redirect"] = "/login";
                    return status(204);
                }

                /* `redirect()` hands back a Response, which a resolve isn't
                   allowed to return, so the Location header goes on by hand. */
                set.headers.location = "/login";
                return status(302);
            }
            return { user };
        },
    },
});
