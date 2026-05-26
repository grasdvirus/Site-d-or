import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "Pourquoi ne pas embaucher un CFO à plein temps ou un analyste financier junior ?",
      answer: "Un CFO de haut niveau à plein temps peut coûter plus de 220 000 $ par an plus capitaux propres, et les analystes juniors qualifiés nécessitent toujours un encadrement intensif. Notre formule offre un soutien d'élite FP&A par de véritables experts du capital-risque, disponible immédiatement. De plus, comme vous pouvez suspendre ou annuler à tout moment, vous ne payez pas pour les périodes creuses lorsque vous ne préparez pas de levées de fonds ou de réunions de conseil d'administration.",
    },
    {
      question: "Sur quels logiciels et technologies concevez-vous vos modèles ?",
      answer: "Nous créons principalement des modèles propres et entièrement dynamiques dans Microsoft Excel et Google Sheets afin de garantir une transparence totale et une compatibilité maximale avec votre équipe et vos investisseurs. De plus, nous prenons en charge les outils comme causal, Fathom, ainsi que des tableaux de bord dynamiques connectés directement à vos intégrations Stripe ou QuickBooks.",
    },
    {
      question: "Quel est le délai de livraison standard pour les mises à jour ?",
      answer: "Les mises à jour de modèles standards (comme l'ajout d'un scénario de recrutement, le décalage du plan d'embauche ou l'actualisation d'une ligne de budget marketing) sont généralement réalisées en 24 à 48 heures. Les modèles complets complexes créés à partir de zéro sont livrés par étapes clés au cours de la première semaine.",
    },
    {
      question: "Comment fonctionne concrètement l'option 'Pause' ?",
      answer: "Nous comprenons que les besoins en planification financière fluctuent. Si vous vous abonnez, peaufinez votre modèle de base pour votre pitch, puis faites face à quelques semaines calmes avant le prochain conseil, vous pouvez mettre votre abonnement en pause. Votre cycle de facturation restant est conservé et vous reprenez exactement là où vous l'avez laissé quand vous le souhaitez.",
    },
    {
      question: "Y a-t-il une limite au nombre de demandes que je peux soumettre ?",
      answer: "Aucune. Vous pouvez ajouter autant de demandes de modélisation que vous le souhaitez dans votre file d'attente. Elles seront traitées une par une dans l'ordre de priorité défini sous la formule Simple Mod, ou deux à la fois simultanément sous la formule Growth.",
    },
  ];

  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-100/90 rounded-2xl sleek-shadow-sm overflow-hidden transition-all hover:border-indigo-100/70 hover:sleek-shadow-md"
          >
            <button
              onClick={() => handleToggle(idx)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-1 focus:ring-indigo-100"
            >
              <div className="flex items-center gap-3.5 pr-4">
                <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <span className="font-sans font-semibold text-slate-800 text-sm md:text-base leading-tight">
                  {faq.question}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? "transform rotate-180 text-indigo-500" : ""
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 ${
                isOpen ? "max-h-[500px] opacity-100 border-t border-slate-50 p-6 pt-5 bg-slate-50/20" : "max-h-0 opacity-0 pointer-events-none"
              } overflow-hidden`}
            >
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
