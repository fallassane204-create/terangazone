import { writeFile } from "node:fs/promises";
process.loadEnvFile(".env.local");
const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
  headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, Accept: "application/openapi+json" },
  signal: AbortSignal.timeout(15000),
});
const result = await response.json();
if (!response.ok) {
  await writeFile("docs/supabase-schema-observed.json", JSON.stringify({ observed: false, status: response.status, code: result.code ?? "API", note: "API de métadonnées inaccessible avec la configuration actuelle. Aucun schéma confirmé, aucune donnée lue." }, null, 2));
  console.error(`Inspection refusée (${response.status}) : ${result.code ?? "API"}`);
  process.exit(1);
}
const schema = Object.fromEntries(Object.entries(result.definitions ?? {}).map(([table, definition]) => [table, {
  columns: Object.keys(definition.properties ?? {}), required: definition.required ?? [],
}]));
await writeFile("docs/supabase-schema-observed.json", JSON.stringify(schema, null, 2));
console.log(JSON.stringify(schema, null, 2));
