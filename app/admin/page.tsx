import Link from "next/link";
import { loadAdminCatalogue } from "./catalogue-actions";
import OrdersDashboard from "./orders-dashboard";
export default async function AdminPage() {
  const catalogue = await loadAdminCatalogue();
  return <>{catalogue.error ? <div role="status" className="mx-4 mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">Statistiques du catalogue indisponibles. <Link className="underline" href="/admin/services">Vérifier les services</Link>.</div> : <div className="mx-auto grid max-w-7xl gap-4 px-4 pt-6 sm:grid-cols-3 sm:px-6">{[["Services et produits", catalogue.services.filter((s) => !s.archived_at).length, "/admin/services"], ["Services actifs", catalogue.services.filter((s) => s.is_active && !s.archived_at && catalogue.categories.some((c) => c.id === s.category_id && c.is_active)).length, "/admin/services"], ["Catégories actives", catalogue.categories.filter((c) => c.is_active).length, "/admin/categories"]].map(([label, count, href]) => <Link key={label} href={String(href)} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-blue-300">{count}</p></Link>)}</div>}<OrdersDashboard /></>;
}
