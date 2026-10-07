"use server";

import { productToService, serviceToProduct, type ProductRow } from "@/lib/catalogue/products";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { validateCategory, validateService, validateSettings } from "@/lib/catalogue/domain";
import type { Category, Service, ShopSettings, MutationResult } from "@/lib/catalogue/types";
import { prepareServiceImage, SERVICE_IMAGE_BUCKET } from "@/lib/catalogue/image-upload";
import { managedServiceImagePath, replaceServiceImage } from "@/lib/catalogue/image-replacement";

export type AdminCatalogue = { services: Service[]; categories: Category[]; settings: ShopSettings | null; error: string | null };
export async function loadAdminCatalogue(): Promise<AdminCatalogue> {
  const db = await requireAdmin();
  try {
    const [services, categories, settings] = await Promise.all([
      db.from("products").select("*").order("sort_order"),
      db.from("categories").select("*").order("sort_order"),
      db.from("shop_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (services.error || categories.error || settings.error || !settings.data) throw new Error("Catalogue non initialisé ou permissions insuffisantes. Vérifiez la migration et l’inscription de votre compte admin.");
    // RLS est vérifiée en plus de ADMIN_EMAIL : un compte sans inscription
    // dans public.admins ne doit pas recevoir une interface de sauvegarde.
    const { data: authorized, error } = await db.rpc("tz_is_catalogue_admin");
    if (error || authorized !== true) throw new Error("Votre compte n’est pas inscrit comme administrateur du catalogue dans Supabase.");
    return { services: services.data.map((row) => productToService(row as ProductRow, categories.data as Category[])), categories: categories.data as Category[], settings: settings.data as ShopSettings, error: null };
  } catch (error) {
    return { services: [], categories: [], settings: null, error: error instanceof Error ? error.message : "Impossible de charger le catalogue." };
  }
}
function refreshCatalogue() {
  revalidatePath("/", "layout");
}
function mutationError(error: unknown): MutationResult {
  const message = error instanceof Error ? error.message : "Erreur lors de l’enregistrement.";
  return { ok: false, message };
}
async function writableDb() {
  const db = await requireAdmin();
  const { data, error } = await db.rpc("tz_is_catalogue_admin");
  if (error || data !== true) throw new Error("Accès refusé : vérifiez votre inscription admin et les politiques RLS.");
  return db;
}
function dbError(code: string) {
  if (code === "23505") return new Error("Cet identifiant existe déjà. Choisissez un autre identifiant.");
  if (code === "23503") return new Error("La catégorie sélectionnée n’existe plus.");
  if (code === "42501") return new Error("Enregistrement refusé par les permissions Supabase.");
  return new Error("Erreur Supabase : modification non enregistrée.");
}
export async function saveService(input: Partial<Service>): Promise<MutationResult> {
  try {
    const db = await writableDb();
    const validated = validateService(input);
    const { data: category, error: categoryError } = await db.from("categories").select("name").eq("id", validated.category_id).single();
    if (categoryError || !category) throw new Error("Catégorie introuvable.");
    const values = serviceToProduct({ ...validated, archived_at: input.archived_at }, category.name);
    if (input.id) {
      if (!input.updated_at) throw new Error("Version de service manquante. Rechargez la page.");
      const { data, error } = await db.from("products").update(values).eq("id", input.id).eq("updated_at", input.updated_at).select("id").maybeSingle();
      if (error) throw dbError(error.code);
      if (!data) throw new Error("Ce service a changé ou a été retiré. Rechargez la page avant de réessayer.");
    } else {
      const { error } = await db.from("products").insert(values);
      if (error) throw dbError(error.code);
    }
    refreshCatalogue();
    return { ok: true, message: input.id ? "Modifications enregistrées." : "Service ajouté." };
  } catch (error) { return mutationError(error); }
}
export async function saveServicePrice(id: string, updatedAt: string, price: number | null, oldPrice: number | null, promotionEnabled: boolean): Promise<MutationResult> {
  try {
    const db = await writableDb();
    const { data: service, error } = await db.from("products").select("*").eq("id", id).eq("updated_at", updatedAt).maybeSingle();
    if (error || !service) throw new Error("Service modifié ou inaccessible. Rechargez la page.");
    const { data: categories } = await db.from("categories").select("*");
    const validated = validateService({ ...productToService(service as ProductRow, categories ?? []), price, old_price: oldPrice, promotion_enabled: promotionEnabled });
    const { data, error: updateError } = await db.from("products").update({ price: validated.price ?? 0, quote_only: validated.price === null, old_price: validated.old_price, promotion_enabled: validated.promotion_enabled })
      .eq("id", id).eq("updated_at", updatedAt).select("id").maybeSingle();
    if (updateError) throw dbError(updateError.code);
    if (!data) throw new Error("Une autre modification a été enregistrée. Rechargez la page.");
    refreshCatalogue();
    return { ok: true, message: "Prix enregistré. Le catalogue public est actualisé." };
  } catch (error) { return mutationError(error); }
}
export async function saveServiceWithImage(input: Partial<Service>, form: FormData): Promise<MutationResult> {
  try {
    const db = await writableDb();
    validateService(input);
    let previousImage: string | null = null;
    if (input.id) {
      const { data, error } = await db.from("products").select("id,image").eq("id", input.id).eq("updated_at", input.updated_at ?? "").maybeSingle();
      if (error || !data) throw new Error("Produit modifié entre-temps. Rechargez la page.");
      previousImage = data.image;
    }
    const file = form.get("image");
    if (!(file instanceof File)) throw new Error("Choisissez une image à téléverser.");
    const bytes = await prepareServiceImage(file);
    const path = `services/${crypto.randomUUID()}.webp`;
    const storage = db.storage.from(SERVICE_IMAGE_BUCKET);
    const { data } = storage.getPublicUrl(path);
    // Aperçu isolé : proxy strictement local, jamais utilisé en production.
    const imageUrl = process.env.TZ_LOCAL_TEST_PREVIEW === "1" ? `/api/test-image/${path.split("/").at(-1)}` : data.publicUrl;
    return await replaceServiceImage({
      previousImage, newImage: imageUrl, newPath: path,
      resolveOldPath: (url) => managedServiceImagePath(url, storage.getPublicUrl("").data.publicUrl, process.env.TZ_LOCAL_TEST_PREVIEW === "1"),
      upload: async () => {
        const { error } = await storage.upload(path, bytes, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
        if (error) throw new Error("Téléversement indisponible. Vérifiez l’activation du stockage des images ; votre image actuelle est conservée.");
      },
      save: (url) => saveService({ ...input, image_url: url }),
      isReferenced: async (url) => {
        // Inclut aussi les produits désactivés et archivés visibles par l’admin.
        const { data, error } = await db.from("products").select("id").eq("image", url).limit(1);
        if (error) throw new Error("Vérification des références impossible.");
        return !!data?.length;
      },
      remove: async (objectPath) => {
        const { error } = await storage.remove([objectPath]);
        if (error) throw new Error("Nettoyage de l’image impossible.");
      },
    });
  } catch (error) { return mutationError(error); }
}
export async function archiveService(id: string, updatedAt: string, archived: boolean): Promise<MutationResult> {
  try {
    const db = await writableDb();
    if (!id || !updatedAt || typeof archived !== "boolean") throw new Error("Service invalide.");
    const { data: existing, error: readError } = await db.from("products").select("details").eq("id", id).eq("updated_at", updatedAt).maybeSingle();
    if (readError || !existing) throw new Error("Produit modifié entre-temps.");
    const { data, error } = await db.from("products").update({ details: { ...existing.details, archived_at: archived ? new Date().toISOString() : null }, active: !archived })
      .eq("id", id).eq("updated_at", updatedAt).select("id").maybeSingle();
    if (error) throw dbError(error.code);
    if (!data) throw new Error("Service modifié entre-temps. Rechargez la page.");
    refreshCatalogue();
    return { ok: true, message: archived ? "Service archivé. Les commandes historiques sont conservées." : "Service restauré et activé." };
  } catch (error) { return mutationError(error); }
}
export async function saveCategory(input: Partial<Category>): Promise<MutationResult> {
  try {
    const db = await writableDb();
    const values = validateCategory(input);
    if (input.id) {
      if (!input.updated_at) throw new Error("Version de catégorie manquante.");
      const { data, error } = await db.from("categories").update(values).eq("id", input.id).eq("updated_at", input.updated_at).select("id").maybeSingle();
      if (error) throw dbError(error.code);
      if (!data) throw new Error("Catégorie modifiée entre-temps. Rechargez la page.");
    } else {
      const { error } = await db.from("categories").insert(values);
      if (error) throw dbError(error.code);
    }
    refreshCatalogue();
    return { ok: true, message: input.id ? "Catégorie enregistrée." : "Catégorie ajoutée." };
  } catch (error) { return mutationError(error); }
}
export async function saveShopSettings(input: Partial<ShopSettings>): Promise<MutationResult> {
  try {
    const db = await writableDb();
    const values = validateSettings(input);
    if (!input.updated_at) throw new Error("Version des paramètres manquante.");
    const { data, error } = await db.from("shop_settings").update(values).eq("id", 1).eq("updated_at", input.updated_at).select("id").maybeSingle();
    if (error) throw dbError(error.code);
    if (!data) throw new Error("Paramètres modifiés entre-temps. Rechargez la page.");
    refreshCatalogue();
    return { ok: true, message: "Paramètres enregistrés." };
  } catch (error) { return mutationError(error); }
}
