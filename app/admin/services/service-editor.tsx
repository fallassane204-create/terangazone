"use client";
import { FormEvent, useRef, useState } from "react";
import type { Category, MutationResult, Service } from "@/lib/catalogue/types";
import { saveService, saveServiceWithImage } from "../catalogue-actions";
import { Feedback, Label, Toggle } from "../catalogue-ui";
import ImagePicker from "./image-picker";

export function emptyService(categoryId: string): Service {
  return { id: "", name: "", slug: "", category_id: categoryId, description: "", short_description: "", price: null,
    old_price: null, promotion_enabled: false, promotion_start: null, promotion_end: null, billing_period: "1 mois",
    image_url: null, icon: "TZ", is_active: true, is_featured: false, sort_order: 0, whatsapp_enabled: true,
    button_text: "Commander", order_instructions: "", order_fields: [], kind: "digital", stock: null, unit: "", variant_label: "", delivery_info: "",
    archived_at: null, created_at: null, updated_at: null };
}
// Le contrôle HTML est exprimé en UTC pour éviter un décalage lors des échanges
// entre appareils. L'interface indique ce fuseau explicitement.
const dateInput = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : "";
const dateValue = (value: string) => value ? `${value}:00.000Z` : null;
export default function ServiceEditor({ service, categories, onSaved, onCancel }: { service: Service; categories: Category[]; onSaved: (message: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(service); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [result, setResult] = useState<MutationResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  function set<K extends keyof Service>(key: K, value: Service[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setResult(null);
    try { const form = new FormData(); if (imageFile) form.set("image", imageFile); const response = imageFile ? await saveServiceWithImage(draft, form) : await saveService(draft); setResult(response); if (response.ok) onSaved(response.message); }
    catch { setResult({ ok: false, message: "Connexion interrompue. Réessayez." }); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-[28px] border border-blue-400/30 bg-[#0b1020] p-5 sm:p-7">
    <h2 className="mb-6 text-xl font-black">{service.id ? `Modifier ${service.name}` : "Ajouter un service ou un produit"}</h2>
    <fieldset disabled={busy} className="min-w-0 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2"><Label title="Nom"><input className="field" value={draft.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} /></Label><Label title="Identifiant de la fiche (ex. chatgpt)"><input className="field" value={draft.slug} onChange={(e) => set("slug", e.target.value)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} /></Label>
        <Label title="Catégorie"><select className="field" value={draft.category_id} onChange={(e) => set("category_id", e.target.value)} required><option value="">Choisir une catégorie</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active ? "" : " (désactivée)"}</option>)}</select></Label>
        <Label title="Type"><select className="field" value={draft.kind} onChange={(e) => set("kind", e.target.value as Service["kind"])}><option value="digital">Service numérique</option><option value="subscription">Abonnement</option><option value="physical">Produit physique</option></select></Label></div>
      <div className="grid gap-5 sm:grid-cols-2"><Label title="Prix actuel / promotionnel (FCFA) — vide : sur demande"><input className="field" type="number" inputMode="numeric" min={1} step={1} value={draft.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))} /></Label><Label title="Prix normal / barré (FCFA) — facultatif"><input className="field" type="number" inputMode="numeric" min={0} step={1} value={draft.old_price ?? ""} onChange={(e) => set("old_price", e.target.value === "" ? null : Number(e.target.value))} /></Label></div>
      <p className="text-sm leading-6 text-slate-400">Sans prix normal, le prix actuel s’applique. Avec un prix normal, le prix promotionnel s’applique uniquement lorsque la promotion est activée et dans sa période ; sinon, le prix normal s’applique. Modifier l’identifiant de la fiche change son adresse publique.</p>
      <Toggle title="Activer la promotion" checked={draft.promotion_enabled} onChange={(v) => set("promotion_enabled", v)} />
      <div className="grid gap-5 sm:grid-cols-2"><Label title="Début de promotion (UTC / Dakar) — facultatif"><input className="field" type="datetime-local" value={dateInput(draft.promotion_start)} onChange={(e) => set("promotion_start", dateValue(e.target.value))} /></Label><Label title="Fin de promotion (UTC / Dakar) — facultatif"><input className="field" type="datetime-local" value={dateInput(draft.promotion_end)} onChange={(e) => set("promotion_end", dateValue(e.target.value))} /></Label></div>
      <Label title="Résumé affiché dans le catalogue"><textarea className="field" rows={2} maxLength={300} value={draft.short_description} onChange={(e) => set("short_description", e.target.value)} /></Label><Label title="Description complète"><textarea className="field" rows={5} maxLength={10000} value={draft.description} onChange={(e) => set("description", e.target.value)} /></Label>
      <div className="grid gap-5 sm:grid-cols-2"><Label title="Image : URL HTTPS ou chemin local"><input className="field" value={draft.image_url ?? ""} onChange={(e) => set("image_url", e.target.value || null)} maxLength={2000} placeholder="https://…" /></Label><Label title="Icône de secours (8 caractères max.)"><input className="field" maxLength={8} value={draft.icon} onChange={(e) => set("icon", e.target.value)} /></Label></div>
      <ImagePicker src={draft.image_url} name={draft.name || "Aperçu"} file={imageFile} onChange={setImageFile} />
      <div className="grid gap-5 sm:grid-cols-3"><Label title="Durée / période"><input className="field" list="periods" value={draft.billing_period} required maxLength={100} onChange={(e) => set("billing_period", e.target.value)} /><datalist id="periods"><option value="1 mois" /><option value="1 an" /><option value="Service" /><option value="Sur demande" /><option value="À l’unité" /></datalist></Label><Label title="Ordre d’affichage"><input className="field" type="number" min={0} step={1} value={draft.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} required /></Label><Label title="Texte du bouton"><input className="field" value={draft.button_text} onChange={(e) => set("button_text", e.target.value)} required maxLength={80} /></Label></div>
      <div className="grid gap-3 sm:grid-cols-3"><Toggle title="Service actif" checked={draft.is_active} onChange={(v) => set("is_active", v)} /><Toggle title="Produit vedette" checked={draft.is_featured} onChange={(v) => set("is_featured", v)} /><Toggle title="Commandes WhatsApp autorisées" checked={draft.whatsapp_enabled} onChange={(v) => set("whatsapp_enabled", v)} /></div>
      <Label title="Instructions avant commande"><textarea className="field" rows={3} maxLength={2000} value={draft.order_instructions} onChange={(e) => set("order_instructions", e.target.value)} /></Label>
      <div className="space-y-3"><h3 className="font-bold">Informations supplémentaires demandées au client</h3><p className="text-sm leading-6 text-slate-400">Ex. adresse de livraison ou e-mail de réception. Ne demandez jamais de mot de passe ni de code de paiement.</p>
        {draft.order_fields.map((field, i) => <div key={i} className="rounded-2xl border border-white/10 p-4"><div className="grid gap-3 sm:grid-cols-2">{[["key", "Clé unique (ex. adresse)"], ["label", "Libellé"], ["placeholder", "Exemple"]].map(([key, title]) => <Label key={key} title={title}><input className="field" value={field[key as "key" | "label" | "placeholder"]} onChange={(e) => set("order_fields", draft.order_fields.map((f, index) => index === i ? { ...f, [key]: e.target.value } : f))} required={key !== "placeholder"} maxLength={key === "key" ? 40 : 120} /></Label>)}<Label title="Format"><select className="field" value={field.type} onChange={(e) => set("order_fields", draft.order_fields.map((f, index) => index === i ? { ...f, type: e.target.value as "text" | "email" | "tel" } : f))}><option value="text">Texte</option><option value="email">E-mail</option><option value="tel">Téléphone</option></select></Label></div><div className="mt-3 flex flex-wrap items-center gap-3"><Toggle title="Champ obligatoire" checked={field.required} onChange={(v) => set("order_fields", draft.order_fields.map((f, index) => index === i ? { ...f, required: v } : f))} /><button type="button" onClick={() => set("order_fields", draft.order_fields.filter((_, index) => index !== i))} className="btn-secondary">Retirer ce champ</button></div></div>)}
        <button type="button" disabled={draft.order_fields.length >= 8} className="btn-secondary" onClick={() => set("order_fields", [...draft.order_fields, { key: "", label: "", type: "text", required: false, placeholder: "" }])}>Ajouter un champ</button>
      </div>
      {draft.kind === "physical" && <div className="grid gap-5 sm:grid-cols-3"><Label title="Stock (vide : non suivi)"><input className="field" type="number" min={0} step={1} value={draft.stock ?? ""} onChange={(e) => set("stock", e.target.value === "" ? null : Number(e.target.value))} /></Label><Label title="Unité (ex. sachet)"><input className="field" value={draft.unit} onChange={(e) => set("unit", e.target.value)} maxLength={60} /></Label><Label title="Variante (ex. poudre)"><input className="field" value={draft.variant_label} onChange={(e) => set("variant_label", e.target.value)} maxLength={100} /></Label></div>}
      <Label title="Informations de réception / livraison propres à cette offre"><textarea className="field" rows={3} maxLength={2000} value={draft.delivery_info} onChange={(e) => set("delivery_info", e.target.value)} /></Label>
      <div className="flex flex-wrap gap-3"><button type="submit" className="btn-primary">{busy ? "Enregistrement…" : "Enregistrer le service"}</button><button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button></div>
    </fieldset><Feedback result={result} />
  </form>;
}
