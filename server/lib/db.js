import { JSONFilePreset } from "lowdb/node";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freshSeed } from "./seed.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const dbPath = path.resolve(here, "../../data/db.json");

export async function createDb(file = dbPath) {
  await mkdir(path.dirname(file), { recursive: true });
  const db = await JSONFilePreset(file, freshSeed());
  if (!db.data.users?.length) {
    db.data = freshSeed();
    await db.write();
  }
  return db;
}
