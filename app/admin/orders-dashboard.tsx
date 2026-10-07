"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { listOrders } from "./actions";

type OrderStatus = "En attente" | "Payée" | "Livrée" | "Annulée";

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  service: string;
  duration: string;
  amount: number;
  paymentMethod: "Wave" | "Orange Money";
  paymentAccount: string;
  paymentPhone: string;
  transactionReference: string;
  status: OrderStatus;
  accessInfo: string;
  notes?: string;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: OrderStatus) {
  if (status === "Payée") {
    return "bg-blue-400/10 text-blue-200 border-blue-400/20";
  }

  if (status === "Livrée") {
    return "bg-emerald-400/10 text-emerald-200 border-emerald-400/20";
  }

  if (status === "Annulée") {
    return "bg-red-400/10 text-red-200 border-red-400/20";
  }

  return "bg-amber-400/10 text-amber-200 border-amber-400/20";
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function load() {
    try {
      const { data, error } = await listOrders();
      if (error) throw error;
      setOrders((data ?? []).map((order) => ({
        id: order.id, orderNumber: order.order_number || order.id, createdAt: order.created_at, customerName: order.customer_name,
        customerPhone: order.customer_phone, service: order.service_name, duration: order.duration,
        amount: order.service_price, paymentMethod: order.payment_method,
        paymentAccount: "", paymentPhone: order.payment_phone,
        transactionReference: order.payment_reference, status: order.status, accessInfo: order.access_message,
      })));
    } catch (error) {
      console.error("Impossible de charger les commandes :", error);
      setErrorMessage("Impossible de charger les commandes depuis Supabase.");
    } finally {
      setLoaded(true);
    }
    }
    void load();
  }, []);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(
      (order) => order.status === "Payée" || order.status === "Livrée"
    );

    const uniqueClients = new Set(
      orders
        .map((order) => order.customerPhone?.replace(/\s/g, ""))
        .filter(Boolean)
    );

    return {
      total: orders.length,
      clients: uniqueClients.size,
      pending: orders.filter((order) => order.status === "En attente").length,
      paid: paidOrders.length,
      delivered: orders.filter((order) => order.status === "Livrée").length,
      revenue: paidOrders.reduce(
        (sum, order) => sum + Number(order.amount || 0),
        0
      ),
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 5);
  }, [orders]);

  const popularServices = useMemo(() => {
    const services: Record<
      string,
      {
        name: string;
        count: number;
        revenue: number;
      }
    > = {};

    orders.forEach((order) => {
      if (!services[order.service]) {
        services[order.service] = {
          name: order.service,
          count: 0,
          revenue: 0,
        };
      }

      services[order.service].count += 1;

      if (order.status === "Payée" || order.status === "Livrée") {
        services[order.service].revenue += Number(order.amount || 0);
      }
    });

    return Object.values(services)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [orders]);

  const maximumServiceSales = Math.max(
    ...popularServices.map((service) => service.count),
    1
  );

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {errorMessage && <p role="alert" className="p-6 text-red-200">{errorMessage}</p>}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">
                Administration
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl lg:text-5xl">
                Tableau de bord
              </h1>

              <p className="mt-4 max-w-2xl text-slate-400">
                Suivez les commandes, les clients et le chiffre d’affaires de
                TerangaZone.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/commandes"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-1"
              >
                Gérer les commandes
                <span>→</span>
              </Link>

              <Link
                href="/boutique"
                className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-bold transition hover:bg-white/10"
              >
                Voir la boutique
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        {!loaded ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center text-slate-400">
            Chargement du tableau de bord...
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-[26px] border border-blue-400/20 bg-gradient-to-br from-blue-500/15 to-blue-900/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-xl">
                    💰
                  </span>

                  <span className="text-xs font-bold text-blue-300">
                    Revenus
                  </span>
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Chiffre d’affaires
                </p>

                <p className="mt-2 text-2xl font-black text-blue-200">
                  {formatPrice(stats.revenue)}
                </p>
              </article>

              <article className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-xl">
                    📦
                  </span>

                  <span className="text-xs font-bold text-slate-500">Total</span>
                </div>

                <p className="mt-5 text-sm text-slate-400">Commandes</p>
                <p className="mt-2 text-3xl font-black">{stats.total}</p>
              </article>

              <article className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-xl">
                    👥
                  </span>

                  <span className="text-xs font-bold text-slate-500">
                    Uniques
                  </span>
                </div>

                <p className="mt-5 text-sm text-slate-400">Clients</p>
                <p className="mt-2 text-3xl font-black">{stats.clients}</p>
              </article>

              <article className="rounded-[26px] border border-amber-400/15 bg-amber-400/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-xl">
                    ⏳
                  </span>

                  <span className="text-xs font-bold text-amber-300">
                    À traiter
                  </span>
                </div>

                <p className="mt-5 text-sm text-slate-400">En attente</p>
                <p className="mt-2 text-3xl font-black">{stats.pending}</p>
              </article>

              <article className="rounded-[26px] border border-emerald-400/15 bg-emerald-400/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl">
                    ✅
                  </span>

                  <span className="text-xs font-bold text-emerald-300">
                    Confirmées
                  </span>
                </div>

                <p className="mt-5 text-sm text-slate-400">
                  Payées / livrées
                </p>

                <p className="mt-2 text-3xl font-black">{stats.paid}</p>
              </article>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <Link
                href="/admin/commandes"
                className="group rounded-[28px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.065]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg shadow-blue-600/20">
                    📦
                  </span>

                  <span className="text-2xl text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-300">
                    →
                  </span>
                </div>

                <h2 className="mt-6 text-xl font-black">
                  Gérer les commandes
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Vérifier les paiements, ajouter les accès et livrer les
                  commandes.
                </p>
              </Link>

              <Link
                href="/boutique"
                className="group rounded-[28px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-purple-400/30 hover:bg-white/[0.065]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
                    🛍️
                  </span>

                  <span className="text-2xl text-slate-600 transition group-hover:translate-x-1 group-hover:text-purple-300">
                    →
                  </span>
                </div>

                <h2 className="mt-6 text-xl font-black">Voir la boutique</h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Vérifier les offres, les prix et l’expérience de commande.
                </p>
              </Link>

              <Link
                href="/commande"
                className="group rounded-[28px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.065]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">
                    ➕
                  </span>

                  <span className="text-2xl text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-300">
                    →
                  </span>
                </div>

                <h2 className="mt-6 text-xl font-black">Tester une commande</h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Ouvrir le parcours client et vérifier l’enregistrement d’une
                  commande.
                </p>
              </Link>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
                      Activité
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Commandes récentes
                    </h2>
                  </div>

                  <Link
                    href="/admin/commandes"
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Tout voir
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {recentOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
                      <p className="text-3xl">📭</p>

                      <p className="mt-4 font-bold">
                        Aucune commande enregistrée
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Les prochaines commandes apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href="/admin/commandes"
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-blue-400/20 hover:bg-white/[0.04] sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black">{order.orderNumber}</p>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="mt-2 truncate text-sm font-semibold text-slate-300">
                            {order.customerName} · {order.service}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <p className="shrink-0 text-lg font-black text-blue-300">
                          {formatPrice(Number(order.amount || 0))}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
                  Classement
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Services populaires
                </h2>

                <div className="mt-6 space-y-5">
                  {popularServices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
                      Pas encore assez de données.
                    </div>
                  ) : (
                    popularServices.map((service, index) => {
                      const percentage =
                        (service.count / maximumServiceSales) * 100;

                      return (
                        <div key={service.name}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-black text-slate-400">
                                {index + 1}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate font-bold">
                                  {service.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {service.count} commande
                                  {service.count > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            <p className="shrink-0 text-sm font-bold text-blue-300">
                              {formatPrice(service.revenue)}
                            </p>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            <div className="mt-8 rounded-[30px] border border-blue-400/15 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/5 p-6">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold text-blue-300">
                    Résumé TerangaZone
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {stats.pending > 0
                      ? `${stats.pending} commande${
                          stats.pending > 1 ? "s" : ""
                        } nécessite${stats.pending > 1 ? "nt" : ""} votre attention.`
                      : "Toutes les commandes sont à jour."}
                  </h2>

                  <p className="mt-3 text-sm text-slate-400">
                    {stats.delivered} commande
                    {stats.delivered > 1 ? "s" : ""} livrée
                    {stats.delivered > 1 ? "s" : ""} au total.
                  </p>
                </div>

                <Link
                  href="/admin/commandes"
                  className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-1"
                  style={{ color: "#ffffff" }}
                >
                  Ouvrir les commandes
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
