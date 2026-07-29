import { Elysia, t } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { prisma } from "@/prisma";
import {
    SESSION_COOKIE,
    auth,
    createSession,
    findSessionUser,
    hashPassword,
    sessionCookieAttributes,
    verifyPassword,
} from "@/auth";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;

/* Failures come back as a code in the query string rather than as text, so
   nothing a visitor types can be reflected into the page. */
const ERRORS: Record<string, string> = {
    credentials: "Wrong username or password.",
    username: "Usernames are 3–32 characters, letters, numbers, - and _ only.",
    taken: "That username is already taken.",
    short: `Passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    mismatch: "The two passwords didn't match.",
    current: "Your current password is wrong.",
    expired: "Your session ended. Please sign in again.",
};

const ErrorAlert = ({ code }: { code?: string }) => {
    const message = code ? ERRORS[code] : undefined;
    if (!message) return null;

    return (
        <div role="alert" class="alert alert-error alert-soft">
            <span>{message}</span>
        </div>
    );
};

const AuthCard = ({ title, subtitle, children }: { title: string; subtitle: string; children?: any }) => (
    <div class="card bg-base-100 shadow-md max-w-md mx-auto">
        <div class="card-body gap-4">
            <div>
                <h1 class="card-title text-lg sm:text-xl">{title}</h1>
                <p class="text-sm text-base-content/60">{subtitle}</p>
            </div>
            {children}
        </div>
    </div>
);

const authQuery = t.Object({ error: t.Optional(t.String()) });

const credentialsBody = t.Object({
    username: t.String(),
    password: t.String(),
});

/* Every auth form opts out of hx-boost: these are plain browser submissions
   so the 303 lands as a real navigation with the Set-Cookie applied. */
export const authPage = new Elysia()
    .use(html())
    .use(auth)
    .get(
        "/login",
        async ({ cookie, query, redirect }) => {
            const user = await findSessionUser(cookie[SESSION_COOKIE]?.value as string | undefined);
            if (user) return redirect("/", 303);

            return (
                <Layout title="Sign in" currentPath="/login">
                    <AuthCard title="Sign in" subtitle="Your transactions and categories are private to your account.">
                        <ErrorAlert code={query.error} />
                        <form method="post" action="/auth/login" class="flex flex-col gap-4" hx-boost="false">
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">Username</legend>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    autocomplete="username"
                                    autofocus
                                    class="input w-full"
                                />
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">Password</legend>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    autocomplete="current-password"
                                    class="input w-full"
                                />
                            </fieldset>
                            <button type="submit" class="btn btn-primary">
                                Sign in
                            </button>
                        </form>
                        <p class="text-sm text-base-content/60">
                            No account? <a href="/register" class="link">Create one</a>.
                        </p>
                    </AuthCard>
                </Layout>
            );
        },
        { query: authQuery },
    )
    .get(
        "/register",
        async ({ cookie, query, redirect }) => {
            const user = await findSessionUser(cookie[SESSION_COOKIE]?.value as string | undefined);
            if (user) return redirect("/", 303);

            return (
                <Layout title="Create account" currentPath="/register">
                    <AuthCard
                        title="Create account"
                        subtitle="There is no password recovery — if you lose it, the account's data is gone with it."
                    >
                        <ErrorAlert code={query.error} />
                        <form method="post" action="/auth/register" class="flex flex-col gap-4" hx-boost="false">
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">Username</legend>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    autocomplete="username"
                                    autofocus
                                    class="input w-full"
                                    placeholder="3–32 characters"
                                />
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">Password</legend>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minlength={MIN_PASSWORD_LENGTH}
                                    autocomplete="new-password"
                                    class="input w-full"
                                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                                />
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">Confirm password</legend>
                                <input
                                    type="password"
                                    name="confirm"
                                    required
                                    autocomplete="new-password"
                                    class="input w-full"
                                />
                            </fieldset>
                            <button type="submit" class="btn btn-primary">
                                Create account
                            </button>
                        </form>
                        <p class="text-sm text-base-content/60">
                            Already have one? <a href="/login" class="link">Sign in</a>.
                        </p>
                    </AuthCard>
                </Layout>
            );
        },
        { query: authQuery },
    )
    .get(
        "/account",
        ({ query, user }) => (
            <Layout title="Account" currentPath="/account" user={user}>
                <AuthCard title="Account" subtitle={`Signed in as ${user.username}.`}>
                    {query.changed === "1" ? (
                        <div role="alert" class="alert alert-success alert-soft">
                            <span>Password changed. Any other signed-in devices were logged out.</span>
                        </div>
                    ) : null}
                    <ErrorAlert code={query.error} />
                    <form method="post" action="/auth/password" class="flex flex-col gap-4" hx-boost="false">
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">Current password</legend>
                            <input
                                type="password"
                                name="current"
                                required
                                autocomplete="current-password"
                                class="input w-full"
                            />
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">New password</legend>
                            <input
                                type="password"
                                name="password"
                                required
                                minlength={MIN_PASSWORD_LENGTH}
                                autocomplete="new-password"
                                class="input w-full"
                            />
                        </fieldset>
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">Confirm new password</legend>
                            <input
                                type="password"
                                name="confirm"
                                required
                                autocomplete="new-password"
                                class="input w-full"
                            />
                        </fieldset>
                        <button type="submit" class="btn btn-primary">
                            Change password
                        </button>
                    </form>
                    <div role="alert" class="alert alert-warning alert-soft">
                        <span>
                            There is no reset link and no recovery question. Forgetting this password locks you out of
                            this account permanently.
                        </span>
                    </div>
                </AuthCard>
            </Layout>
        ),
        {
            query: t.Object({
                error: t.Optional(t.String()),
                changed: t.Optional(t.String()),
            }),
            requirePage: true,
        },
    )
    .post(
        "/auth/login",
        async ({ body, cookie, redirect }) => {
            const { username, password } = body;

            const user = await prisma.user.findUnique({ where: { username } });

            /* Same reply whether the username or the password was wrong, so
               the form can't be used to enumerate accounts. */
            if (!user || !(await verifyPassword(password, user.passwordHash))) {
                return redirect("/login?error=credentials", 303);
            }

            const session = await createSession(user.id);
            cookie[SESSION_COOKIE]!.set({
                value: session.id,
                expires: session.expiresAt,
                ...sessionCookieAttributes,
            });

            return redirect("/", 303);
        },
        { body: credentialsBody },
    )
    .post(
        "/auth/register",
        async ({ body, cookie, redirect }) => {
            const { username, password, confirm } = body;

            if (!USERNAME_PATTERN.test(username)) return redirect("/register?error=username", 303);
            if (password.length < MIN_PASSWORD_LENGTH) return redirect("/register?error=short", 303);
            if (password !== confirm) return redirect("/register?error=mismatch", 303);

            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) return redirect("/register?error=taken", 303);

            const user = await prisma.user.create({
                data: { username, passwordHash: await hashPassword(password) },
            });

            const session = await createSession(user.id);
            cookie[SESSION_COOKIE]!.set({
                value: session.id,
                expires: session.expiresAt,
                ...sessionCookieAttributes,
            });

            return redirect("/", 303);
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
                confirm: t.String(),
            }),
        },
    )
    .post("/auth/logout", async ({ cookie, redirect }) => {
        const token = cookie[SESSION_COOKIE]?.value as string | undefined;

        /* deleteMany rather than delete so an already-expired or unknown
           token doesn't turn signing out into an error. */
        if (token) await prisma.session.deleteMany({ where: { id: token } });
        cookie[SESSION_COOKIE]!.remove();

        return redirect("/login", 303);
    })
    .post(
        "/auth/password",
        async ({ body, cookie, redirect, user }) => {
            const { current, password, confirm } = body;

            if (!(await verifyPassword(current, user.passwordHash))) {
                return redirect("/account?error=current", 303);
            }
            if (password.length < MIN_PASSWORD_LENGTH) return redirect("/account?error=short", 303);
            if (password !== confirm) return redirect("/account?error=mismatch", 303);

            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: await hashPassword(password) },
            });

            /* A password change is also how you kick out a device you no
               longer control, so every other session goes with it. */
            const token = cookie[SESSION_COOKIE]?.value as string | undefined;
            await prisma.session.deleteMany({
                where: { userId: user.id, id: { not: token ?? "" } },
            });

            return redirect("/account?changed=1", 303);
        },
        {
            body: t.Object({
                current: t.String(),
                password: t.String(),
                confirm: t.String(),
            }),
            requirePage: true,
        },
    );
