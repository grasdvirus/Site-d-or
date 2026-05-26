import React, { useState } from "react";
import { Send, CheckCircle2, FileText, ChevronRight, HelpCircle, Loader2 } from "lucide-react";

export default function LeadForm() {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    businessModel: "SaaS",
    budget: "$1,250 - $2,500/mo",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalResult, setProposalResult] = useState<null | {
    recommendedPlan: string;
    timeline: string;
    deliverables: string[];
    suggestedRate: string;
  }>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email) return;

    setIsSubmitting(true);

    // Simulate custom proposal compilation
    setTimeout(() => {
      let recommendedPlan = "Formule Simple Mod";
      let suggestedRate = "1 250 $ / mois";
      let timeline = "Premier jet livré sous 2 jours ouvrés";
      let deliverables = [
        "Modèle financier mensuel dynamique (Excel & Google Sheets)",
        "Tableau de bord visuel de haute précision",
        "Mises à jour asynchrones hebdomadaires via Slack",
      ];

      if (formData.budget === "$2,500 - $5,000/mo") {
        recommendedPlan = "Formule Growth Accelerator";
        suggestedRate = "2 500 $ / mois";
        timeline = "Premiers modules livrés en 24-48 heures";
        deliverables = [
          "Mises à jour de modélisation financière actives illimitées",
          "Scénarios complets de planification des effectifs et recrutements",
          "Accompagnement par un analyste d'élite ex-capital financier",
          "Intégration directe à vos flux Stripe & QuickBooks",
        ];
      } else if (formData.budget === "Custom Enterprise / Special Project") {
        recommendedPlan = "Forfait Projet Spécial d'Entreprise";
        suggestedRate = "Prix fixe sur mesure";
        timeline = "Lancement dédié garanti sous 24 heures";
        deliverables = [
          "Modélisation de scénarios haut de gamme pour pitch de levée",
          "Audits d'évaluation de due diligence (achat/vente/M&A)",
          "Modélisation dynamique de table de capitalisation & dilution",
          "Points hebdomadaires individuels avec votre conseiller stratégique",
        ];
      }

      setProposalResult({
        recommendedPlan,
        timeline,
        deliverables,
        suggestedRate,
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleReset = () => {
    setProposalResult(null);
    setFormData({
      companyName: "",
      email: "",
      businessModel: "SaaS",
      budget: "$1,250 - $2,500/mo",
      notes: "",
    });
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-2xl border border-slate-900">
      {/* Visual neon ambient decoration - Sleek styling */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-mono tracking-widest uppercase text-indigo-400 bg-indigo-950/60 px-3.5 py-1.5 rounded-full border border-indigo-900/50">
            Simulateur de Devis
          </span>
          <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight">
            Demandez votre proposition <span className="font-serif italic text-indigo-300 font-normal">sur mesure</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Décrivez brièvement vos besoins afin de recevoir instantanément une proposition d'accompagnement Basecase.
          </p>
        </div>

        {!proposalResult ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field 1 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Nom de l'entreprise <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex : Acme Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              {/* Field 2 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Adresse e-mail <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@entreprise.fr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              {/* Field 3 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Modèle économique
                </label>
                <select
                  value={formData.businessModel}
                  onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                >
                  <option value="SaaS">SaaS & abonnements récurrents</option>
                  <option value="E-Commerce">E-Commerce & distribution physique</option>
                  <option value="Marketplace">Marketplace & commissions d'apport</option>
                  <option value="Agency / Services">Agence de services ou de conseil</option>
                  <option value="AI / Hardware">IA & infrastructures technologiques</option>
                </select>
              </div>

              {/* Field 4 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Budget de planification visé
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                >
                  <option value="$1,250 - $2,500/mo">1 250 $ - 2 500 $ / mois (FP&A Standard)</option>
                  <option value="$2,500 - $5,000/mo">2 500 $ - 5 000 $ / mois (Croissance Active)</option>
                  <option value="Custom Enterprise / Special Project">Forfait Fixe Unique (Projet Spécial)</option>
                </select>
              </div>
            </div>

            {/* Field 5 */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Précisez votre contexte ou échéances majeures (Optionnel)
              </label>
              <textarea
                rows={3}
                placeholder="ex : Nous préparons un modèle pour notre prochaine levée de fonds en Série A contenant 4 embauches clés et souhaitons des simulations de piste de trésorerie (runway)."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isSubmitting || !formData.companyName || !formData.email}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-indigo-950/20 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transform active:scale-98 transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération de la proposition d'accompagnement...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Générer ma proposition personnalisée
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Custom Proposal Result View */
          <div className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-900/50 rounded-lg text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-sans">Proposition d'Accompagnement Financier</h3>
                  <p className="text-xs text-slate-400 font-mono">Préparé pour : {formData.companyName}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Formule Cible</div>
                <div className="text-sm font-mono font-semibold">{proposalResult.recommendedPlan}</div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Pour répondre au mieux à vos besoins de modélisation pour votre activité de type <strong className="text-white">{formData.businessModel}</strong>, nous vous suggérons la structure suivante préparée pour <strong className="text-white">{formData.companyName}</strong> :
              </p>

              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2.5">Ce qui est inclus :</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proposalResult.deliverables.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono mb-1">Délai estimé pour le premier jet</div>
                  <div className="text-sm font-semibold text-white">{proposalResult.timeline}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono mb-1">Budget recommandé</div>
                  <div className="text-sm font-mono font-bold text-indigo-400">{proposalResult.suggestedRate}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-[11px] text-slate-500 italic max-w-sm">
                *Cette estimation respecte les contraintes et charges de travail actuelles de nos équipes pour ce trimestre.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
                >
                  Modifier les informations
                </button>
                <a
                  href="#pricing-plans"
                  onClick={(e) => {
                    const el = document.getElementById("pricing-plans");
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Confirmer le plan d'abonnement
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
