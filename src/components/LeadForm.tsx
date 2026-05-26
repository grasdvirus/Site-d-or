import React, { useState } from "react";
import { Send, CheckCircle2, ShieldAlert, ChevronRight, Sparkles, Loader2, Hammer } from "lucide-react";

export default function LeadForm() {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    timberType: "Classic Walnut",
    sizing: "140 x 70 cm",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalResult, setProposalResult] = useState<null | {
    recommendedSetup: string;
    timeline: string;
    details: string[];
    priceQuote: string;
  }>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName || !formData.email) return;

    setIsSubmitting(true);

    // Simulate bespoke workbench construction calculation
    setTimeout(() => {
      let recommendedSetup = "Console nexus. Walnut Studio";
      let priceQuote = "680€";
      let timeline = "Expédié sous 10 jours (Fait main)";
      let details = [
        `Plateau de table en Noyer d'Amérique (épaisseur 3.5cm)`,
        "Pieds métalliques biseautés thermolaqués à texture mate",
        "Passage de câbles central invisible usiné sous le plateau",
        "Kit d'entretien de cire de carnauba biologique offert"
      ];

      if (formData.sizing === "180 x 80 cm (Large Workspace)") {
        recommendedSetup = "Table nexus. Pro Architect Slate";
        priceQuote = "940€";
        timeline = "Expédié sous 14 jours (Usinage précis)";
        details = [
          `Plateau king-size de 180cm de long, surface protégée anti-taches`,
          "Structure portante ultra-robuste en acier carbone brossé",
          "Boîtiers d'amarrage multiprise et caches-câbles magnétiques",
          "Incrustation de patte de cuir pleine fleur sur le tiroir d'angle"
        ];
      } else if (formData.timberType === "Matte Charcoal Oak") {
        recommendedSetup = "Console nexus. Prestige Oak Dark";
        priceQuote = "820€";
        timeline = "Expédié sous 12 jours (Teinture artisanale)";
        details = [
          "Chêne fossile massif traité aux huiles pigmentées anthracites",
          "Passage de câbles rotatif en aluminium brossé",
          "Structure anti-fléchissement dissimulée sous le châssis",
          "Huile spéciale d'entretien préventif incluse dans l'emballage"
        ];
      }

      setProposalResult({
        recommendedSetup,
        timeline,
        details,
        priceQuote,
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleReset = () => {
    setProposalResult(null);
    setFormData({
      userName: "",
      email: "",
      timberType: "Classic Walnut",
      sizing: "140 x 70 cm",
      notes: "",
    });
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-2xl border border-slate-900 text-left">
      {/* Visual neon ambient decoration - Sleek styling */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-mono tracking-widest uppercase text-indigo-400 bg-indigo-950/60 px-3.5 py-1.5 rounded-full border border-indigo-900/50">
            Atelier sur Mesure
          </span>
          <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight">
            Définissez votre bureau <span className="font-serif italic text-indigo-300 font-normal">signature</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Nous fabriquons des consoles de travail d'élite ajustées à vos mesures. Configurez vos essences de bois préférées et simulez l'assemblage.
          </p>
        </div>

        {!proposalResult ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Field 1 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Votre Prénom & Nom <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex : Alexandre Dupont"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              {/* Field 2 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Adresse e-mail <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alexandre@domaine.fr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              {/* Field 3 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Essence de Bois Noble
                </label>
                <select
                  value={formData.timberType}
                  onChange={(e) => setFormData({ ...formData, timberType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white cursor-pointer outline-none transition-all"
                >
                  <option value="Classic Walnut">Noyer d'Amérique Massif (Chaleureux & Veiné)</option>
                  <option value="Matte Charcoal Oak">Chêne d'Europe Charbon Mat (Sombre & Sophistiqué)</option>
                  <option value="Natural Arctic Maple">Érable Arctique Clair (Lumineux & Minimaliste)</option>
                </select>
              </div>

              {/* Field 4 */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Dimensions du Plateau
                </label>
                <select
                  value={formData.sizing}
                  onChange={(e) => setFormData({ ...formData, sizing: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white cursor-pointer outline-none transition-all"
                >
                  <option value="140 x 70 cm">140 x 70 cm (Compact Standard)</option>
                  <option value="180 x 80 cm (Large Workspace)">180 x 80 cm (Studio Architecte)</option>
                  <option value="200 x 90 cm (Masterpiece)">200 x 90 cm (Chef de Projet)</option>
                </select>
              </div>
            </div>

            {/* Field 5 */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Précisez des découpes spécifiques ou demandes ergonomiques (Optionnel)
              </label>
              <textarea
                rows={3}
                placeholder="ex : Je souhaiterais un trou d'encastrement sur mesure pour faire passer un bras de moniteur à gaz au centre, et une rigole d'angle pour mes stylos..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isSubmitting || !formData.userName || !formData.email}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-indigo-950/20 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transform active:scale-98 transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calcul des configurations géométriques...
                  </>
                ) : (
                  <>
                    <Hammer className="w-4 h-4 text-indigo-300" />
                    Calculer le devis de fabrication &rarr;
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Custom Proposal Result View */
          <div className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-6 md:p-8 space-y-6 animate-fadeIn text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-900/50 rounded-lg text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-sans">Devis de l'Atelier nexus. Woodwork</h3>
                  <p className="text-xs text-slate-400 font-mono">Conçu pour : {formData.userName}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Modèle Recommandé</div>
                <div className="text-sm font-mono font-semibold">{proposalResult.recommendedSetup}</div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Voici les spécificités de montage retenues pour votre essence <strong className="text-white">{formData.timberType}</strong> aux dimensions de <strong className="text-white">{formData.sizing}</strong> :
              </p>

              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2.5">Inclus en fabrication :</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proposalResult.details.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono mb-1">Délai artisanal estimé</div>
                  <div className="text-sm font-semibold text-white">{proposalResult.timeline}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono mb-1">Estimation du prix de fabrication</div>
                  <div className="text-sm font-mono font-bold text-indigo-400">{proposalResult.priceQuote}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-[11px] text-slate-500 italic max-w-sm">
                *TVA incluse. Bois certifié FSC issu de forêts à aménagement durable.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
                >
                  Modifier les options
                </button>
                <button
                  type="button"
                  onClick={() => alert("Votre demande d'atelier sur mesure a été enregistrée ! Un designer de nexus prendra contact par mail sous 24h.")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Commander mon Bureau
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
