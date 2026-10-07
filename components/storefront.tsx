import Link from "next/link";
import { formatPrice, effectivePrice, promotionActive, whatsappLink } from "@/lib/catalogue/domain";
import type { Catalogue, Service, ShopSettings } from "@/lib/catalogue/types";
import { ProductImage } from "./product-image";
import { CatalogueRefresh } from "./catalogue-refresh";
export function Brand({ settings }: { settings: ShopSettings }) {
  return <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${settings.name} — Accueil`}>
    {settings.logo_url ? <span className="w-12 shrink-0"><ProductImage key={settings.logo_url} src={settings.logo_url} name={settings.name} compact /></span> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-black">TZ</span>}
    <span className="min-w-0"><span className="block text-xl font-black">{settings.name}</span><span className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Services & produits</span></span>
  </Link>;
}
export function StoreHeader({ settings }: { settings: ShopSettings }) {
  return <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050816]/95 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
    <Brand settings={settings} /><nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-2 text-sm font-bold"><Link href="/boutique" className="rounded-xl border border-white/15 px-3 py-3 hover:bg-white/10">Boutique</Link>
      <a href={whatsappLink(settings.whatsapp_number, `Bonjour ${settings.name}, je souhaite connaître vos offres.`)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-500/15 px-3 py-3 text-emerald-300 hover:bg-emerald-500/25">WhatsApp</a></nav></div></header>;
}
export function CatalogueNotice({ catalogue }: { catalogue: Catalogue }) {
  const nextPromotionChange = catalogue.services.flatMap((service) => service.promotion_enabled ? [service.promotion_start, service.promotion_end] : [])
    .filter((date): date is string => Boolean(date) && Date.parse(date!) > Date.parse(catalogue.now)).sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
  return catalogue.source !== "supabase" ? <p role="status" className="border-b border-amber-400/15 bg-amber-400/5 px-4 py-3 text-center text-sm text-amber-200">{catalogue.source === "initial" ? "Aperçu local — tarifs indicatifs : confirmez le prix et la disponibilité avant tout paiement." : "Le catalogue est momentanément indisponible. Réessayez dans quelques instants avant de commander."}</p> : <CatalogueRefresh revision={catalogue.revision} nextPromotionChange={nextPromotionChange} />;
}
export function ServicePrice({ service, now, className = "" }: { service: Service; now: string; className?: string }) {
  return <div className={className}>{promotionActive(service, now) && <div className="mb-1 text-sm text-slate-400"><span className="sr-only">Prix normal : </span><del>{formatPrice(service.old_price)}</del></div>}<p className="text-2xl font-black text-blue-300">{formatPrice(effectivePrice(service, now))}</p><p className="mt-1 text-xs text-slate-400">{service.billing_period}{service.unit ? ` · ${service.unit}` : ""}</p></div>;
}
export function ServiceCard({ service, category, now }: { service: Service; category?: string; now: string }) {
  const available = service.whatsapp_enabled && service.price !== null && service.price > 0 && (service.kind !== "physical" || service.stock !== 0);
  return <article className="flex min-w-0 flex-col rounded-[28px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-blue-400/40"><Link href={`/services/${service.slug}`} aria-label={`Découvrir ${service.name}`}><ProductImage key={service.image_url} src={service.image_url} name={service.name} icon={service.icon} /></Link>
    <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="text-slate-400">{category}</span>{promotionActive(service, now) && <span className="rounded-full bg-emerald-400/10 px-2 text-emerald-300">Promotion</span>}{service.is_featured && <span className="text-blue-300">Produit vedette</span>}</div>
    <h2 className="mt-2 text-xl font-black"><Link href={`/services/${service.slug}`}>{service.name}</Link></h2><p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{service.short_description}</p><ServicePrice service={service} now={now} className="mt-5" />
    <div className="mt-5 flex flex-wrap gap-2"><Link href={`/services/${service.slug}`} className="rounded-xl border border-white/15 px-3 py-3 text-sm font-bold hover:bg-white/10">Détails</Link>{available ? <Link href={`/commande?service=${service.id}`} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-3 text-center text-sm font-bold">{service.button_text}</Link> : <span className="flex-1 rounded-xl bg-white/5 px-3 py-3 text-center text-sm text-slate-400">Indisponible</span>}</div>
  </article>;
}
export function StoreFooter({ settings }: { settings: ShopSettings }) {
  return <footer className="border-t border-white/10 bg-black/20"><div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8 px-5 py-10"><div><p className="text-xl font-black">{settings.name}</p><p className="mt-2 max-w-md text-sm text-slate-400">{settings.delivery_info}</p></div><nav aria-label="Liens utiles" className="flex flex-wrap gap-5 text-sm text-slate-300"><Link href="/">Accueil</Link><Link href="/boutique">Boutique</Link>{settings.email && <a href={`mailto:${settings.email}`}>E-mail</a>}{settings.social_links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</nav><p className="text-sm text-slate-500">© {new Date().getUTCFullYear()} {settings.name}</p></div></footer>;
}
