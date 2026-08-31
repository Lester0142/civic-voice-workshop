import { writeFile } from "node:fs/promises";
import { dbPath } from "./lib/db.js";
import { freshSeed } from "./lib/seed.js";

await writeFile(dbPath, JSON.stringify(freshSeed(), null, 2));
console.log(`Reset workshop data at ${dbPath}`);
