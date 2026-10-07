"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { effectivePrice, formatPrice } from "@/lib/catalogue/domain";
import type { Category, MutationResult, Service } from "@/lib/catalogue/types";
import { archiveService, saveServicePrice } from "../catalogue-actions";
import { AdminPageHeading, Feedback, Label, Toggle } from "../catalogue-ui";
import ServiceEditor, { emptyService } from "./service-editor";

function QuickPrice({ service, onSaved }: { service: Service; onSaved: (message: string) => void }) {
  const [price, setPrice] = useState(service.price === null ? "" : String(service.price)); const [oldPrice, setOldPrice] = useState(service.old_price === null ? "" : String(service.old_price));
  const [enabled, setEnabled] = useState(service.promotion_enabled); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [result, setResult] = useState<MutationResult | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setResult(null);
    try { const response = await saveServicePrice(service.id, service.updated_at!, price === "" ? null : Number(price), oldPrice === "" ? null : Number(oldPrice), enabled); setResult(response); if (response.ok) onSaved(response.message); }
    catch { setResult({ ok: false, message: "Connexion interrompue. Réessayez." }); } finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit}><fieldset disabled={busy} className="grid min-w-0 gap-3 sm:grid-cols-2"><Label title={`Prix actuel / promotionnel de ${service.name} (FCFA)`}><input className="field" type="number" inputMode="numeric" min={1} step={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Sur demande" /></Label><Label title={`Prix normal / barré de ${service.name} (facultatif)`}><input className="field" type="number" inputMode="numeric" min={0} step={1} value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} /></Label><Toggle title="Promotion activée" checked={enabled} onChange={setEnabled} /><button type="submit" className="btn-primary">{busy ? "Enregistrement…" : "Enregistrer le prix"}</button></fieldset><Feedback result={result} /></form>;
}
export default function ServicesManager({ services, categories, promotionsOnly = false, now }: { services: Service[]; categories: Category[]; promotionsOnly?: boolean; now: string }) {
  const router = useRouter(); const [search, setSearch] = useState(""); const [editor, setEditor] = useState<Service | null>(null);
  const [result, setResult] = useState<MutationResult | null>(null); const [busyId, setBusyId] = useState<string | null>(null); const lock = useRef(false);
  const [confirmation, setConfirmation] = useState<Service | null>(null);
  const filtered = services.filter((s) => (!promotionsOnly || s.old_price !== null || s.promotion_enabled) && s.name.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")));
  function saved(message: string) { setResult({ ok: true, message }); setEditor(null); router.refresh(); }
  async function archive(service: Service) {
    if (lock.current) return;
    setConfirmation(null);
    lock.current = true; setBusyId(service.id); setResult(null);
    try { const response = await archiveService(service.id, service.updated_at!, !service.archived_at); setResult(response); if (response.ok) router.refresh(); }
    catch { setResult({ ok: false, message: "Impossible d’enregistrer l’archivage." }); } finally { lock.current = false; setBusyId(null); }
  }
  return <><AdminPageHeading title={promotionsOnly ? "Promotions" : "Services et produits"} description={promotionsOnly ? "Gérez les prix promotionnels, les prix normaux et leurs dates. Les promotions expirées repassent automatiquement au prix normal." : "Modifiez les prix ici : les pages publiques et les nouvelles commandes utilisent automatiquement le catalogue à jour."}>
    <button type="button" className="btn-primary" disabled={!categories.length || busyId !== null} onClick={() => setEditor(emptyService(categories[0]?.id ?? ""))}>Ajouter un service</button></AdminPageHeading><Feedback result={result} />
    {confirmation && <div role="alert" className="my-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5"><p className="font-bold">{confirmation.archived_at ? `Restaurer et activer ${confirmation.name} ?` : `Archiver ${confirmation.name} ?`}</p><p className="mt-3 text-sm">Les commandes historiques seront conservées.{!confirmation.archived_at && " Le service sera retiré du catalogue public."}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="btn-primary" disabled={busyId !== null} onClick={() => void archive(confirmation)}>{confirmation.archived_at ? "Confirmer la restauration" : "Confirmer l’archivage"}</button><button type="button" className="btn-secondary" onClick={() => setConfirmation(null)}>Annuler</button></div></div>}
    {editor && <div className="my-6"><ServiceEditor key={`${editor.id}:${editor.updated_at}`} service={editor} categories={categories} onSaved={saved} onCancel={() => setEditor(null)} /></div>}
    <Label title="Rechercher un service"><input className="field" type="search" value={search} onChange={(e) => setSearch(e.target.value)} /></Label><p className="mt-3 text-sm text-slate-400">{filtered.length} service(s) · {services.filter((s) => s.is_active && !s.archived_at).length} actif(s)</p>
    {promotionsOnly && <p className="mt-4 text-sm text-slate-400">Pour ajouter une promotion, ouvrez un service depuis <Link className="text-blue-300 underline" href="/admin/services">Services</Link>, renseignez son prix normal et son prix promotionnel.</p>}
    <div className="mt-6 space-y-5">{filtered.map((s) => <article key={`${s.id}:${s.updated_at}`} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5"><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-black">{s.name}</h2><p className="mt-2 text-sm text-slate-400">{categories.find((c) => c.id === s.category_id)?.name} · {s.billing_period} · {s.archived_at ? "Archivé" : s.is_active ? "Actif" : "Désactivé"}</p><p className="mt-2 font-bold text-blue-300">Prix affiché : {formatPrice(effectivePrice(s, now))}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busyId !== null} className="btn-secondary" onClick={() => setEditor(s)}>Modifier</button><button type="button" disabled={busyId !== null} className="btn-secondary" onClick={() => setConfirmation(s)}>{busyId === s.id ? "Enregistrement…" : s.archived_at ? "Restaurer" : "Archiver"}</button></div></div><QuickPrice service={s} onSaved={saved} /></article>)}</div>
    {!filtered.length && <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-6 text-center text-slate-400">Aucun service à afficher.</p>}
    {!categories.length && <p className="mt-5 text-sm text-amber-200">Ajoutez une catégorie avant votre premier service.</p>}
  </>;
}
