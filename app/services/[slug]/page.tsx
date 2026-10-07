import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogue } from "@/lib/catalogue/server";
import { CatalogueNotice, ServicePrice, StoreFooter, StoreHeader } from "@/components/storefront";
import { ProductImage } from "@/components/product-image";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const catalogue = await getCatalogue(); const service = catalogue.services.find((s) => s.slug === slug);
  const title = service ? `${service.name} — ${catalogue.settings.name}` : "Offre introuvable";
  return service ? { title, description: service.short_description, openGraph: { title, description: service.short_description, locale: "fr_SN", type: "website" } } : { title, robots: { index: false } };
}
export default async function ServicePage({ params }: Props) {
  const { slug } = await params; const catalogue = await getCatalogue(); const service = catalogue.services.find((s) => s.slug === slug);
  if (!service) notFound();
  const available = service.price !== null && service.price > 0 && service.whatsapp_enabled && (service.kind !== "physical" || service.stock !== 0);
  return <main className="min-h-screen"><StoreHeader settings={catalogue.settings} /><CatalogueNotice catalogue={catalogue} />
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><Link href="/boutique" className="text-sm font-bold text-blue-300">← Retour à la boutique</Link><div className="mt-8 grid gap-8 md:grid-cols-2"><ProductImage key={service.image_url} src={service.image_url} name={service.name} icon={service.icon} large />
      <div><p className="text-sm text-blue-300">{catalogue.categories.find((c) => c.id === service.category_id)?.name}</p><h1 className="mt-3 text-4xl font-black">{service.name}</h1><ServicePrice service={service} now={catalogue.now} className="mt-6" /><p className="mt-5 text-sm text-emerald-300">{available ? "Disponible à la commande" : "Actuellement indisponible"}</p><p className="mt-6 whitespace-pre-line leading-8 text-slate-300">{service.description}</p>
        {service.variant_label && <p className="mt-4 text-sm text-slate-400">Variante : {service.variant_label}</p>}{service.kind === "physical" && <p className="mt-4 text-sm text-slate-400">{service.stock !== null ? `Stock disponible : ${service.stock}${service.unit ? ` ${service.unit}` : ""}` : "Disponibilité à confirmer"}</p>}
        {service.order_instructions && <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-400/5 p-4"><p className="font-bold">Avant de commander</p><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-300">{service.order_instructions}</p></div>}<p className="mt-6 text-sm leading-7 text-slate-400">{service.delivery_info || catalogue.settings.delivery_info}</p>{available && <Link href={`/commande?service=${service.id}`} className="btn-primary mt-7 inline-flex">{service.button_text} →</Link>}
      </div></div></section><StoreFooter settings={catalogue.settings} /></main>;
}
