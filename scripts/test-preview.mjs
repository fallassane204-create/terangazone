// Environnement d'essai autonome : base en mémoire, comptes fictifs, aucune
// variable de production copiée vers Supabase et aucun fichier .env modifié.
import { spawn } from "node:child_process";
import { createTestDatabase } from "../tests/support/local-database.mjs";
import { createPreviewApi, PREVIEW_KEY } from "../tests/support/preview-api.mjs";
const db = await createTestDatabase();
const api = createPreviewApi(db);
await new Promise((resolve, reject) => { api.once("error", reject); api.listen(54329, "127.0.0.1", resolve); });
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3220"], {
  windowsHide: true, stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PREVIEW_KEY,
    ADMIN_EMAIL: "admin@example.test", CATALOGUE_INITIAL_PREVIEW: "0", TZ_LOCAL_TEST_PREVIEW: "1" },
});
console.log("APERÇU DE TEST ISOLÉ : http://127.0.0.1:3220 — base éphémère, aucune donnée réelle.");
console.log("Compte fictif : admin@example.test / local-test-only. Non-admin : client@example.test / local-test-only.");
async function stop() { next.kill(); api.close(); await db.close(); }
process.on("SIGINT", () => { void stop().finally(() => process.exit(0)); });
process.on("SIGTERM", () => { void stop().finally(() => process.exit(0)); });
next.on("exit", (code) => { void stop().finally(() => process.exit(code ?? 0)); });
