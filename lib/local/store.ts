import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LocalDatabase } from "@/lib/types";

const emptyDatabase = (): LocalDatabase => ({
  version: 1,
  users: [],
  groups: [],
  group_members: [],
  exclusions: [],
  draw_results: [],
});

function dataDirectory() {
  return process.env.LOCAL_DATA_DIR?.trim()
    ? path.resolve(process.env.LOCAL_DATA_DIR.trim())
    : path.join(process.cwd(), ".data");
}

function databaseFile() {
  return path.join(dataDirectory(), "db.json");
}

function normalizeDatabase(value: unknown): LocalDatabase {
  if (!value || typeof value !== "object") return emptyDatabase();

  const candidate = value as Partial<LocalDatabase>;

  return {
    version: 1,
    users: Array.isArray(candidate.users) ? candidate.users : [],
    groups: Array.isArray(candidate.groups) ? candidate.groups : [],
    group_members: Array.isArray(candidate.group_members)
      ? candidate.group_members
      : [],
    exclusions: Array.isArray(candidate.exclusions)
      ? candidate.exclusions
      : [],
    draw_results: Array.isArray(candidate.draw_results)
      ? candidate.draw_results
      : [],
  };
}

let writeQueue: Promise<void> = Promise.resolve();

async function readDatabase(): Promise<LocalDatabase> {
  const file = databaseFile();

  try {
    const raw = await readFile(file, "utf8");
    return normalizeDatabase(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyDatabase();
    }

    console.error("local database read error", error);
    throw new Error(
      "No pudimos leer la base de datos local. Revisa el archivo .data/db.json.",
    );
  }
}

async function writeDatabase(database: LocalDatabase) {
  const directory = dataDirectory();
  const file = databaseFile();
  const temporaryFile = `${file}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(directory, { recursive: true });
  await writeFile(temporaryFile, JSON.stringify(database, null, 2), "utf8");
  await rename(temporaryFile, file);
}

export async function readLocalDatabase<T>(
  reader: (database: LocalDatabase) => T,
): Promise<T> {
  await writeQueue;
  const database = await readDatabase();
  return reader(database);
}

export async function mutateLocalDatabase<T>(
  mutator: (database: LocalDatabase) => T | Promise<T>,
): Promise<T> {
  const operation = writeQueue.then(async () => {
    const database = await readDatabase();
    const result = await mutator(database);
    await writeDatabase(database);
    return result;
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}
