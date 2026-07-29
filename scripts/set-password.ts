/* Local admin escape hatch, deliberately kept out of the web app: the site
   itself offers no password recovery, so forgetting a password there really
   does end the account. This exists because the multi-user migration parks
   pre-existing rows on an `owner` account with an unusable hash, and there
   has to be some way to claim them.
 *
 * Usage: bun run scripts/set-password.ts <username> <password>
 */
import { prisma } from "../src/prisma";
import { hashPassword } from "../src/auth";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
    console.error("Usage: bun run scripts/set-password.ts <username> <password>");
    process.exit(1);
}

const user = await prisma.user.findUnique({ where: { username } });
if (!user) {
    console.error(`No user named "${username}".`);
    process.exit(1);
}

await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
});

/* The old password is gone, so anything still holding a session under it
   should have to sign in again. */
await prisma.session.deleteMany({ where: { userId: user.id } });

console.log(`Password set for "${username}". All existing sessions were cleared.`);
