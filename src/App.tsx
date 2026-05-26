import { useState } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  ArrowRight, 
  Check, 
  Layers, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  User, 
  Calendar, 
  Mail, 
  MessageSquare, 
  FileSpreadsheet, 
  CheckCircle2, 
  FileText,
  BadgeAlert, 
  Menu, 
  X,
  Clock,
  Briefcase
} from "lucide-react";

import InteractiveModel from "./components/InteractiveModel";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import LeadForm from "./components/LeadForm";

export default function App() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll handler
  const handleScroll = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden antialiased font-sans">
      
      {/* BACKGROUND GLOWS - RECREATES THE LAVENDER GLOW OF THE REFERENCE IMAGE */}
      <div className="absolute top-0 inset-x-0 h-[850px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-200px] left-[15%] w-[600px] h-[600px] rounded-full glow-purple"></div>
        <div className="absolute top-[-100px] right-[10%] w-[550px] h-[550px] rounded-full glow-blue"></div>
        <div className="absolute top-[300px] left-[30%] w-[500px] h-[500px] rounded-full glow-lavender opacity-60"></div>
      </div>

      {/* FLOATING HEADER - STICKY NAV LOOK */}
      <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/90 sleek-shadow-sm px-6 py-4 flex items-center justify-between transition-all">
          
          {/* Logo with fine custom details */}
          <div 
            onClick={() => handleScroll("hero-top")} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1">
              basecase<span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <button 
              onClick={() => handleScroll("how-it-works")} 
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Fonctionnement
            </button>
            <button 
              onClick={() => handleScroll("solutions")} 
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Solutions
            </button>
            <button 
              onClick={() => handleScroll("pricing")} 
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Tarifs
            </button>
            <button 
              onClick={() => handleScroll("faqs")} 
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Action CTA Button */}
          <div className="hidden sm:flex items-center gap-4">
            <button 
              onClick={() => handleScroll("inquiry-form")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Démarrer aujourd'hui
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-1 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu expanded */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="md:hidden mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl p-5 space-y-4"
            >
              <button 
                onClick={() => handleScroll("how-it-works")} 
                className="block w-full text-left py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Fonctionnement
              </button>
              <button 
                onClick={() => handleScroll("solutions")} 
                className="block w-full text-left py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Solutions
              </button>
              <button 
                onClick={() => handleScroll("pricing")} 
                className="block w-full text-left py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                Tarifs
              </button>
              <button 
                onClick={() => handleScroll("faqs")} 
                className="block w-full text-left py-2 font-semibold text-slate-600 hover:text-slate-900"
              >
                FAQ
              </button>
              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => handleScroll("inquiry-form")}
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-center text-sm flex items-center justify-center gap-2 shadow-xs"
                >
                  Démarrer aujourd'hui
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* CORE WRAPPER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 space-y-20 md:space-y-36">

        {/* HERO SECTION - RECREATES TOP HALF */}
        <section id="hero-top" className="text-center space-y-8 max-w-3xl mx-auto pt-4 md:pt-10">
          
          {/* Active indicator status bar */}
          <div className="inline-flex items-center gap-2.5 bg-indigo-50/50 border border-indigo-100/40 rounded-full px-4 py-1.5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-indigo-900 font-mono tracking-wide uppercase">
              2 places restantes pour nos projets de ce trimestre
            </span>
          </div>

          {/* Main Title displaying elegant Serif style */}
          <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-none">
            La modélisation financière
            <span className="block mt-2">
              purement <span className="font-serif italic font-normal text-indigo-600">réinventée</span> 🌪️
            </span>
          </h1>

          {/* Subtext description */}
          <p className="text-sm md:text-md text-slate-500 max-w-xl mx-auto font-medium">
            Des plans de modélisation financière clairs pour tous. Interrompez ou annulez à tout moment. Un abonnement mensuel unique, des scénarios sur mesure illimités.
          </p>

          {/* Call to Actions buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => handleScroll("pricing")}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-full shadow-lg shadow-indigo-500/10 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              Voir les formules
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleScroll("how-it-works")}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              Fonctionnement &rarr;
            </button>
          </div>
        </section>


        {/* INTERACTIVE STEPPERS SYSTEM - "WE DIDN'T REINVENT THE WHEEL..." */}
        <section id="how-it-works" className="space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-500 bg-indigo-50 px-3.5 py-1 rounded-full">
              Processus
            </span>
            <h2 className="font-sans text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Nous n'avons pas réinventé la roue.<br />
              Mais bien la <span className="font-serif italic text-indigo-600 font-normal">modélisation.</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto font-medium leading-relaxed">
              Découvrez à quel point il est simple de recevoir des analyses, scénarios et de véritables tableaux de bord de précision. Sélectionnez une étape ci-dessous pour tester l'impact en direct sur notre simulateur.
            </p>
          </div>

          {/* Steppers Toggle Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-xl mx-auto">
            {/* Step Toggle 1 */}
            <button
              onClick={() => setActiveStep(1)}
              className={`flex-1 min-w-[130px] flex flex-col items-center gap-2 p-3.5 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                activeStep === 1
                  ? "bg-white border-indigo-600 text-indigo-700 ring-2 ring-indigo-50"
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white"
              }`}
            >
              <span className="font-mono text-xs text-slate-400">Étape (1)</span>
              <span className="text-xs">Abonnement & Brief</span>
            </button>

            {/* Step Toggle 2 (Highlighted Active) */}
            <button
              onClick={() => setActiveStep(2)}
              className={`flex-1 min-w-[130px] flex flex-col items-center gap-2 p-3.5 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                activeStep === 2
                  ? "bg-white border-indigo-600 text-indigo-700 ring-2 ring-indigo-50"
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white"
              }`}
            >
              <span className="font-mono text-xs text-indigo-500">Étape (2)</span>
              <span className="text-xs">Simulations en Direct</span>
            </button>

            {/* Step Toggle 3 */}
            <button
              onClick={() => setActiveStep(3)}
              className={`flex-1 min-w-[130px] flex flex-col items-center gap-2 p-3.5 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                activeStep === 3
                  ? "bg-white border-indigo-600 text-indigo-700 ring-2 ring-indigo-50"
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white"
              }`}
            >
              <span className="font-mono text-xs text-slate-400">Étape (3)</span>
              <span className="text-xs">Itérations & Retours</span>
            </button>
          </div>

          {/* Dynamic Stepper Display Cards Grid / Accordions */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"
                >
                  <div className="lg:col-span-5 space-y-6">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                      Étape (1) — Lancement Immédiat
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-slate-900">
                      Inscrivez-vous à une formule ou demandez votre projet dès aujourd'hui.
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-sans">
                      Sélectionnez vos préférences de facturation et accédez instantanément à votre espace projet sur mesure. De là, listez vos demandes, connectez vos sources de données comptables et suivez l'avancement en temps réel.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Sans engagement. Suspendez ou stoppez n'importe quand</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Un coût fixe clair remplaçant le recrutement coûteux d'un CFO</span>
                      </div>
                    </div>
                  </div>

                  {/* Step visual Mockup Card */}
                  <div className="lg:col-span-7 bg-white border border-slate-100/90 rounded-3xl sleek-shadow-lg p-6 md:p-8 space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 block uppercase">Espace Projet Client</span>
                        <h4 className="text-sm font-bold text-slate-800">Abonnement FP&A Mensuel</h4>
                      </div>
                      <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                        ● Brief Lancé
                      </span>
                    </div>

                    <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Demande active :</span>
                        <span className="font-mono bg-indigo-50 text-indigo-700 py-0.5 px-2 rounded font-semibold">
                          Scenario_Dilution_Serie_A.xlsx
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full w-[45%]"></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Reçu aujourd'hui</span>
                        <span>Livraison estimée : 24-48h</span>
                      </div>
                    </div>

                    {/* Simple Subscribe button action wrapper */}
                    <button 
                      onClick={() => handleScroll("pricing")}
                      className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-center text-xs tracking-wider uppercase hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Découvrir nos abonnements &rarr;
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6 max-w-5xl mx-auto"
                >
                  <div className="text-center md:text-left space-y-3 max-w-xl">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded inline-block">
                      Étape (2) — Simulateur Interactif en Direct
                    </span>
                    <h3 className="text-2xl font-bold font-sans tracking-tight text-slate-900">
                      Modèles automatisés intelligents & projections de cohortes détaillées.
                    </h3>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      Modifiez les différentes variables ci-dessous. Ajustez vos objectifs de MRR, d'acquisition (CAC) ou de perte de clients (Churn), et observez les calculs financiers sous-jacents se mettre à jour instantanément.
                    </p>
                  </div>

                  {/* Render the full interactive financial model playground */}
                  <InteractiveModel />
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"
                >
                  <div className="lg:col-span-5 space-y-6">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                      Étape (3) — Itérations Ultra-Rapides
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-slate-900">
                      Nous peaufinons le modèle jusqu'à entière satisfaction.
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-sans">
                      Besoin d’adapter l'agenda des embauches ? De simuler une nouvelle trajectoire de prix ou de séparer le chiffre d'affaires par plan d'abonnement ? Échangez simplement avec votre analyste dédié via votre canal Slack. Les révisions sont illimitées et livrées rapidement.
                    </p>
                    <div className="border-l-2 border-indigo-500 pl-4 py-1 italic text-xs text-slate-500">
                      "Passer de nos services financiers traditionnels à Basecase a réduit le délai de livraison de nos modèles de 10 jours à moins de 30 heures."
                    </div>
                  </div>

                  {/* Step 3 Visual Chat Simulation Mockup */}
                  <div className="lg:col-span-7 bg-white border border-slate-100/90 rounded-3xl sleek-shadow-lg overflow-hidden flex flex-col justify-between min-h-[380px]">
                    <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <div>
                          <p className="text-xs font-bold font-sans">#basecase-collaborateurs</p>
                          <p className="text-[10px] text-slate-400 font-mono">Canal de Conseil Dédié</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono bg-indigo-900 px-2 py-0.5 rounded text-indigo-200">
                        Synchro en Direct
                      </span>
                    </div>

                    {/* Chat Feed */}
                    <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[250px] bg-slate-50/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold font-mono">
                          <span>Vous (Fondateur)</span>
                          <span>15:14</span>
                        </div>
                        <div className="bg-indigo-600 text-white text-xs p-3.5 rounded-2xl rounded-tr-none max-w-sm ml-auto">
                          Hello l'équipe ! Quelques investisseurs souhaiteraient voir un scénario pessimiste. Calculons une simulation avec un CAC 15% plus élevé et une croissance plus lente de 5%. Quel impact sur notre trésorerie disponible ?
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold font-mono">
                          <span>Analyste Principal Basecase</span>
                          <span>15:55</span>
                        </div>
                        <div className="bg-white border border-slate-100 text-slate-700 text-xs p-3.5 rounded-2xl rounded-tl-none max-w-sm shadow-2xs space-y-2">
                          <p>C'est en cours ! J'ai mis à jour la table de sensibilité de trésorerie sur vos projections de conseil. Voici les principaux changements :</p>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] font-mono space-y-1 text-slate-500">
                            <div>• Trésorerie (Runway) : 18 mois &rarr; 14 mois</div>
                            <div>• Cible de financement recommandée : 1.8M $</div>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 mt-2">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Scenario_Worstcase_Board_v2.xlsx
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Input simulator */}
                    <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                      <input 
                        type="text" 
                        disabled
                        placeholder="Demandes de révisions illimitées sur toutes les formules..." 
                        className="w-full text-xs bg-slate-50 text-slate-400 px-3 py-2.5 rounded-xl border border-slate-100 outline-none" 
                      />
                      <button disabled className="p-2 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>


        {/* VALUE PROPOSITIONS SECTION 2 - "THE ONLY FINANCIAL MODELING SERVICE YOU'LL NEED" */}
        <section id="solutions" className="space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-500 bg-indigo-50 px-3.5 py-1 rounded-full">
              Piliers
            </span>
            <h2 className="font-sans text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Le seul service de modélisation<br />
              <span className="font-serif italic text-indigo-600 font-normal">financière dont vous aurez besoin.</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Nous condensons toute la puissance d'un pôle de planification financière d'entreprise au sein d'un tableau de bord de projet simple.
            </p>
          </div>

          {/* Grid of 4 polished features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 sleek-shadow-sm hover:sleek-shadow-md transition-all space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-md font-bold text-slate-900 font-sans">Formats Sources Modifiables</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Recevez des fichiers Microsoft Excel ou Google Sheets entièrement modifiables, sans formule verrouillée ni macros opaques. Vous êtes à 100 % propriétaire.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 sleek-shadow-sm hover:sleek-shadow-md transition-all space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
              <div className="p-3 bg-violet-50 rounded-xl text-violet-600 w-fit">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-md font-bold text-slate-900 font-sans">Analystes d'Élite</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Votre projet est piloté directement par d'anciens banquiers d'affaires, directeurs en capital-risque (VC) et directeurs financiers expérimentés.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 sleek-shadow-sm hover:sleek-shadow-md transition-all space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-md font-bold text-slate-900 font-sans">Réactivité de Pointe</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Une livraison moyenne sous 48h. Évitez les réunions de cadrage interminables et formalisez vos demandes directement dans votre outil.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 sleek-shadow-sm hover:sleek-shadow-md transition-all space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
              <div className="p-3 bg-violet-50 rounded-xl text-violet-600 w-fit">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-md font-bold text-slate-900 font-sans">Besoins Flexibles</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ajoutez autant de demandes ou de scénarios que nécessaire. Réorganisez vos priorités ou mettez votre formule en pause selon vos besoins financiers.
              </p>
            </div>
            
          </div>
        </section>


        {/* "AT BASECASE..." STORY SECTION WITH ALUMNI TESTIMONIALS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-slate-50 border border-slate-100/90 sleek-shadow-md p-8 md:p-12 rounded-3xl">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-full">
              Notre Vision
            </span>
            <div className="space-y-3">
              <h3 className="font-serif italic text-3xl md:text-4xl text-slate-900 font-normal">Chez basecase,</h3>
              <p className="text-sm font-semibold text-slate-800 tracking-tight leading-relaxed">
                Nous pensons que les jeunes entreprises innovantes ne devraient pas avoir à choisir entre des cabinets de conseil lents et coûteux ou des freelances non certifiés.
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Les cabinets traditionnels sont lents, facturent à l’heure et consomment une énergie précieuse lors des phases critiques de financement. Basecase élimine ces frictions grâce à un abonnement mensuel transparent et hautement interactif. Mettez à jour vos scénarios à minuit, recevez vos livrables en quelques jours et pilotez en toute confiance.
            </p>
            <div>
              <button 
                onClick={() => handleScroll("pricing")}
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3.5 rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Découvrir nos Formules &rarr;
              </button>
            </div>
          </div>

          {/* Testimonial profile cards wrapper */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Portrait Card 1 */}
            <div className="bg-white rounded-2xl border border-slate-100/90 p-6 flex flex-col justify-between space-y-6 sleek-shadow-sm hover:sleek-shadow-md transition-all">
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Nous avions trois calculs de scénarios complexes à présenter à nos investisseurs. Basecase a modélisé l'ensemble de notre SaaS et a répondu aux questions des investisseurs en moins de 48 heures."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center font-mono shadow-inner shadow-indigo-700">
                  MP
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans text-slate-900">Michael Pierce</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Fondateur, Pierce Ventures</p>
                </div>
              </div>
            </div>

            {/* Portrait Card 2 */}
            <div className="bg-white rounded-2xl border border-slate-100/90 p-6 flex flex-col justify-between space-y-6 sleek-shadow-sm hover:sleek-shadow-md transition-all">
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "La possibilité de suspendre l'abonnement change absolument tout. Nous l'avons mis en pause après avoir modélisé notre Série A, puis réactivé 4 mois plus tard pour notre audit (due diligence)."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center font-mono shadow-inner shadow-violet-700">
                  SJ
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans text-slate-900">Sarah Jenkins</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Responsable FP&A, Cloudflow Inc.</p>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* PRICING ENGINE - "PRICES MATCH YOUR GROWTH" */}
        <section id="pricing" className="space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-500 bg-indigo-50 px-3.5 py-1 rounded-full">
              Tarifs
            </span>
            <h2 className="font-sans text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Des structures tarifaires adaptées<br />
              <span className="font-serif italic text-indigo-600 font-normal">à votre croissance.</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Trouvez la formule parfaite pour les objectifs de votre organisation. Changez, suspendez ou annulez à tout moment.
            </p>
          </div>

          <Pricing />
        </section>


        {/* DETAILED LEAD INITIATOR INTAKE-FORM */}
        <section id="inquiry-form" className="scroll-mt-6">
          <LeadForm />
        </section>


        {/* FAQS SECTION */}
        <section id="faqs" className="space-y-12 scroll-mt-6">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-500 bg-indigo-50 px-3.5 py-1 rounded-full">
              Base de Connaissances
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Questions <span className="font-serif italic text-indigo-600 font-normal">Fréquentes</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">
              Paramètres et explications simples concernant nos abonnements, essais, modèles et livrables.
            </p>
          </div>

          <FAQ />
        </section>

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 md:space-y-12">
          
          {/* Top Half */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 border-b border-slate-800 pb-8">
            <div className="space-y-3.5 max-w-sm">
              <span className="font-sans font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                basecase<span className="block w-2 h-2 rounded-full bg-indigo-500"></span>
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Abonnement de modélisation financière d'élite et conseil en transaction. Conçu par d'anciens directeurs FP&A chevronnés pour les entreprises modernes.
              </p>
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2 rounded-xl text-slate-500 text-[10px] font-mono w-fit">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Heure Système Active : 2026-05-26 (UTC)</span>
              </div>
            </div>

            {/* Quick Links Nav */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-semibold">
              <div className="space-y-3">
                <p className="text-slate-200 uppercase tracking-widest text-[9px] font-mono font-bold">Services</p>
                <ul className="space-y-2 text-slate-400 font-medium">
                  <li><button onClick={() => handleScroll("how-it-works")} className="hover:text-white transition-colors cursor-pointer text-left">Fonctionnement</button></li>
                  <li><button onClick={() => handleScroll("solutions")} className="hover:text-white transition-colors cursor-pointer text-left">Solutions sur Mesure</button></li>
                  <li><button onClick={() => handleScroll("pricing")} className="hover:text-white transition-colors cursor-pointer text-left">Formules d'Abonnement</button></li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-slate-200 uppercase tracking-widest text-[9px] font-mono font-bold">Contact</p>
                <ul className="space-y-2 text-slate-400 font-medium">
                  <li><span className="font-mono text-[11px] text-slate-300">grasdvirus@gmail.com</span></li>
                  <li><span className="font-sans text-xs">Bureau Principal, Londres, UK</span></li>
                  <li><button onClick={() => handleScroll("inquiry-form")} className="text-indigo-400 hover:text-indigo-300 font-bold">Demander un Rappel &rarr;</button></li>
                </ul>
              </div>

              <div className="space-y-3 col-span-2 sm:col-span-1">
                <p className="text-slate-200 uppercase tracking-widest text-[9px] font-mono font-bold">Légal</p>
                <ul className="space-y-2 text-slate-400 font-medium">
                  <li><a href="#terms" className="hover:text-white transition-colors font-medium">Conditions d'Utilisation</a></li>
                  <li><a href="#privacy" className="hover:text-white transition-colors font-medium">Politique de Confidentialité</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Half */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600 font-medium font-mono">
            <p>© {new Date().getFullYear()} basecase.co. Tous droits réservés. Conçu pour Google AI Studio Build.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 transition-colors">Qualité Institutionnelle</span>
              <span>•</span>
              <span className="hover:text-slate-400 transition-colors">Espace Projet Chiffré & Sécurisé</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

