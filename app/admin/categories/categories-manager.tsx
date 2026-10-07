"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, MutationResult } from "@/lib/catalogue/types";
import { saveCategory } from "../catalogue-actions";
import { AdminPageHeading, Feedback, Label, Toggle } from "../catalogue-ui";
function CategoryForm({ category, onSaved }: { category: Category; onSaved: (message: string) => void }) {
  const [draft, setDraft] = useState(category); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [result, setResult] = useState<MutationResult | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    if (category.is_active && !draft.is_active && !window.confirm(`Désactiver ${category.name} et masquer ses services sur le site public ?`)) return;
    lock.current = true; setBusy(true); setResult(null);
    try { const response = await saveCategory(draft); setResult(response); if (response.ok) onSaved(response.message); }
    catch { setResult({ ok: false, message: "Connexion interrompue. Réessayez." }); } finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="mb-5 font-black">{category.id ? category.name : "Nouvelle catégorie"}</h2><fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2"><Label title="Nom"><input className="field" value={draft.name} maxLength={100} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Label><Label title="Identifiant (ex. streaming)"><input className="field" value={draft.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Label><Label title="Ordre d’affichage"><input className="field" type="number" min={0} step={1} required value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Label><div className="flex items-end"><Toggle title="Catégorie active" checked={draft.is_active} onChange={(value) => setDraft({ ...draft, is_active: value })} /></div><button className="btn-primary sm:col-span-2" type="submit">{busy ? "Enregistrement…" : category.id ? "Enregistrer la catégorie" : "Ajouter la catégorie"}</button></fieldset><Feedback result={result} /></form>;
}
export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter(); const [adding, setAdding] = useState(false); const [result, setResult] = useState<MutationResult | null>(null);
  function saved(message: string) { setResult({ ok: true, message }); setAdding(false); router.refresh(); }
  return <><AdminPageHeading title="Catégories" description="Renommez, ordonnez ou désactivez une catégorie. Les services associés suivent automatiquement le changement."><button type="button" className="btn-primary" onClick={() => setAdding(!adding)}>{adding ? "Annuler" : "Ajouter une catégorie"}</button></AdminPageHeading><Feedback result={result} />
    <div className="mt-6 grid gap-5 lg:grid-cols-2">{adding && <CategoryForm key="new" category={{ id: "", name: "", slug: "", is_active: true, sort_order: categories.length, updated_at: null }} onSaved={saved} />}{categories.map((c) => <CategoryForm key={`${c.id}:${c.updated_at}`} category={c} onSaved={saved} />)}</div>{!categories.length && !adding && <p className="mt-6 text-slate-400">Aucune catégorie. Ajoutez votre première catégorie pour créer des services.</p>}</>;
}
