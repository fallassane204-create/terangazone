import sharp from "sharp";
export const SERVICE_IMAGE_BUCKET = "service-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export async function prepareServiceImage(file: File): Promise<Buffer> {
  if (!IMAGE_MIME_TYPES.includes(file.type)) throw new Error("Choisissez une image JPG, PNG ou WebP.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("L’image doit peser au maximum 5 Mo.");
  try {
    const source = Buffer.from(await file.arrayBuffer());
    const image = sharp(source, { limitInputPixels: 25_000_000, animated: false });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Format refusé.");
    return await image.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 }).toBuffer();
  } catch {
    throw new Error("Image invalide, animée ou trop grande. Choisissez une autre photo.");
  }
}
