export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (process.env.TZ_LOCAL_TEST_PREVIEW !== "1") return new Response(null, { status: 404 });
  const { filename } = await params;
  if (!/^[0-9a-f-]{36}\.webp$/.test(filename)) return new Response(null, { status: 404 });
  const response = await fetch(`http://127.0.0.1:54329/storage/v1/object/public/service-images/services/${filename}`, { cache: "no-store" });
  if (!response.ok) return new Response(null, { status: 404 });
  return new Response(response.body, { headers: { "Content-Type": "image/webp", "Cache-Control": "no-store" } });
}
