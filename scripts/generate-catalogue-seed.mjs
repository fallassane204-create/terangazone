import { readFile, writeFile } from "node:fs/promises";
const seed = JSON.parse(await readFile("lib/catalogue/initial.json", "utf8"));
const { serviceToProduct } = await import("../lib/catalogue/products.ts");
const quote = (value) => value === null ? "NULL" : typeof value === "number" || typeof value === "boolean" ? String(value) : `'${(typeof value === "object" ? JSON.stringify(value) : value).replaceAll("'", "''")}'`;
let sql = "-- Tarifs corrigés selon la demande du propriétaire. Aucune exécution automatique.\n-- CapCut Pro : durée non précisée par le propriétaire, aucun abonnement mensuel supposé.\n-- GÉNÉRÉ depuis lib/catalogue/initial.json. Ne pas modifier les prix ici.\n-- Après 001, exécution manuelle. Ne remplace jamais les données déjà présentes.\nbegin;\nlock table public.products in share row exclusive mode;\n";
for (const [table, records] of [["categories", seed.categories], ["products", seed.services.map((s) => ({ id: s.id, ...serviceToProduct(s, seed.categories.find((c) => c.id === s.category_id).name) }))], ["shop_settings", [seed.settings]]]) {
  for (const record of records) {
    const entries = Object.entries(record).filter(([key]) => !["created_at", "updated_at", "archived_at"].includes(key));
    const guard = table === "products" ? ` where not exists (select 1 from public.products where id=${quote(record.id)} or slug=${quote(record.slug)} or lower(btrim(name))=lower(${quote(record.name)}))` : "";
    sql += `insert into public.${table} (${entries.map(([key]) => key).join(", ")}) select ${entries.map(([, value]) => quote(value)).join(", ")}${guard} on conflict do nothing;\n`;
  }
}
sql += "commit;\n";
await writeFile("supabase/migrations/002_initial_catalogue.sql", sql);
console.log("Seed SQL généré, aucun SQL exécuté.");
