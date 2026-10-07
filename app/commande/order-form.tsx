"use client";
import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Catalogue, CustomerOrder } from "@/lib/catalogue/types";
import { effectivePrice, formatPrice, validateCustomerOrder } from "@/lib/catalogue/domain";
import { ServicePrice } from "@/components/storefront";
import { ProductImage } from "@/components/product-image";
import { submitOrder } from "./actions";

export default function OrderForm({ catalogue, selectedId }: { catalogue: Catalogue; selectedId: string }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(selectedId);
  const service = catalogue.services.find((s) => s.id === serviceId);
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Wave" | "Orange Money">("Wave");
  const [paymentPhone, setPaymentPhone] = useState(""); const [reference, setReference] = useState("");
  const [notes, setNotes] = useState(""); const [quantity, setQuantity] = useState(1);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [url, setUrl] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(() => ({ service_id: selectedId,
    service_updated_at: service?.updated_at ?? null, settings_updated_at: catalogue.settings.updated_at,
    price: service ? effectivePrice(service, catalogue.now) : null }));
  const request = useRef<{ signature: string; id: string } | null>(null);
  if (!service) return <div className="rounded-3xl border border-white/10 p-6"><h2 className="text-xl font-black">Offre indisponible</h2><p className="mt-3 text-slate-400">Choisissez une offre disponible dans la boutique.</p><Link href="/boutique" className="btn-primary mt-5 inline-flex">Retour à la boutique</Link></div>;
  const price = effectivePrice(service, catalogue.now);
  const changed = acknowledged.service_id !== service.id || acknowledged.service_updated_at !== service.updated_at ||
    acknowledged.settings_updated_at !== catalogue.settings.updated_at || acknowledged.price !== price;
  const needsPayment = catalogue.source === "supabase" && price !== null && price > 0;
  const paymentAccount = paymentMethod === "Wave" ? catalogue.settings.wave_number : catalogue.settings.orange_money_number;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || recorded || !service) return;
    setMessage(""); setError(""); setUrl("");
    if (changed) { setError("L’offre ou les coordonnées ont changé. Vérifiez les nouvelles informations. Si vous avez déjà payé, contactez la boutique sans payer une seconde fois."); return; }
    const values: Omit<CustomerOrder, "request_id"> = { service_id: service.id, expected_price: price,
      service_updated_at: service.updated_at, settings_updated_at: catalogue.settings.updated_at,
      customer_name: name, customer_phone: phone, payment_method: paymentMethod, payment_phone: paymentPhone,
      payment_reference: reference, notes, quantity, fields };
    try {
      validateCustomerOrder({ ...values, request_id: "" }, service, needsPayment);
      const signature = JSON.stringify(values);
      if (!request.current || request.current.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
      busyRef.current = true; setBusy(true);
      const result = await submitOrder({ ...values, request_id: request.current.id });
      if (result.whatsapp_url) setUrl(result.whatsapp_url);
      if (!result.ok) { setError(result.message); return; }
      setMessage(result.message); setRecorded(Boolean(result.recorded));
      if (result.whatsapp_url) window.location.assign(result.whatsapp_url);
    } catch (error) { setError(error instanceof Error ? error.message : "Connexion interrompue. Réessayez avec les mêmes informations."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-8">
    <fieldset disabled={busy || recorded} className="min-w-0 space-y-6 disabled:opacity-70">
      <label className="block"><span className="label">Service ou produit</span><select className="field" value={serviceId} onChange={(e) => { const next = catalogue.services.find((s) => s.id === e.target.value); setServiceId(e.target.value); setAcknowledged({ service_id: e.target.value, service_updated_at: next?.updated_at ?? null, settings_updated_at: catalogue.settings.updated_at, price: next ? effectivePrice(next, catalogue.now) : null }); setFields({}); setQuantity(1); setUrl(""); setMessage(""); setError(""); }}>
        {catalogue.services.filter((s) => s.whatsapp_enabled && s.price !== null && s.price > 0 && (s.kind !== "physical" || s.stock !== 0)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="label">Votre nom</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" /></label><label className="block"><span className="label">Votre téléphone</span><input className="field" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={25} placeholder="77 000 00 00 ou +221…" /></label></div>
      {service.kind === "physical" && <label className="block"><span className="label">Quantité{service.unit ? ` (${service.unit})` : ""}</span><input className="field" type="number" inputMode="numeric" min={1} max={Math.min(service.stock ?? 99, 99)} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required /></label>}
      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5"><div className="mb-4 max-w-sm"><ProductImage src={service.image_url} name={service.name} /></div><p className="font-black">{service.name}</p><ServicePrice service={service} now={catalogue.now} className="mt-3" />{quantity > 1 && <p className="mt-4 font-bold text-blue-200">Total : {formatPrice(price === null ? null : price * quantity)}</p>}{service.order_instructions && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">{service.order_instructions}</p>}
        <p className="mt-4 text-sm leading-6 text-slate-400">{service.delivery_info || catalogue.settings.delivery_info}</p>
        <p className="mt-3 text-sm leading-6 text-blue-200">{service.kind === "physical" ? "Pour la livraison, indiquez votre adresse et votre quartier. Confirmez les frais et le délai avec notre équipe avant le paiement." : "Après confirmation de votre paiement, notre équipe vous transmet vos accès ou les instructions d’activation sur WhatsApp."}</p>
      </div>
      {changed && <div role="alert" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-200"><p>L’offre ou les coordonnées de paiement ont changé. Vérifiez les informations actualisées. Si vous avez déjà payé, contactez la boutique sans payer une seconde fois.</p><button type="button" className="btn-secondary mt-3" onClick={() => { setAcknowledged({ service_id: service.id, service_updated_at: service.updated_at, settings_updated_at: catalogue.settings.updated_at, price }); setFields((current) => Object.fromEntries(Object.entries(current).filter(([key]) => service.order_fields.some((field) => field.key === key)))); setError(""); }}>J’ai vérifié les nouvelles informations</button></div>}
      {service.order_fields.map((field) => <label className="block" key={field.key}><span className="label">{field.label}{field.required ? " *" : " (facultatif)"}</span><input className="field" type={field.type} inputMode={field.type === "tel" ? "tel" : undefined} autoComplete="off" required={field.required} maxLength={500} value={fields[field.key] ?? ""} placeholder={field.placeholder} onChange={(e) => setFields((current) => ({ ...current, [field.key]: e.target.value }))} /></label>)}
      {needsPayment ? <><label className="block"><span className="label">Moyen de paiement</span><select className="field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "Wave" | "Orange Money")}><option>Wave</option><option>Orange Money</option></select></label>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Numéro officiel {paymentMethod}</p><p className="mt-2 text-2xl font-black">{paymentAccount}</p><p className="mt-2 text-sm text-slate-400">Titulaire : {paymentMethod === "Wave" ? catalogue.settings.wave_name : catalogue.settings.orange_money_name}</p><p className="mt-3 text-sm text-emerald-200">Vérifiez ces coordonnées avant chaque paiement.</p></div>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="label">Numéro utilisé pour payer</span><input className="field" type="tel" inputMode="tel" autoComplete="tel" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} required maxLength={25} /></label><label className="block"><span className="label">Référence de transaction (facultatif)</span><input className="field" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={150} /></label></div>
      </> : <p className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-200">Demandez confirmation sur WhatsApp avant de payer. Aucun paiement n’est demandé à cette étape.</p>}
      <label className="block"><span className="label">Précisions (facultatif)</span><textarea className="field" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} /></label>
      <button type="submit" disabled={changed} className="btn-primary w-full">{busy ? "Enregistrement…" : needsPayment ? "Enregistrer et envoyer la preuve" : "Confirmer l’offre sur WhatsApp"}</button>
    </fieldset>
    {error && <p role="alert" className="mt-5 rounded-2xl bg-red-400/10 p-4 text-sm leading-6 text-red-200">{error}</p>}
    {message && <p role="status" className="mt-5 rounded-2xl bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-200">{message}</p>}
    {url && <a className="btn-secondary mt-5 flex justify-center" href={url}>Continuer sur WhatsApp</a>}
    {error && <button type="button" disabled={busy} onClick={() => router.refresh()} className="mt-4 text-sm font-bold text-blue-300 underline">Actualiser l’offre et les coordonnées</button>}
  </form>;
}
