import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { productToService, type ProductRow } from "./products";
import initial from "./initial.json";
import { publicServices } from "./domain";
import type { Catalogue, Category, Service, ShopSettings } from "./types";

export function publicCatalogueClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Configuration Supabase manquante.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) }) },
  });
}

// Déduplication par requête, aucun cache global de prix ou de session.
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  await connection();
  const now = new Date().toISOString();
  try {
    const supabase = publicCatalogueClient();
    const [services, categories, settings, revision] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("sort_order"),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("shop_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.rpc("tz_catalogue_revision"),
    ]);
    const error = services.error || categories.error || settings.error || revision.error;
    if (error || !settings.data) throw new Error(error?.code ? `Catalogue Supabase indisponible (${error.code}).` : "Paramètres de boutique non initialisés.");
    const activeCategories = (categories.data ?? []) as Category[];
    return { services: publicServices((services.data ?? []).map((row) => productToService(row as ProductRow, activeCategories)), activeCategories), categories: activeCategories,
      settings: settings.data as ShopSettings, source: "supabase", issue: null, now, revision: revision.data };
  } catch (error) {
    // Le jeu initial est réservé à une prévisualisation locale explicitement activée.
    // Une panne du catalogue réel ne doit jamais réafficher d'anciens prix ni
    // ressusciter une offre désactivée. Aucun paiement en mode aperçu.
    const preview = process.env.CATALOGUE_INITIAL_PREVIEW === "1";
    return { services: preview ? initial.services as Service[] : [], categories: preview ? initial.categories as Category[] : [], settings: initial.settings as ShopSettings,
      source: preview ? "initial" : "unavailable", issue: error instanceof Error ? error.message : "Catalogue indisponible.", now, revision: null };
  }
});
