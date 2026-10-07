import { publicCatalogueClient } from "@/lib/catalogue/server";
export async function GET() {
  try {
    const { data, error } = await publicCatalogueClient().rpc("tz_catalogue_revision");
    if (error || typeof data !== "string") throw new Error("Catalogue indisponible.");
    return Response.json({ revision: data }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Catalogue indisponible." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
