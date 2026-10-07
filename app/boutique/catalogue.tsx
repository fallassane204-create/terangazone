"use client";
import { useMemo, useState } from "react";
import type { Catalogue } from "@/lib/catalogue/types";
import { ServiceCard } from "@/components/storefront";
export default function CatalogueGrid({ catalogue }: { catalogue: Catalogue }) {
  const [search, setSearch] = useState(""); const [category, setCategory] = useState("");
  const filtered = useMemo(() => catalogue.services.filter((s) => {
    const categoryName = catalogue.categories.find((c) => c.id === s.category_id)?.name ?? "";
    return (!category || category === s.category_id) && `${s.name} ${s.short_description} ${categoryName}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"));
  }), [catalogue, search, category]);
  return <><label className="block max-w-xl"><span className="mb-2 block text-sm font-bold text-slate-300">Rechercher un service ou un produit</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="field" placeholder="Netflix, ChatGPT, création…" /></label>
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Catégories">{[{ id: "", name: "Tous" }, ...catalogue.categories].map((c) => <button type="button" key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={`rounded-xl border px-3 py-3 text-sm font-bold ${category === c.id ? "border-blue-400 bg-blue-500/20 text-blue-200" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>{c.name}</button>)}</div>
    <p className="mt-8 text-sm text-slate-400" role="status">{filtered.length} offre{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}</p><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((s) => <ServiceCard key={s.id} service={s} settings={catalogue.settings} now={catalogue.now} category={catalogue.categories.find((c) => c.id === s.category_id)?.name} />)}</div>
    {filtered.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-6 text-center"><p>Aucune offre ne correspond à votre recherche.</p><button type="button" onClick={() => { setCategory(""); setSearch(""); }} className="mt-4 text-blue-300 underline">Réinitialiser les filtres</button></div>}</>;
}
