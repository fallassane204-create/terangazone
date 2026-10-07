"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recoveryRedirect } from "@/lib/password-recovery";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authorized, setAuthorized] = useState(!reset);
  const submitting = useRef(false);
  useEffect(() => {
    if (!reset) return;
    let active = true;
    void createClient().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setAuthorized(!!data.user && !error);
      if (!data.user || error) setError("Ouvrez un lien de récupération valide reçu par e-mail. Le lien a peut-être expiré.");
    }).catch(() => { if (active) setError("Impossible de vérifier le lien. Demandez un nouveau lien de récupération."); });
    return () => { active = false; };
  }, [reset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !authorized) return;
    if (reset && (password.length < 12 || password !== confirmation)) {
      setError("Saisissez deux mots de passe identiques d’au moins 12 caractères."); return;
    }
    submitting.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (reset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error("Impossible d’enregistrer le mot de passe. Vérifiez le lien et réessayez.");
        await supabase.auth.signOut();
        router.replace("/connexion-admin?mot_de_passe=modifie"); router.refresh();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: recoveryRedirect(window.location.origin) });
        if (error) throw new Error("Envoi indisponible. Réessayez dans quelques instants.");
        setMessage("Si cette adresse correspond à un compte, un lien de récupération vous sera envoyé. Vérifiez aussi les courriers indésirables.");
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Réessayez dans quelques instants."); }
    finally { submitting.current = false; setBusy(false); }
  }
  const inputStyle = "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400";
  return <main className="flex min-h-screen items-center justify-center bg-[#050816] px-5 py-10 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
    <p className="font-black text-blue-300">TerangaZone</p><h1 className="mt-4 text-3xl font-black">{reset ? "Nouveau mot de passe" : "Mot de passe oublié"}</h1>
    <p className="mt-3 leading-7 text-slate-400">{reset ? "Choisissez un mot de passe d’au moins 12 caractères." : "Recevez un lien pour retrouver l’accès à votre compte."}</p>
    <form onSubmit={submit} className="mt-6 space-y-5">
      {reset ? <><label className="block">Nouveau mot de passe<input className={inputStyle} type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} /></label><label className="block">Confirmer le mot de passe<input className={inputStyle} type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={e=>setConfirmation(e.target.value)} /></label></> : <label className="block">Adresse e-mail<input className={inputStyle} type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>}
      {error && <p role="alert" className="text-red-300">{error}</p>}{message && <p role="status" className="text-emerald-300">{message}</p>}
      <button className="btn-primary w-full disabled:opacity-50" disabled={busy || !authorized || !!message}>{busy ? "En cours…" : reset ? "Enregistrer le mot de passe" : "Recevoir le lien"}</button>
    </form><Link href={reset ? "/mot-de-passe-oublie" : "/connexion-admin"} className="mt-6 block text-sm font-bold text-blue-300">{reset ? "Demander un nouveau lien" : "Retour à la connexion"}</Link>
  </section></main>;
}
