"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MutationResult, ShopSettings } from "@/lib/catalogue/types";
import { saveShopSettings } from "../catalogue-actions";
import { AdminPageHeading, Feedback, Label } from "../catalogue-ui";
import { ProductImage } from "@/components/product-image";
function SettingsForm({ settings, onSaved, savedResult }: { settings: ShopSettings; onSaved: (message: string) => void; savedResult: MutationResult | null }) {
  const [draft, setDraft] = useState(settings); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [result, setResult] = useState<MutationResult | null>(null);
  const [confirmation, setConfirmation] = useState<ShopSettings | null>(null);
  function set<K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) { setConfirmation(null); setDraft((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    if (draft.whatsapp_number !== settings.whatsapp_number || draft.wave_number !== settings.wave_number || draft.orange_money_number !== settings.orange_money_number) { setConfirmation(draft); return; }
    await persist(draft);
  }
  async function persist(values: ShopSettings) {
    if (lock.current) return;
    setConfirmation(null);
    lock.current = true; setBusy(true); setResult(null);
    try { const response = await saveShopSettings(values); setResult(response); if (response.ok) onSaved(response.message); }
    catch { setResult({ ok: false, message: "Connexion interrompue. Réessayez." }); } finally { lock.current = false; setBusy(false); }
  }
  return <><AdminPageHeading title="Paramètres de la boutique" description="Ces informations sont publiques. Ne renseignez ici aucune clé, aucun mot de passe ou code de paiement." />
    <Feedback result={savedResult} />
    <form onSubmit={submit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-7"><fieldset disabled={busy} className="min-w-0 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2"><Label title="Nom de la boutique"><input className="field" value={draft.name} required maxLength={100} onChange={(e) => set("name", e.target.value)} /></Label><Label title="WhatsApp (indicatif international compris)"><input className="field" type="tel" inputMode="tel" value={draft.whatsapp_number} required maxLength={30} onChange={(e) => set("whatsapp_number", e.target.value)} /></Label><Label title="E-mail public (facultatif)"><input className="field" type="email" value={draft.email} maxLength={200} onChange={(e) => set("email", e.target.value)} /></Label><Label title="Logo : URL HTTPS ou chemin local"><input className="field" value={draft.logo_url ?? ""} maxLength={2000} onChange={(e) => set("logo_url", e.target.value || null)} /></Label></div>
      {draft.logo_url && <div className="max-w-xs"><ProductImage key={draft.logo_url} src={draft.logo_url} name={draft.name} /></div>}
      <Label title="Texte de bienvenue sur l’accueil"><textarea className="field" rows={3} value={draft.welcome_text} required maxLength={1000} onChange={(e) => set("welcome_text", e.target.value)} /></Label>
      <h2 className="font-black">Paiement Wave</h2><div className="grid gap-5 sm:grid-cols-2"><Label title="Numéro Wave"><input className="field" type="tel" inputMode="tel" value={draft.wave_number} required maxLength={30} onChange={(e) => set("wave_number", e.target.value)} /></Label><Label title="Titulaire Wave"><input className="field" value={draft.wave_name} required maxLength={120} onChange={(e) => set("wave_name", e.target.value)} /></Label></div>
      <h2 className="font-black">Paiement Orange Money</h2><div className="grid gap-5 sm:grid-cols-2"><Label title="Numéro Orange Money"><input className="field" type="tel" inputMode="tel" value={draft.orange_money_number} required maxLength={30} onChange={(e) => set("orange_money_number", e.target.value)} /></Label><Label title="Titulaire Orange Money"><input className="field" value={draft.orange_money_name} required maxLength={120} onChange={(e) => set("orange_money_name", e.target.value)} /></Label></div>
      <Label title="Informations de réception / livraison"><textarea className="field" rows={4} value={draft.delivery_info} maxLength={2000} onChange={(e) => set("delivery_info", e.target.value)} /></Label>
      <div className="space-y-4"><h2 className="font-black">Réseaux sociaux</h2>{draft.social_links.map((link, i) => <div key={i} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2"><Label title="Nom du réseau"><input className="field" required value={link.label} maxLength={60} onChange={(e) => set("social_links", draft.social_links.map((l, index) => index === i ? { ...l, label: e.target.value } : l))} /></Label><Label title="Lien HTTPS"><input className="field" type="url" required value={link.url} maxLength={2000} onChange={(e) => set("social_links", draft.social_links.map((l, index) => index === i ? { ...l, url: e.target.value } : l))} /></Label><button type="button" className="btn-secondary sm:col-span-2" onClick={() => set("social_links", draft.social_links.filter((_, index) => index !== i))}>Retirer ce lien</button></div>)}<button type="button" className="btn-secondary" disabled={draft.social_links.length >= 8} onClick={() => set("social_links", [...draft.social_links, { label: "", url: "" }])}>Ajouter un réseau</button></div>
      <button type="submit" className="btn-primary">{busy ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
    </fieldset>{confirmation && <div role="alert" className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5"><p className="font-bold">Confirmer les nouvelles coordonnées publiques ?</p><p className="mt-3 text-sm leading-7">WhatsApp : {confirmation.whatsapp_number}<br />Wave : {confirmation.wave_number}<br />Orange Money : {confirmation.orange_money_number}</p><p className="mt-3 text-sm">Ces numéros seront affichés à tous les clients. Vérifiez-les avant de confirmer.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="btn-primary" disabled={busy} onClick={() => void persist(confirmation)}>Confirmer les coordonnées</button><button type="button" className="btn-secondary" onClick={() => setConfirmation(null)}>Annuler</button></div></div>}<Feedback result={result} /></form></>;
}
export default function SettingsEditor({ settings }: { settings: ShopSettings }) {
  const router = useRouter(); const [result, setResult] = useState<MutationResult | null>(null);
  return <SettingsForm key={settings.updated_at} settings={settings} savedResult={result} onSaved={(message) => { setResult({ ok: true, message }); router.refresh(); }} />;
}
