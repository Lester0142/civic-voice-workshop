import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dbPath } from "./lib/db.js";
import { freshSeed } from "./lib/seed.js";

await mkdir(path.dirname(dbPath), { recursive: true });
await writeFile(dbPath, JSON.stringify(freshSeed(), null, 2));
console.log(`Reset workshop data at ${dbPath}`);
