"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
export default function ImagePicker({ src, name, file, onChange }: {
  src: string | null; name: string; file: File | null; onChange: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  return <section className="rounded-2xl border border-white/10 p-4" aria-label="Image du produit">
    <h3 className="mb-3 font-bold">{file ? "Aperçu de la nouvelle image" : "Image actuelle"}</h3>
    <div className="max-w-sm">{file && preview ? <div className="relative aspect-[8/5] overflow-hidden rounded-2xl bg-slate-900"><Image src={preview} alt={`Nouvelle image de ${name}`} fill unoptimized className="object-contain" /></div> : <ProductImage key={src} src={src} name={name} />}</div>
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" className="btn-secondary" onClick={() => input.current?.click()}>Modifier l’image</button>
      {file && <button type="button" className="btn-secondary" onClick={() => { onChange(null); setPreview(null); setError(""); }}>Annuler le remplacement</button>}</div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choisir une nouvelle image" onChange={(event) => {
      const selected = event.target.files?.[0]; event.target.value = "";
      if (!selected) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 5 * 1024 * 1024 || !selected.size) { setError("Choisissez un JPG, PNG ou WebP de 5 Mo maximum."); return; }
      setError(""); setPreview(URL.createObjectURL(selected)); onChange(selected);
    }} />
    <p className="mt-3 text-sm leading-6 text-slate-400">JPG, PNG ou WebP · 5 Mo maximum. {file ? `${file.name} — cliquez sur Enregistrer le service pour appliquer ce remplacement.` : "Choisissez votre photo, vérifiez l’aperçu puis enregistrez le service."}</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
  </section>;
}
