import { loadAdminCatalogue } from "../catalogue-actions";
import { AdminPageHeading, SetupWarning } from "../catalogue-ui";
import SettingsEditor from "./settings-editor";
export default async function SettingsPage() { const data = await loadAdminCatalogue(); return <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{data.error || !data.settings ? <><AdminPageHeading title="Paramètres" description="Gérez les coordonnées publiques de la boutique." /><SetupWarning error={data.error ?? "Paramètres indisponibles."} /></> : <SettingsEditor settings={data.settings} />}</section>; }
