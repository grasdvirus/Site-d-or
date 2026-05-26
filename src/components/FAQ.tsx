import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { TRANSLATIONS, Language } from "../translations";

interface FAQProps {
  lang?: Language;
  customFaqs?: { question: string; answer: string }[];
}

export default function FAQ({ lang = "fr", customFaqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const t = TRANSLATIONS[lang || "fr"] || TRANSLATIONS.fr;
  const faqs = customFaqs && customFaqs.length > 0 ? customFaqs : (t.faqList || TRANSLATIONS.fr.faqList);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-2xl sleek-shadow-sm overflow-hidden transition-all hover:border-indigo-100/70 hover:sleek-shadow-md"
          >
            <button
              onClick={() => handleToggle(idx)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-1 focus:ring-indigo-100 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 pr-4">
                <HelpCircle className="w-5 h-5 text-[#2d4a22] flex-shrink-0" />
                <span className="font-sans font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight">
                  {faq.question}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? "transform rotate-180 text-[#2d4a22]" : ""
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 ${
                isOpen ? "max-h-[500px] opacity-100 border-t border-slate-50 dark:border-slate-800/60 p-6 pt-5 bg-slate-50/20 dark:bg-slate-950/20" : "max-h-0 opacity-0 pointer-events-none"
              } overflow-hidden`}
            >
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

