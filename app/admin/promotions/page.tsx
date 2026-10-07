import { loadAdminCatalogue } from "../catalogue-actions";
import { AdminPageHeading, SetupWarning } from "../catalogue-ui";
import ServicesManager from "../services/services-manager";
export default async function PromotionsPage() { const data = await loadAdminCatalogue(); return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{data.error ? <><AdminPageHeading title="Promotions" description="Gérez vos promotions et leurs dates." /><SetupWarning error={data.error} /></> : <ServicesManager services={data.services} categories={data.categories} promotionsOnly now={new Date().toISOString()} />}</section>; }
