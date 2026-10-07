"use client";
import Image from "next/image";
import { useState } from "react";
import { safeImageUrl } from "@/lib/catalogue/domain";
import { temporaryImageFor } from "@/lib/catalogue/images";
export function ProductImage({ src, name, icon = "TZ", large = false, compact = false }: { src: string | null; name: string; icon?: string; large?: boolean; compact?: boolean }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const fallback = temporaryImageFor(name);
  const requested = src && safeImageUrl(src) ? src : fallback;
  const displayed = failedSources.includes(requested) ? fallback : requested;
  return <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/25 via-slate-900 to-purple-600/25 ${compact ? "h-11 w-11" : "aspect-[8/5] w-full"}`}>
    {!failedSources.includes(displayed) ? <Image src={displayed} alt={name} fill sizes={large ? "(max-width: 768px) 90vw, 50vw" : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"}
      unoptimized={displayed.startsWith("https://")} onError={() => setFailedSources((current) => [...current, displayed])} className={compact ? "object-contain p-1" : "object-cover"} /> : <span aria-hidden="true" className={`font-black text-blue-200 ${large ? "text-7xl" : "text-4xl"}`}>{icon}</span>}
  </div>;
}
