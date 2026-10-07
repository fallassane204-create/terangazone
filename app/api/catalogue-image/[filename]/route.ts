import { prepareDisplayImage } from "@/lib/catalogue/image-display";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|png|jpe?g)$/i.test(filename)) return new Response(null, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!origin) return new Response(null, { status: 503 });
  try {
    const response = await fetch(`${origin}/storage/v1/object/public/service-images/services/${filename}`, { redirect: "error", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return new Response(null, { status: 404 });
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Missing image");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 5 * 1024 * 1024) { await reader.cancel(); throw new Error("Image too large"); }
      chunks.push(value);
    }
    const image = await prepareDisplayImage(Buffer.concat(chunks));
    return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=86400, s-maxage=604800", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response(null, { status: 422 });
  }
}
