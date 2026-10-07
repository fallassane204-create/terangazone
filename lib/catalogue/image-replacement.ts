import type { MutationResult } from "./types.ts";

const managedPath = /^services\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

// Aucun chemin local, autre bucket ou URL externe ne doit être supprimé.
export function managedServiceImagePath(source: string | null, bucketUrl: string, localPreview = false): string | null {
  if (!source) return null;
  if (localPreview && source.startsWith("/api/test-image/")) {
    const path = `services/${source.slice("/api/test-image/".length)}`;
    return managedPath.test(path) ? path : null;
  }
  try {
    const url = new URL(source);
    const bucket = new URL(bucketUrl);
    const prefix = `${bucket.pathname.replace(/\/$/, "")}/`;
    if (url.protocol !== "https:" || url.origin !== bucket.origin || url.search || url.hash || !url.pathname.startsWith(prefix)) return null;
    const path = url.pathname.slice(prefix.length);
    return managedPath.test(path) ? path : null;
  } catch { return null; }
}

type Replacement = {
  previousImage: string | null; newImage: string; newPath: string;
  resolveOldPath: (url: string | null) => string | null;
  upload: () => Promise<void>;
  save: (url: string) => Promise<MutationResult>;
  isReferenced: (url: string) => Promise<boolean>;
  remove: (path: string) => Promise<void>;
};

export async function replaceServiceImage(operation: Replacement): Promise<MutationResult> {
  let uploaded = false;
  let saved = false;
  try {
    await operation.upload(); uploaded = true;
    const result = await operation.save(operation.newImage);
    if (!result.ok) {
      await operation.remove(operation.newPath).catch(() => {});
      return result;
    }
    saved = true;
    const oldPath = operation.resolveOldPath(operation.previousImage);
    if (oldPath && oldPath !== operation.newPath && operation.previousImage) {
      try {
        if (!await operation.isReferenced(operation.previousImage)) await operation.remove(oldPath);
      } catch {
        return { ok: true, message: "Nouvelle image enregistrée. Le nettoyage de l’ancienne image n’a pas abouti ; elle a été conservée dans le stockage." };
      }
    }
    return { ok: true, message: "Produit et nouvelle image enregistrés. Les pages publiques sont actualisées." };
  } catch (error) {
    if (uploaded && !saved) await operation.remove(operation.newPath).catch(() => {});
    return { ok: false, message: error instanceof Error ? error.message : "Remplacement de l’image impossible." };
  }
}
