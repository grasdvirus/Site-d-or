import React, { useState, useMemo } from "react";
import { Check, Info, Sparkles, Zap, ArrowRight, HelpCircle } from "lucide-react";

type Currency = "USD" | "EUR" | "GBP";

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly">("quarterly");
  const [currency, setCurrency] = useState<Currency>("USD");

  // Exchange rates relative to USD (simulated)
  const exchangeRates = {
    USD: { symbol: "$", rate: 1 },
    EUR: { symbol: "€", rate: 0.92 },
    GBP: { symbol: "£", rate: 0.79 },
  };

  // Base values in USD for plans
  const planData = [
    {
      id: "simple",
      name: "Simple Mod",
      tagline: "Une demande à la fois. Idéal pour une croissance régulière.",
      baseMonthlyUSD: 1450,
      baseQuarterlyUSD: 1250, // per month
      features: [
        "Une seule demande active de modèle financier à la fois",
        "Révisions & mises à jour sur mesure illimitées",
        "Livraison brute au format source Excel ou Google Sheets",
        "Mises à jour asynchrones hebdomadaires via Slack",
        "Délai de traitement moyen de 48h par scénario",
        "Pause ou annulation possible à tout moment",
      ],
      cta: "S'abonner à Simple Mod",
      badge: "Idéal pour la phase d'Amorçage",
      popular: false,
    },
    {
      id: "growth",
      name: "Growth Accelerator",
      tagline: "Deux demandes simultanées. Conçu pour suivre votre accélération active.",
      baseMonthlyUSD: 2950,
      baseQuarterlyUSD: 2500, // per month
      features: [
        "Deux demandes financières actives en simultané",
        "Simulations approfondies de table de capitalisation & dilution",
        "Planification complète des recrutements et des effectifs",
        "Canal Slack prioritaire & Espace de projet dédié",
        "Délai moyen de retour de 24h sur vos demandes",
        "Soutien complet pour vos présentations de conseil (Board)",
        "Pause ou annulation possible à tout moment",
      ],
      cta: "S'abonner au plan Growth",
      badge: "Le Plus Populaire",
      popular: true,
    },
    {
      id: "special",
      name: "Projet Spécial",
      tagline: "Forfait fixe sur mesure pour vos transactions lourdes d'entreprise.",
      baseMonthlyUSD: 2600, // Fixed cost
      baseQuarterlyUSD: 2200, // per project (simulated discount)
      features: [
        "Création de modèle financier sur mesure à partir de zéro",
        "Formulation de scénarios haut de gamme pour pitch de levée",
        "Modélisation intensive de cession, acquisition (M&A) ou d'exit",
        "Plusieurs appels vidéo hebdomadaires réguliers de synchronisation",
        "Soutien complet durant les phases d'audit et de due diligence",
        "Premier jet garanti sous 5 jours ouvrés",
      ],
      cta: "Réserver un conseil personnalisé",
      badge: "Forfait Fixe Unique",
      popular: false,
    },
  ];

  const formatPrice = (baseUSD: number) => {
    const symbol = exchangeRates[currency].symbol;
    const rate = exchangeRates[currency].rate;
    const converted = Math.round(baseUSD * rate);
    return `${symbol}${converted.toLocaleString()}`;
  };

  return (
    <div id="pricing-plans" className="space-y-12">
      {/* Toggles bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* Billing Period Toggle */}
        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              billingPeriod === "monthly"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingPeriod("quarterly")}
            className={`relative px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              billingPeriod === "quarterly"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-indigo-600"
            }`}
          >
            Trimestriel
            <span className="text-[9px] bg-rose-500 text-white font-mono uppercase font-bold px-1.5 py-0.5 rounded-full">
              -15%
            </span>
          </button>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(["USD", "EUR", "GBP"] as Currency[]).map((cur) => (
            <button
              key={cur}
              onClick={() => setCurrency(cur)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currency === cur
                  ? "bg-white text-indigo-700 font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {planData.map((plan) => {
          const isSpecial = plan.id === "special";
          const activeBasePrice = billingPeriod === "monthly" ? plan.baseMonthlyUSD : plan.baseQuarterlyUSD;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden sleek-shadow-sm hover:sleek-shadow-lg ${
                plan.popular
                  ? "border-2 border-indigo-600 ring-4 ring-indigo-50/30 scale-102 z-10"
                  : "border-slate-100/90"
              }`}
            >
              {/* Highlight Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white font-mono text-[9px] tracking-wider font-extrabold uppercase px-4 py-1.5 rounded-bl-2xl flex items-center gap-1">
                  <StarIcon className="w-3 h-3 text-indigo-200 fill-current" />
                  Le Plus Populaire
                </div>
              )}
              {!plan.popular && plan.badge && (
                <div className="absolute top-4 right-4 bg-slate-100 text-slate-600 font-mono text-[9px] tracking-wider uppercase font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              {/* Card top */}
              <div className="p-8 pb-4 space-y-4">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400 block">
                  {plan.badge}
                </span>
                <h3 className="text-2xl font-bold font-sans text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed min-h-8">{plan.tagline}</p>

                {/* Pricing Display */}
                <div className="pt-2">
                  <span className="text-4xl md:text-5xl font-mono font-bold text-slate-900 tracking-tight">
                    {formatPrice(activeBasePrice)}
                  </span>
                  <span className="text-slate-400 font-sans text-xs font-semibold block mt-1">
                    {isSpecial ? "tarif initial par projet" : "par mois, facturé " + (billingPeriod === "monthly" ? "mensuellement" : "trimestriellement")}
                  </span>
                </div>
              </div>

              {/* Card middle (Features) */}
              <div className="px-8 py-4 bg-slate-50/40 border-y border-slate-100/90 flex-1">
                <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Ce qui est inclus :
                </p>
                <ul className="space-y-3.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600">
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card bottom (CTA) */}
              <div className="p-8">
                <button
                  onClick={() => alert(`Redirection vers le portail de facturation sécurisé pour ${plan.name} en cycle ${billingPeriod === "monthly" ? "mensuel" : "trimestriel"}. Cette démo fournit une simulation entièrement fonctionnelle !`)}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-3 font-mono">
                  {isSpecial ? "Démarrage sous 24h" : "Mise en pause ou arrêt à tout moment"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom info banner */}
      <div className="bg-slate-50/50 border border-slate-100/90 sleek-shadow-sm rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Besoin d'un volume sur mesure ou d'un support multi-projets ?</h4>
            <p className="text-xs text-slate-500">Nous conseillons les startups de portfolios de capital-risque, les agrégateurs et les entreprises deep tech.</p>
          </div>
        </div>
        <a
          href="#inquiry-form"
          onClick={(e) => {
            const el = document.getElementById("inquiry-form");
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-medium text-slate-700 transition-colors"
        >
          Demander une structure sur mesure &rarr;
        </a>
      </div>
    </div>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
