"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AdminLayoutProps = { children: ReactNode };

const menuItems = [
  { label: "Tableau de bord", href: "/admin", icon: "▦" },
  { label: "Services", href: "/admin/services", icon: "◇" },
  { label: "Catégories", href: "/admin/categories", icon: "▤" },
  { label: "Commandes", href: "/admin/commandes", icon: "📦" },
  { label: "Clients", href: "/admin/clients", icon: "👥" },
  { label: "Visites", href: "/admin/visites", icon: "↗" },
  { label: "Promotions", href: "/admin/promotions", icon: "%" },
  { label: "Paramètres", href: "/admin/parametres", icon: "⚙" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/connexion-admin");
      router.refresh();
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-50 flex min-h-16 items-center justify-between border-b border-white/10 bg-[#050816]/95 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/admin">
          <p className="text-xl font-black">Teranga<span className="text-blue-400">Zone</span></p>
          <p className="text-[9px] uppercase tracking-[0.24em] text-slate-500">Administration</p>
        </Link>
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl">{menuOpen ? "✕" : "☰"}</button>
      </header>

      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 bg-[#080c1c] p-4 shadow-2xl lg:hidden">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold ${isActive(item.href) ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
            <Link href="/boutique" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 font-bold text-slate-300"><span>🛍️</span>Voir la boutique</Link>
            <button type="button" onClick={handleSignOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-left font-bold text-red-200 disabled:opacity-60"><span>🚪</span>{signingOut ? "Déconnexion..." : "Se déconnecter"}</button>
          </nav>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-y-auto border-r border-white/10 bg-[#080c1c] lg:flex">
          <div className="border-b border-white/10 px-7 py-7">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-black">TZ</span>
              <div><p className="text-xl font-black">Teranga<span className="text-blue-400">Zone</span></p><p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Administration</p></div>
            </Link>
          </div>

          <div className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">Menu principal</p>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 font-bold ${isActive(item.href) ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">Site</p>
            <Link href="/boutique" className="flex items-center gap-4 rounded-2xl px-4 py-3.5 font-bold text-slate-400 hover:bg-white/5 hover:text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">🛍️</span>Voir la boutique</Link>
            <Link href="/" className="mt-2 flex items-center gap-4 rounded-2xl px-4 py-3.5 font-bold text-slate-400 hover:bg-white/5 hover:text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">🏠</span>Accueil du site</Link>
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="rounded-2xl bg-white/[0.04] p-4">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-black">A</span><div className="min-w-0 flex-1"><p className="truncate font-bold">Administrateur</p><p className="truncate text-xs text-slate-500">TerangaZone</p></div></div>
              <button type="button" onClick={handleSignOut} disabled={signingOut} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200 disabled:opacity-60"><span>🚪</span>{signingOut ? "Déconnexion..." : "Se déconnecter"}</button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-72">{children}</div>
      </div>
    </div>
  );
}
