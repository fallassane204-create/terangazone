import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "TerangaZone — Services et abonnements numériques",
  description: "Découvrez les offres TerangaZone et commandez avec Wave, Orange Money et WhatsApp.",
  openGraph: {
    title: "TerangaZone",
    description: "Services et abonnements numériques. Commandez sur WhatsApp.",
    locale: "fr_SN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {process.env.TZ_LOCAL_TEST_PREVIEW === "1" && <div role="status" className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-200">Aperçu de test — aucun paiement réel. Vos modifications restent dans cet essai local.</div>}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
