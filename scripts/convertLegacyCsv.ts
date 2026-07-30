/* Command-line half of the legacy spreadsheet import, for when the files are
   wanted on disk — to look over before uploading, or to keep. The page at
   /export does the same conversion in one step. The rules themselves live in
   src/legacyCsv.ts so the two can't drift apart.
 *
 * Usage: bun run scripts/convertLegacyCsv.ts <legacy.csv> [outputDir]
 */
import { convertLegacyCsv } from "../src/legacyCsv";
import { CsvParseError } from "../src/csv";

const [input, outputDir = "."] = process.argv.slice(2);

if (!input) {
    console.error("Usage: bun run scripts/convertLegacyCsv.ts <legacy.csv> [outputDir]");
    process.exit(1);
}

let result;
try {
    result = convertLegacyCsv(await Bun.file(input).text());
} catch (error) {
    if (!(error instanceof CsvParseError)) throw error;
    console.error(error.message);
    process.exit(1);
}

if (!result.ok) {
    console.error("The file could not be converted:");
    for (const error of result.errors) console.error(`  ${error}`);
    process.exit(1);
}

await Bun.write(`${outputDir}/categories.csv`, result.categoriesCsv);
await Bun.write(`${outputDir}/transactions.csv`, result.transactionsCsv);

console.log(`Wrote ${outputDir}/categories.csv (${result.categories} categories)`);
console.log(`Wrote ${outputDir}/transactions.csv (${result.transactions} transactions)`);
console.log(
    `  ${Object.entries(result.byType).map(([type, count]) => `${type}: ${count}`).join(", ")}`,
);
if (result.nudged > 0) {
    console.log(`  ${result.nudged} timestamp collision(s) resolved by shifting seconds forward.`);
}
console.log("Now upload both files on /export (this replaces everything on the account).");
