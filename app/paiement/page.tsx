"use client";

import { FormEvent, useMemo, useState } from "react";

const WHATSAPP_NUMBER = "221781108729";
const STORAGE_KEY = "terangazone_orders";

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
  { name: "Netflix", price: 5000, duration: "1 mois" },
  { name: "Prime Video", price: 3500, duration: "1 mois" },
  { name: "Disney+", price: 11000, duration: "1 mois" },
  { name: "ChatGPT", price: 6500, duration: "1 mois" },
  { name: "Canva Pro", price: 15000, duration: "1 an" },
  { name: "Spotify Premium", price: 3500, duration: "1 mois" },
  { name: "Monétisation TikTok", price: 15000, duration: "Service" },
];

type OrderStatus = "En attente" | "Payée" | "Livrée" | "Annulée";

type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  service: string;
  duration: string;
  amount: number;
  paymentMethod: keyof typeof PAYMENT_ACCOUNTS;
  paymentAccount: string;
  paymentPhone: string;
  transactionReference: string;
  status: OrderStatus;
  accessInfo: string;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("fr-FR")} FCFA`;
}

function createOrderId() {
  return `TZ-${Date.now().toString().slice(-8)}`;
}

export default function PaiementPage() {
  const [selectedOfferName, setSelectedOfferName] = useState(OFFERS[0].name);
  const [paymentMethod, setPaymentMethod] =
    useState<keyof typeof PAYMENT_ACCOUNTS>("Wave");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");

  const selectedOffer =
    OFFERS.find((offer) => offer.name === selectedOfferName) ?? OFFERS[0];

  const paymentAccount = PAYMENT_ACCOUNTS[paymentMethod];

  const proofMessage = useMemo(
    () =>
      [
        "Bonjour TerangaZone, j’ai effectué un paiement.",
        "",
        `Service : ${selectedOffer.name}`,
        `Montant : ${formatPrice(selectedOffer.price)}`,
        `Durée : ${selectedOffer.duration}`,
        `Moyen de paiement : ${paymentMethod}`,
        `Numéro destinataire : ${paymentAccount.number}`,
        `Nom du client : ${customerName || "Non renseigné"}`,
        `Téléphone du client : ${customerPhone || "Non renseigné"}`,
        `Numéro utilisé pour payer : ${paymentPhone || "Non renseigné"}`,
        `Référence de transaction : ${reference || "Non renseignée"}`,
        "",
        "Je vais joindre la capture ou la preuve du paiement dans WhatsApp.",
      ].join("\n"),
    [
      selectedOffer,
      paymentMethod,
      paymentAccount.number,
      customerName,
      customerPhone,
      paymentPhone,
      reference,
    ]
  );

  function saveOrder(order: Order) {
    const existing = localStorage.getItem(STORAGE_KEY);
    const orders: Order[] = existing ? JSON.parse(existing) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...orders]));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const order: Order = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      customerName,
      customerPhone,
      service: selectedOffer.name,
      duration: selectedOffer.duration,
      amount: selectedOffer.price,
      paymentMethod,
      paymentAccount: paymentAccount.number,
      paymentPhone,
      transactionReference: reference,
      status: "En attente",
      accessInfo: "",
    };

    saveOrder(order);
    setMessage(`Commande ${order.id} enregistrée. WhatsApp va s’ouvrir.`);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `${proofMessage}\n\nNuméro de commande : ${order.id}`
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black">
              TZ
            </span>

            <div>
              <p className="text-xl font-black">
                Teranga<span className="text-blue-400">Zone</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                Paiement sécurisé
              </p>
            </div>
          </a>

          <a
            href="/commande"
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
          >
            Retour à la commande
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">
              Paiement TerangaZone
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Payez avec Wave ou Orange Money
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Choisissez votre service et envoyez ensuite la preuve sur notre
              WhatsApp officiel.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.15fr]">
            <div className="space-y-6">
              <div className="rounded-[30px] border border-red-400/20 bg-red-400/10 p-6">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
                  Attention aux arnaques
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Ne payez qu’aux numéros officiels affichés sur cette page.
                  TerangaZone ne vous demandera jamais de payer sur un autre
                  numéro.
                </p>
              </div>

              <div className="rounded-[30px] border border-cyan-400/20 bg-cyan-400/10 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Wave officiel
                </p>
                <p className="mt-3 text-3xl font-black text-cyan-300">
                  76 993 83 04
                </p>
              </div>

              <div className="rounded-[30px] border border-orange-400/20 bg-orange-400/10 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                  Orange Money officiel
                </p>
                <p className="mt-3 text-3xl font-black text-orange-300">
                  78 110 87 29
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Service
                  </span>
                  <select
                    value={selectedOfferName}
                    onChange={(event) => setSelectedOfferName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none"
                  >
                    {OFFERS.map((offer) => (
                      <option key={offer.name} value={offer.name}>
                        {offer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Moyen de paiement
                  </span>
                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as keyof typeof PAYMENT_ACCOUNTS
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none"
                  >
                    <option value="Wave">Wave</option>
                    <option value="Orange Money">Orange Money</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Montant à payer
                </p>
                <p className="mt-2 text-3xl font-black text-blue-300">
                  {formatPrice(selectedOffer.price)}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedOffer.name} — {selectedOffer.duration}
                </p>
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Envoyer à
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {paymentAccount.number}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {paymentMethod}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Votre nom
                  </span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Votre téléphone
                  </span>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Numéro utilisé pour payer
                  </span>
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={(event) => setPaymentPhone(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Référence de transaction
                  </span>
                  <input
                    type="text"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Facultatif"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-4 text-white outline-none"
                  />
                </label>
              </div>

              {message && (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white transition hover:bg-emerald-400"
              >
                Enregistrer et envoyer la preuve
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
