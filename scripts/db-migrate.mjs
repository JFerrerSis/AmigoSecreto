import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

function loadEnvFile(file) {
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const candidates = [
  { label: "DIRECT_URL", value: process.env.DIRECT_URL },
  { label: "DATABASE_URL", value: process.env.DATABASE_URL },
  { label: "POSTGRES_URL", value: process.env.POSTGRES_URL },
].filter((candidate) => candidate.value?.trim());

if (candidates.length === 0) {
  console.error(
    "Falta DIRECT_URL o DATABASE_URL. Configúrala en .env.local antes de migrar.",
  );
  process.exit(1);
}

const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations");
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  console.error("No hay migraciones en supabase/migrations.");
  process.exit(1);
}

const ssl =
  process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false };

async function connect(candidate) {
  const client = new Client({
    connectionString: candidate.value.trim(),
    ssl,
    connectionTimeoutMillis: 15_000,
    application_name: "amigo-secreto-migrations",
  });

  await client.connect();
  return client;
}

let client = null;
let connectedLabel = "";

for (const candidate of candidates) {
  try {
    console.log(`Conectando con ${candidate.label}...`);
    client = await connect(candidate);
    connectedLabel = candidate.label;
    break;
  } catch (error) {
    console.warn(`No se pudo conectar con ${candidate.label}: ${error.message}`);
  }
}

if (!client) {
  console.error("No se pudo conectar a ninguna base de datos.");
  process.exit(1);
}

console.log(`Conectado con ${connectedLabel}.`);

try {
  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDirectory, file);
    const sql = readFileSync(fullPath, "utf8");

    console.log(`Ejecutando ${file}...`);
    await client.query(sql);
    console.log(`OK ${file}`);
  }

  const counts = await client.query(`
    select
      (select count(*)::int from public.users) as users,
      (select count(*)::int from public.groups) as groups,
      (select count(*)::int from public.group_members) as group_members,
      (select count(*)::int from public.exclusions) as exclusions,
      (select count(*)::int from public.draw_results) as draw_results,
      (select count(*)::int from public.email_deliveries) as email_deliveries
  `);

  console.log("Datos actuales:", counts.rows[0]);
} catch (error) {
  console.error(`Error aplicando migraciones: ${error.message}`);
  await client.query("ROLLBACK").catch(() => undefined);
  process.exitCode = 1;
} finally {
  await client.end();
}
