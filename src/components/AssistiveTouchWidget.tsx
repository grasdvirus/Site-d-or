import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RefreshCw, 
  Tag, 
  PhoneCall, 
  MessageSquare, 
  X, 
  Copy, 
  Check, 
  Send, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Mail, 
  MapPin, 
  Search,
  ExternalLink,
  ChevronRight,
  GripVertical,
  Sliders,
  Settings
} from "lucide-react";

interface AssistiveTouchProps {
  onRefreshSite?: () => void;
  onApplyPromoCode?: (code: string) => boolean;
  onSearchProduct?: (query: string) => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  adminEmail?: string;
  adminPhone?: string;
  siteName?: string;
  userGoogleEmail?: string;
}

interface ChatMessage {
  id: string;
  sender: "client" | "admin";
  text: string;
  timestamp: string;
  emailStatus?: "sending" | "delivered";
}

export const AssistiveTouchWidget: React.FC<AssistiveTouchProps> = ({
  onRefreshSite,
  onApplyPromoCode,
  onSearchProduct,
  onOpenAdmin,
  isAdmin = false,
  adminEmail = "devcristan3@gmail.com",
  adminPhone = "+225 07 04 54 29 09",
  siteName = "Sitedor Art & Design",
  userGoogleEmail = "grasdvirus@gmail.com"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "promo" | "contact">("menu");

  // Dragging state to avoid accidental clicks when sliding vertically
  const [isDragging, setIsDragging] = useState(false);

  // Promo code / Paste Search fast input
  const [fastCode, setFastCode] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Refresh handler
  const handleRefresh = () => {
    if (onRefreshSite) {
      onRefreshSite();
    } else {
      window.location.reload();
    }
  };

  // Direct search and redirect helper (no secondary confirmation needed)
  const handleExecuteSearchAndRedirect = (codeText: string) => {
    const clean = codeText.trim();
    if (!clean) return false;

    setFastCode(clean.toUpperCase());

    // 1. Try applying as promo code if valid
    if (onApplyPromoCode) {
      onApplyPromoCode(clean);
    }

    // 2. Perform search & redirect directly to matching product or catalog
    if (onSearchProduct) {
      onSearchProduct(clean);
    }

    // 3. Automatically close modal for instant seamless navigation
    setIsOpen(false);
    return true;
  };

  // Automatic paste & search handler
  const handlePasteAndSearch = async (overrideText?: string) => {
    try {
      let cleanText = overrideText ? overrideText.trim() : "";
      
      if (!cleanText && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        cleanText = text ? text.trim() : "";
      }

      if (!cleanText) {
        setActiveTab("promo");
        setPromoFeedback({ type: "error", msg: "Le presse-papier est actuellement vide. Saisissez votre code ci-dessous." });
        setTimeout(() => setPromoFeedback(null), 3500);
        return false;
      }

      return handleExecuteSearchAndRedirect(cleanText);
    } catch (err) {
      setActiveTab("promo");
      setPromoFeedback({
        type: "error",
        msg: "Impossible d'accéder au presse-papier automatique. Veuillez coller votre code ci-dessous."
      });
      setTimeout(() => setPromoFeedback(null), 3500);
      return false;
    }
  };

  // Manual Promo submission
  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastCode.trim()) return;
    handleExecuteSearchAndRedirect(fastCode);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {}
  };

  return (
    <>
      {/* Floating Touch Button (iOS AssistiveTouch Style - Vertical Drag Supported) */}
      <motion.div 
        drag="y"
        dragConstraints={{ top: -550, bottom: 40 }}
        dragElastic={0.08}
        dragSnapToOrigin={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 120)}
        className="fixed bottom-8 right-6 z-50 select-none touch-none flex items-center gap-1.5"
      >
        {/* Subtle vertical drag indicator handle */}
        <div className="flex flex-col gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-white dark:text-slate-300">
          <GripVertical className="w-4 h-4" />
        </div>

        <motion.button
          type="button"
          onClick={() => {
            if (!isDragging) {
              setIsOpen(!isOpen);
              if (!isOpen) setActiveTab("menu");
            }
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="w-14 h-14 rounded-full bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-2xl border-2 border-white/30 dark:border-slate-500 text-white flex items-center justify-center shadow-2xl hover:shadow-emerald-500/30 cursor-pointer relative group transition-shadow"
          title="Bouton AssistiveTouch (Glissez verticalement pour déplacer)"
        >
          {/* Outer glowing ring animation */}
          <span className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" />

          {/* Concentric AssistiveTouch rings */}
          <div className="w-9 h-9 rounded-full border-2 border-white/95 dark:border-white/90 flex items-center justify-center bg-white/15 dark:bg-slate-700/50 shadow-inner">
            <div className="w-4 h-4 rounded-full bg-white dark:bg-emerald-400 shadow-md transition-transform group-hover:scale-110" />
          </div>
        </motion.button>
      </motion.div>

      {/* AssistiveTouch Window / Volet Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 25 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
            >
              {/* Top Bar Header */}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Assistance Touche Rapide
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {activeTab === "menu" ? "Menu d'actions" : activeTab === "promo" ? "Coller Code & Recherche" : "Informations Site"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab !== "menu" && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("menu")}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Retour
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body Content depending on Active Tab */}
              <div className="p-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
                {/* 1. MAIN ACTION MENU GRID */}
                {activeTab === "menu" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                      Sélectionnez une action instantanée pour interagir avec le catalogue et le support.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Button 1: Actualiser le site */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRefresh}
                        className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md hover:shadow-emerald-500/20 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer border border-emerald-400/30"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                          <RefreshCw className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Actualiser le Site</span>
                        <span className="text-[9px] text-emerald-100/80 font-mono">Recharger le catalogue</span>
                      </motion.button>

                      {/* Button 2: Coller Code & Recherche Instantanée */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={async () => {
                          await handlePasteAndSearch();
                        }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md hover:shadow-amber-500/20 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer border border-amber-400/30"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Coller Code / Produit</span>
                        <span className="text-[9px] text-amber-100/80 font-mono">Lire presse-papier & Chercher</span>
                      </motion.button>

                      {/* Button 3: Coordonnées du Site */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab("contact")}
                        className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md hover:shadow-blue-500/20 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer border border-blue-400/30"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                          <PhoneCall className="w-5 h-5 text-white text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Coordonnées Site</span>
                        <span className="text-[9px] text-blue-100/80 font-mono">Email, Tél & Adresse</span>
                      </motion.button>
                    </div>

                    {/* Admin Portal Direct Action Button (Exclusive to Administrator Account) */}
                    {isAdmin && onOpenAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAdmin();
                          setIsOpen(false);
                        }}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Ouvrir le Portail d'Administration (Admin)
                      </button>
                    )}
                  </div>
                )}

                {/* 2. PROMO CODE & FAST CLIPBOARD SEARCH */}
                {activeTab === "promo" && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-left space-y-2">
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Recupération Presse-Papier & Recherche
                      </h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Cliquez sur "Coller du presse-papier" pour récupérer automatiquement le dernier code ou mot-clé copié, l'appliquer ou filtrer le catalogue de meuble !
                      </p>
                    </div>

                    <form onSubmit={handlePromoSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Code Promo ou Nom du Produit
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fastCode}
                            onChange={(e) => setFastCode(e.target.value.toUpperCase())}
                            onPaste={(e) => {
                              const pasted = e.clipboardData.getData("text");
                              if (pasted && pasted.trim()) {
                                e.preventDefault();
                                handleExecuteSearchAndRedirect(pasted);
                              }
                            }}
                            placeholder="ex : VIP20 ou NX892A7K"
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handlePasteAndSearch()}
                            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Coller & Chercher
                          </button>
                        </div>
                      </div>

                      {promoFeedback && (
                        <div className={`p-3 rounded-xl text-xs font-bold ${
                          promoFeedback.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse"
                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}>
                          {promoFeedback.msg}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Rechercher / Valider
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. SITE CONTACT COORDINATES */}
                {activeTab === "contact" && (
                  <div className="space-y-3.5 text-left">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Coordonnées officielles de <strong>{siteName}</strong> :
                    </p>

                    <div className="space-y-2.5">
                      {/* Email - Directional link */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 group hover:border-blue-400 transition-colors">
                        <a 
                          href={`mailto:${adminEmail}`}
                          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
                          title="Cliquer pour envoyer un email directement"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                              Adresse Email Officielle
                              <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block underline decoration-dotted underline-offset-2">
                              {adminEmail}
                            </span>
                          </div>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(adminEmail, "email")}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "email" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedField === "email" ? "Copié !" : "Copier"}
                        </button>
                      </div>

                      {/* Phone / WhatsApp - Directional link */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 group hover:border-emerald-400 transition-colors">
                        <a 
                          href={`tel:${adminPhone.replace(/\s+/g, '')}`}
                          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
                          title="Cliquer pour composer le numéro directement"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
                            <PhoneCall className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                              Téléphone & WhatsApp
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block underline decoration-dotted underline-offset-2">
                              {adminPhone}
                            </span>
                          </div>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(adminPhone, "phone")}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "phone" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedField === "phone" ? "Copié !" : "Copier"}
                        </button>
                      </div>

                      {/* Location (Siège) - First location only */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-mono text-slate-400 uppercase">Siège & Showroom</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">Abidjan, Cocody Riviera</span>
                          </div>
                        </div>
                      </div>

                      {/* Hours */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono text-slate-400 uppercase">Horaires d'ouverture</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">7/7 : 08h00 - 00h00 (GMT)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistiveTouchWidget;
