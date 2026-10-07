import { getCatalogue } from "@/lib/catalogue/server";
import { CatalogueNotice, StoreFooter, StoreHeader } from "@/components/storefront";
import CatalogueGrid from "./catalogue";
export async function generateMetadata() { const { settings } = await getCatalogue(); const title = `Boutique — ${settings.name}`; const description = `Services, abonnements et produits disponibles chez ${settings.name}.`; return { title, description, openGraph: { title, description, locale: "fr_SN", type: "website" } }; }
export default async function BoutiquePage() {
  const catalogue = await getCatalogue();
  return <main className="min-h-screen bg-[#050816] text-white"><StoreHeader settings={catalogue.settings} /><CatalogueNotice catalogue={catalogue} />
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Boutique {catalogue.settings.name}</p><h1 className="mt-4 text-3xl font-black sm:text-5xl">Choisissez votre prochaine offre</h1><p className="mb-10 mt-4 max-w-2xl leading-7 text-slate-400">Consultez les tarifs et les détails, puis commandez avec Wave ou Orange Money. Notre équipe vous accompagne sur WhatsApp.</p><CatalogueGrid catalogue={catalogue} /></section><StoreFooter settings={catalogue.settings} /></main>;
}
