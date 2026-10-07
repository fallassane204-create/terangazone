"use client";
import type { ReactNode } from "react";
import type { MutationResult } from "@/lib/catalogue/types";
export function AdminPageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-400">Administration</p><h1 className="mt-3 text-3xl font-black">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">{description}</p></div>{children}</div>;
}
export function Feedback({ result }: { result: MutationResult | null }) {
  return result ? <p role={result.ok ? "status" : "alert"} className={`mt-4 rounded-xl p-4 text-sm leading-6 ${result.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"}`}>{result.message}</p> : null;
}
export function SetupWarning({ error }: { error: string }) {
  return <div role="alert" className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5"><h2 className="font-black text-amber-200">Catalogue indisponible</h2><p className="mt-3 text-sm leading-7 text-slate-300">{error}</p><p className="mt-3 text-sm leading-7 text-slate-400">Les sauvegardes sont désactivées. Suivez le guide d’activation fourni avec le projet, sur une base de test avant la production. Aucune modification automatique de votre base n’a été effectuée.</p></div>;
}
export function Label({ title, children }: { title: string; children: ReactNode }) { return <label className="block"><span className="label">{title}</span>{children}</label>; }
export function Toggle({ title, checked, onChange }: { title: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-500" /><span>{title}</span></label>; }
