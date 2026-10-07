import { loadAdminCatalogue } from "../catalogue-actions";
import { AdminPageHeading, SetupWarning } from "../catalogue-ui";
import ServicesManager from "./services-manager";
export default async function ServicesPage() { const data = await loadAdminCatalogue(); return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{data.error ? <><AdminPageHeading title="Services et produits" description="Gérez votre catalogue et vos prix." /><SetupWarning error={data.error} /></> : <ServicesManager services={data.services} categories={data.categories} now={new Date().toISOString()} />}</section>; }
