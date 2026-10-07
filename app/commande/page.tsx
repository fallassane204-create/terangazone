import { getCatalogue } from "@/lib/catalogue/server";
import { CatalogueNotice, StoreFooter, StoreHeader } from "@/components/storefront";
import OrderForm from "./order-form";
export async function generateMetadata() { const { settings } = await getCatalogue(); return { title: `Commande — ${settings.name}`, robots: { index: false } }; }
export default async function CommandePage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const catalogue = await getCatalogue(); const { service } = await searchParams;
  const available = catalogue.services.filter((s) => s.whatsapp_enabled && s.price !== null && s.price > 0 && (s.kind !== "physical" || s.stock !== 0));
  const selected = service ? available.find((s) => s.id === service || s.slug === service || s.name === service) : available[0];
  return <main className="min-h-screen"><StoreHeader settings={catalogue.settings} /><CatalogueNotice catalogue={catalogue} />
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-400">Commander</p><h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Votre commande, en toute simplicité</h1><p className="mt-5 text-lg leading-8 text-slate-400">Choisissez une offre, renseignez vos informations puis échangez avec notre équipe sur WhatsApp.</p><ol className="mt-8 space-y-4">{["Vérifiez l’offre et son prix", "Payez uniquement au numéro officiel affiché", "Envoyez votre preuve dans WhatsApp", "Recevez les accès ou les instructions de livraison"].map((step, i) => <li key={step} className="flex gap-4 rounded-2xl border border-white/10 p-4"><span className="font-black text-blue-300">{i + 1}</span><span className="text-sm leading-6 text-slate-300">{step}</span></li>)}</ol></div><OrderForm key={selected?.id ?? 'missing'} catalogue={catalogue} selectedId={selected?.id ?? ''} /></section><StoreFooter settings={catalogue.settings} /></main>;
}
