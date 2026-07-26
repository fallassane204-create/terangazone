"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const WHATSAPP_NUMBER = "221781108729";

const PAYMENT_ACCOUNTS = {
  Wave: {
    number: "76 993 83 04",
    name: "TerangaZone",
  },
  "Orange Money": {
    number: "78 110 87 29",
    name: "TerangaZone",
  },
};

const OFFERS = [
  { name: "Netflix", price: 5000, duration: "1 mois", note: "Chaque profil est sécurisé." },
  { name: "Prime Video", price: 3500, duration: "1 mois", note: "Accès mensuel." },
  { name: "Disney+", price: 11000, duration: "1 mois", note: "Accès mensuel." },
  { name: "ChatGPT", price: 6500, duration: "1 mois", note: "Accès mensuel." },
  { name: "Canva Pro", price: 15000, duration: "1 an", note: "Offre annuelle." },
  { name: "Spotify Premium", price: 3500, duration: "1 mois", note: "Accès mensuel." },
  { name: "Monétisation TikTok", price: 15000, duration: "Service", note: "Accompagnement à la configuration d’un compte éligible." },
  { name: "Logiciels informatiques", price: 0, duration: "Sur demande", note: "Le prix dépend du logiciel demandé." },
];

type PaymentMethod = keyof typeof PAYMENT_ACCOUNTS;

function formatPrice(price: number) {
  if (price === 0) return "Sur demande";
  return `${price.toLocaleString("fr-FR")} FCFA`;
}

function createOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(10 + Math.random() * 90);
  return `TZ-${timestamp}${random}`;
}

export default function CommandePage() {
  const [selectedService, setSelectedService] = useState(OFFERS[0].name);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Wave");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOffer = OFFERS.find((offer) => offer.name === selectedService) ?? OFFERS[0];
  const paymentAccount = PAYMENT_ACCOUNTS[paymentMethod];

  const whatsappMessage = useMemo(() => {
    return [
      "Bonjour TerangaZone, j’ai effectué un paiement.",
      "",
      `Service : ${selectedOffer.name}`,
      `Tarif : ${formatPrice(selectedOffer.price)}`,
      `Durée : ${selectedOffer.duration}`,
      `Moyen de paiement : ${paymentMethod}`,
      `Numéro destinataire : ${paymentAccount.number}`,
      `Nom : ${name || "Non renseigné"}`,
      `Téléphone : ${phone || "Non renseigné"}`,
      `Numéro Wave / Orange Money ayant effectué le paiement : ${paymentPhone || "Non renseigné"}`,
      `Référence de transaction : ${transactionReference || "Non renseignée"}`,
      `Précisions : ${notes || "Aucune"}`,
      "",
      "Je vais joindre la preuve de paiement dans WhatsApp.",
    ].join("\n");
  }, [selectedOffer, paymentMethod, paymentAccount.number, name, phone, paymentPhone, transactionReference, notes]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (selectedOffer.price === 0) {
      const message = [
        "Bonjour TerangaZone, je souhaite demander un devis.",
        "",
        `Service : ${selectedOffer.name}`,
        `Nom : ${name}`,
        `Téléphone : ${phone}`,
        `Précisions : ${notes || "Aucune"}`,
      ].join("\n");

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const orderNumber = createOrderNumber();

      const { error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        payment_phone: paymentPhone.trim(),
        service_name: selectedOffer.name,
        service_price: selectedOffer.price,
        duration: selectedOffer.duration,
        payment_method: paymentMethod,
        payment_reference: transactionReference.trim() || null,
        status: "En attente",
        access_message: "",
      });

      if (error) {
        console.error("Erreur Supabase :", error);
        setErrorMessage("La commande n’a pas pu être enregistrée. Vérifiez la connexion Supabase puis réessayez.");
        return;
      }

      setSuccessMessage(`Commande ${orderNumber} enregistrée dans Supabase. WhatsApp va s’ouvrir pour envoyer la preuve.`);

      const finalMessage = `${whatsappMessage}\n\nNuméro de commande : ${orderNumber}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`, "_blank", "noopener,noreferrer");

      setPaymentPhone("");
      setTransactionReference("");
      setNotes("");
    } catch (error) {
      console.error("Erreur inattendue :", error);
      setErrorMessage("Une erreur inattendue est survenue. Réessayez dans quelques instants.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black">TZ</span>
            <div>
              <p className="text-xl font-black">Teranga<span className="text-blue-400">Zone</span></p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Commande et paiement</p>
            </div>
          </a>
          <a href="/boutique" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:bg-white/10">Retour à la boutique</a>
        </div>
      </header>

      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Commander</p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Commandez et payez sur une seule page</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">Remplissez vos informations, choisissez Wave ou Orange Money, effectuez le paiement puis envoyez la preuve sur WhatsApp.</p>

            <div className="mt-10 space-y-4">
              {[["1", "Choisissez votre service"], ["2", "Entrez vos informations"], ["3", "Payez avec Wave ou Orange Money"], ["4", "Envoyez la preuve sur WhatsApp"]].map(([number, text]) => (
                <div key={number} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 font-black">{number}</span>
                  <p className="font-semibold text-slate-200">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
              <p className="font-black text-red-300">Attention aux arnaques</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Ne payez qu’aux numéros officiels affichés sur cette page.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Service</span>
                <select value={selectedService} onChange={(event) => setSelectedService(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none focus:border-blue-400/50">
                  {OFFERS.map((offer) => <option key={offer.name} value={offer.name}>{offer.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Moyen de paiement</span>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} disabled={selectedOffer.price === 0} className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="Wave">Wave</option>
                  <option value="Orange Money">Orange Money</option>
                </select>
              </label>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Votre nom</span>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Exemple : Mamadou Fall" required className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Votre téléphone</span>
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Exemple : 77 000 00 00" required className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
              </label>
            </div>

            <div className="mt-6 rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Résumé de la commande</p>
              <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-2xl font-black">{selectedOffer.name}</p>
                  <p className="mt-2 text-sm text-slate-400">{selectedOffer.note}</p>
                  <p className="mt-1 text-sm text-slate-400">Durée : {selectedOffer.duration}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-black text-blue-300">{formatPrice(selectedOffer.price)}</p>
                </div>
              </div>

              {selectedOffer.price > 0 && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Numéro officiel {paymentMethod}</p>
                  <p className="mt-2 text-3xl font-black">{paymentAccount.number}</p>
                </div>
              )}
            </div>

            {selectedOffer.price > 0 && (
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-300">Numéro Wave / Orange Money ayant effectué le paiement</span>
                  <input type="tel" value={paymentPhone} onChange={(event) => setPaymentPhone(event.target.value)} placeholder="Votre numéro Wave ou Orange Money" required className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-300">Référence de transaction</span>
                  <input type="text" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="Facultatif" className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
                </label>
              </div>
            )}

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Précisions</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ajoutez une précision si nécessaire..." rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
            </label>

            {errorMessage && <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{errorMessage}</div>}
            {successMessage && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{successMessage}</div>}

            <button type="submit" disabled={isSubmitting} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white shadow-xl shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
              <span>💬</span>
              {isSubmitting ? "Enregistrement..." : selectedOffer.price === 0 ? "Demander le prix sur WhatsApp" : "Enregistrer et envoyer la preuve"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
