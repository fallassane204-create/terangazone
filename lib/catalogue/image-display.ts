import sharp from "sharp";

/** Remove uniform outer margins for display; stored originals remain untouched. */
export async function prepareDisplayImage(source: Buffer): Promise<Buffer> {
  const image = sharp(source, { limitInputPixels: 25_000_000, animated: false });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Invalid catalogue image");
  return image.rotate().trim({ threshold: 12 }).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
}
