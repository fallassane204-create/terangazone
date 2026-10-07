"use client";

import { FormEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { checkAdminAccess } from "./actions";



function ConnexionAdminForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setErrorMessage("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setErrorMessage("Adresse e-mail ou mot de passe incorrect.");
        return;
      }
      if (!(await checkAdminAccess())) {
        await supabase.auth.signOut();
        setErrorMessage("Ce compte ne dispose pas des droits d’administration.");
        return;
      }

      const returnPath = searchParams.get("retour");
      const safeReturnPath =
        returnPath && (returnPath === "/admin" || returnPath.startsWith("/admin/")) && !returnPath.includes("\\")
          ? returnPath
          : "/admin";

      router.replace(safeReturnPath);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur est survenue. Réessayez.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-600/25 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-600/25 blur-[130px]" />
      </div>

      <section className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black shadow-xl shadow-blue-600/25">
            TZ
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Connexion administrateur
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Connectez-vous pour gérer TerangaZone.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold">
              Adresse e-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#080c1c] px-4 py-4 text-white outline-none transition focus:border-blue-400/60"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold">
              Mot de passe
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#080c1c] px-4 py-4 text-white outline-none transition focus:border-blue-400/60"
              placeholder="Votre mot de passe"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <Link href="/mot-de-passe-oublie" className="mt-5 block text-center text-sm font-bold text-blue-300">Mot de passe oublié ?</Link>
        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          ← Retour au site
        </Link>
      </section>
    </main>
  );
}

function ConnexionAdminFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-5 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-8 py-6 text-center text-slate-300">
        Chargement de la connexion...
      </div>
    </main>
  );
}

export default function ConnexionAdminPage() {
  return (
    <Suspense fallback={<ConnexionAdminFallback />}>
      <ConnexionAdminForm />
    </Suspense>
  );
}
