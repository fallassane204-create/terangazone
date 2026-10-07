import { loadAdminCatalogue } from "../catalogue-actions";
import { AdminPageHeading, SetupWarning } from "../catalogue-ui";
import CategoriesManager from "./categories-manager";
export default async function CategoriesPage() { const data = await loadAdminCatalogue(); return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{data.error ? <><AdminPageHeading title="Catégories" description="Organisez votre catalogue." /><SetupWarning error={data.error} /></> : <CategoriesManager categories={data.categories} />}</section>; }
