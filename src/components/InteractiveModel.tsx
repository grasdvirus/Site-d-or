import { useState, useMemo, useEffect } from "react";
import { Sliders, Sparkles, Check, RefreshCcw, Armchair, SlidersHorizontal, ShoppingBag, Send, X, AlertTriangle } from "lucide-react";
import { Product } from "../types";
import { TRANSLATIONS, Language, Currency, formatPrice } from "../translations";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface InteractiveModelProps {
  products: Product[];
  onAddToCart: (product: Product, color: { name: string; hex: string }, variant: string, customPrice: number) => void;
  lang?: Language;
  currency?: Currency;
  customOptions?: Record<string, { label: string; values: string[] }[]>;
  currentUser?: any;
}

export default function InteractiveModel({ 
  products = [], 
  onAddToCart, 
  lang = "fr", 
  currency = "CFA",
  customOptions = {},
  currentUser
}: InteractiveModelProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Selected product from the shop + support for fully custom design option
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Check if fully custom option is selected
  const isCustomSpecialAtelier = selectedProductId === "custom_special_atelier";

  // Find the active product dynamically
  const activeProduct = useMemo(() => {
    if (isCustomSpecialAtelier) return null;
    if (!products || products.length === 0) return null;
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId, isCustomSpecialAtelier]);

  // Handle default selection when products load
  useEffect(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Configurator options
  const basePrice = useMemo(() => {
    if (isCustomSpecialAtelier) return 250000; // Custom masterpieces base price in CFA
    return activeProduct ? activeProduct.price : 200000;
  }, [activeProduct, isCustomSpecialAtelier]);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  // Available warm organic color swatches matching the active product colors or fallbacks
  const colors = useMemo(() => {
    if (activeProduct && activeProduct.colors && activeProduct.colors.length > 0) {
      return activeProduct.colors.map(col => ({
        name: col.name,
        hex: col.hex,
        colorClass: ""
      }));
    }

    // Default premium selection swatches
    return [
      { name: "Vert Forêt (Signature)", hex: "#2d4a22" },
      { name: "Sauge Doux (Sleek)", hex: "#84a98c" },
      { name: "Orange Terre Cuite", hex: "#c2410c" },
      { name: "Noir Anthracite", hex: "#111827" },
      { name: "Sable Naturel", hex: "#e5e7eb" },
    ];
  }, [activeProduct]);

  // Dynamic Options (Characteristics) for Selected Product / Category
  const dynamicOptions = useMemo(() => {
    // 1. Check if we have dynamic options explicitly configured in Admin
    if (selectedProductId && customOptions && customOptions[selectedProductId]) {
      return customOptions[selectedProductId];
    }
    
    // Otherwise provide smart category-based suggestions automatically 
    let category = "Mobilier";
    let name = "";
    if (isCustomSpecialAtelier) {
      category = "Sur-Mesure";
    } else if (activeProduct) {
      category = activeProduct.category || "Mobilier";
      name = activeProduct.name || "";
    }

    const catUpper = category.toUpperCase();
    const nameUpper = name.toUpperCase();

    // Clothes / Vêtements Category
    if (catUpper.includes("VÊT") || catUpper.includes("CLOTH") || catUpper.includes("MODE") || catUpper.includes("APPAREL") || catUpper.includes("FRIPE") || nameUpper.includes("VÊT")) {
      return [
        { label: "Taille de vêtements", values: ["M (Standard)", "S (Petit)", "L (Large)", "XL (Très Large)", "XXL (Master-Size)", "Autre (Saisir manuellement)..."] },
        { label: "Matière & Tissu", values: ["Coton Biologique d'Atelier", "Lin Sauvage Éco-conçu", "Soie Naturelle Sculptée", "Laine Mérinos Premium", "Autre (Saisir manuellement)..."] },
        { label: "Style de Coupe", values: ["Coupe Ajustée / Slim", "Oversize Urbain Moderne", "Classic Straight Fit", "Autre (Saisir manuellement)..."] }
      ];
    }

    // Tech / Electronics Category
    if (catUpper.includes("ÉLEC") || catUpper.includes("ELEC") || catUpper.includes("TECH") || catUpper.includes("HI-FI") || catUpper.includes("DIGITAL") || nameUpper.includes("PHONE") || nameUpper.includes("ORDINATEUR")) {
      return [
        { label: "Capacité Stockage", values: ["256 Go SSD Ultra-Fast", "128 Go SSD", "512 Go SSD", "1 To NVMe Elite", "Autre (Saisir manuellement)..."] },
        { label: "Mémoire Vive (RAM)", values: ["16 Go RAM DDR5", "8 Go RAM", "32 Go RAM Haute Fréquence", "Autre (Saisir manuellement)..."] },
        { label: "Processeur & GPU", values: ["Core i7 Pro Octa-Core", "Core i5 Efficace", "Core i9 Surpuissant", "Autre (Saisir manuellement)..."] }
      ];
    }

    // Default Fallback - Eco Wood & Furniture design specs
    return [
      { label: "Rembourrage / Densité", values: ["Mousse Haute Résilience Premium", "Duvet Confort d'Artisan", "Mousse à mémoire de forme", "Autre (Saisir manuellement)..."] },
      { label: "Structure & Piétement", values: ["Bois de Chêne Massif Noble", "Noyer Sculpté à la main", "Acier Noir Industriel", "Métal Laiton Brossé", "Autre (Saisir manuellement)..."] },
      { label: "Revêtement", values: ["Velours Côtelé d'Exception", "Laine Bouclée Soft", "Cuir Pleine Fleur d'Italie", "Autre (Saisir manuellement)..."] }
    ];
  }, [selectedProductId, activeProduct, customOptions, isCustomSpecialAtelier]);

  // Selected specs configuration state
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [manualSpecs, setManualSpecs] = useState<Record<string, string>>({});

  // Reset selected specifications when dynamic options change
  useEffect(() => {
    const defaultSpecs: Record<string, string> = {};
    dynamicOptions.forEach(opt => {
      defaultSpecs[opt.label] = opt.values[0] || "";
    });
    setSelectedSpecs(defaultSpecs);
    setManualSpecs({});
  }, [dynamicOptions]);

  // Ensure color index is always bounded
  useEffect(() => {
    setSelectedColorIndex(0);
  }, [colors]);

  // Price calculations
  const finalPrice = useMemo(() => {
    // Basic custom specs don't add price unless custom options are chosen
    let total = basePrice;
    
    // Add subtle premium fee for manually typed specs
    const hasManual = Object.entries(selectedSpecs).some(([label, val]) => String(val).includes("Saisir manuellement") && manualSpecs[label]);
    if (hasManual) {
      total += 15000; // +15,000 CFA for manual customization engineering
    }
    
    return total;
  }, [basePrice, selectedSpecs, manualSpecs]);

  // Custom order submission States
  const [isCustomOrderOpen, setIsCustomOrderOpen] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  const [customOrderForm, setCustomOrderForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    desiredProductName: ""
  });

  const handleReset = () => {
    setSelectedColorIndex(0);
    const defaultSpecs: Record<string, string> = {};
    dynamicOptions.forEach(opt => {
      defaultSpecs[opt.label] = opt.values[0] || "";
    });
    setSelectedSpecs(defaultSpecs);
    setManualSpecs({});
    setIsAdded(false);
  };

  const handleAddToCart = () => {
    const colorObj = colors[selectedColorIndex] || { name: "Naturel", hex: "#2b2b2b" };
    
    const labelSpecs = Object.entries(selectedSpecs).map(([label, val]) => {
      let finalVal = String(val);
      if (String(val).includes("Saisir manuellement") && manualSpecs[label]) {
        finalVal = `Personnalisé: ${manualSpecs[label]}`;
      }
      return `${label}: ${finalVal}`;
    });

    const mockProduct: Product = {
      id: isCustomSpecialAtelier ? `custom-masterpiece-${Date.now()}` : `custom-${activeProduct?.id || "product"}-${Date.now()}`,
      name: isCustomSpecialAtelier 
        ? `Sur-Mesure : ${customOrderForm.desiredProductName || "Création unique d'Atelier"}`
        : `Sur-Mesure : ${activeProduct?.name || "Meuble unique"}`,
      tagline: `Modèle d'exception fabriqué à la demande. Couleur ${colorObj.name}.`,
      description: `Création sur-mesure d'Atelier. Options : ${labelSpecs.join(" | ")}`,
      price: finalPrice,
      image: activeProduct?.image || "",
      category: isCustomSpecialAtelier ? "Sur-Mesure" : activeProduct?.category || "Lounge",
      colors: [colorObj],
      variantsLabel: "Options d'artisanat",
      variants: labelSpecs,
      features: labelSpecs,
      stock: 1
    };

    onAddToCart(mockProduct, colorObj, labelSpecs.join(", "), finalPrice);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleCustomOrderSubmit = async (e: any) => {
    e.preventDefault();
    if (!customOrderForm.fullName || !customOrderForm.phone || !customOrderForm.city || !customOrderForm.address) {
      alert("Veuillez remplir tous les champs requis avec un astérisque (*).");
      return;
    }
    if (isCustomSpecialAtelier && !customOrderForm.desiredProductName) {
      alert("Veuillez renseigner l'intitulé du produit ou projet que vous désirez.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderId = `SM-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const labelSpecs = Object.entries(selectedSpecs).map(([label, val]) => {
        let finalVal = String(val);
        if (String(val).includes("Saisir manuellement") && manualSpecs[label]) {
          finalVal = `Personnalisé : ${manualSpecs[label]}`;
        }
        return `${label} : ${finalVal}`;
      });

      const colorObj = colors[selectedColorIndex] || { name: "Noir mat", hex: "#000000" };
      const prodName = isCustomSpecialAtelier 
        ? (customOrderForm.desiredProductName || "Produit Unique") 
        : (activeProduct?.name || "Modèle personnalisé");

      const orderDoc = {
        id: orderId,
        isCustomSpecial: true, // Tag highly unique custom projects
        userId: currentUser?.uid || "invité",
        fullName: customOrderForm.fullName,
        phone: customOrderForm.phone,
        email: customOrderForm.email || "Non renseigné",
        city: customOrderForm.city,
        address: customOrderForm.address,
        zip: "",
        items: [{
          productId: isCustomSpecialAtelier ? "custom_special_atelier" : activeProduct?.id || "custom-product",
          name: `[CRÉATION SUR-MESURE] ${prodName}`,
          price: finalPrice,
          quantity: 1,
          selectedColor: colorObj,
          selectedVariant: labelSpecs.join(" | ")
        }],
        subtotal: finalPrice,
        discount: 0,
        shipping: 0,
        total: finalPrice,
        createdAt: serverTimestamp() // Clean server-authenticated clock sync
      };

      await setDoc(doc(db, "orders", orderId), orderDoc);
      setIsSubmitSuccess(true);
    } catch (err) {
      console.error("Error submitting bespoke order request:", err);
      alert("Erreur lors de l'envoi de la commande sur-mesure d'Atelier.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const isRTL = lang === "ar";
  const resetBtnLabel = lang === "en" ? "Reset" : lang === "es" ? "Restablecer" : lang === "ar" ? "إعادة تعيين" : "Réinitialiser";
  const calibrationLabel = lang === "en" ? "Craft Quality" : lang === "es" ? "Calibrado" : lang === "ar" ? "معايرة يدوية" : "Calibrage d'Artisan";
  const optionsTitle = lang === "en" ? "Shades & Structure" : lang === "es" ? "Variaciones" : lang === "ar" ? "الأطراف والهيكل" : "Nuances & Spécifications";
  const previewTitle = lang === "en" ? "Live setup overview" : lang === "es" ? "Aperto de la configuración" : lang === "ar" ? "معاينة حية للمواصفات" : "Aperçu de votre configuration";

  // Auto detect if the customer entered custom/non-standard options
  const hasCustomManualOption = Object.entries(selectedSpecs).some(([label, val]) => String(val).includes("Saisir manuellement"));
  const isCustomSpecialMode = isCustomSpecialAtelier || hasCustomManualOption;

  return (
    <div id="interactive-model-sandbox" className="bg-white dark:bg-slate-900 rounded-[1.8rem] border border-[#e6eee3] dark:border-slate-800 sleek-shadow-lg overflow-hidden relative">
      
      {/* Configuration Header bar */}
      <div className="bg-[#f4f8f3] dark:bg-slate-950 border-b border-[#e6eee3] dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2d4a22]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#84a98c]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#cbd3c9] dark:bg-slate-700"></span>
          <span className="font-mono text-xs text-[#2d4a22]/70 dark:text-slate-400 ml-2 font-bold select-none">{t.atelierConfig || "Atelier"} &bull; Conception Sur-Mesure</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-[#e2eae0] dark:border-slate-800 rounded-xl hover:bg-[#f4f8f3] dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            {resetBtnLabel}
          </button>
          <span className="text-[11px] bg-[#2d4a22]/10 dark:bg-[#2d4a22]/20 text-[#2d4a22] dark:text-emerald-450 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#2d4a22]" /> {calibrationLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Control Panel / Inputs - 5 Cols */}
        <div className={`lg:col-span-5 p-6 md:p-8 border-b lg:border-b-0 ${isRTL ? "lg:border-l" : "lg:border-r"} border-[#e6eee3] dark:border-slate-800 space-y-6`}>
          <h3 className="font-sans font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-4.5 h-4.5 text-[#2d4a22]" />
            {optionsTitle}
          </h3>

          {/* Option 1: Selector of site products */}
          <div className="space-y-3 text-left bg-slate-50/70 dark:bg-slate-950 p-4.5 rounded-2xl border border-[#e2eae0] dark:border-slate-850">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#2d4a22] dark:text-emerald-450">
              1. Sélectionner le produit disponible sur le site
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
              }}
              className="w-full bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatPrice(p.price, currency)})
                </option>
              ))}
              <option value="custom_special_atelier" className="text-[#2d4a22] font-black font-sans">
                + Demander une création 105% personnalisée (produit non listé)...
              </option>
            </select>

            {isCustomSpecialAtelier && (
              <div className="mt-3.5 space-y-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">
                  Quel produit ou projet souhaitez-vous concevoir ? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex : Canapé d'angle en velours violet, Robe brodée..."
                  value={customOrderForm.desiredProductName}
                  onChange={(e) => setCustomOrderForm(prev => ({ ...prev, desiredProductName: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 text-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Option 2: Select Color */}
          <div className="space-y-3 text-left">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              2. Sélectionner le coloris souhaité
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColorIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    selectedColorIndex === idx
                      ? "border-[#2d4a22] bg-[#f4f8f3] dark:bg-slate-950 text-[#2d4a22] ring-2 ring-[#e6eee3] dark:ring-slate-800"
                      : "border-slate-101 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                    style={{ backgroundColor: color.hex }}
                  ></span>
                  <span className="text-[11px]">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Render Dynamic Suggestion Options based on selection / category */}
          <div className="space-y-5 border-t border-slate-100 dark:border-slate-800/80 pt-5 text-left">
            {dynamicOptions.map((opt, oIdx) => {
              const currentValue = selectedSpecs[opt.label] || opt.values[0] || "";
              const isManual = currentValue.includes("Saisir manuellement");

              return (
                <div key={oIdx} className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {oIdx + 3}. Choix de la caractéristique : {opt.label}
                  </label>
                  <select
                    value={currentValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSpecs(prev => ({ ...prev, [opt.label]: val }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-905 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-white transition-all"
                  >
                    {opt.values.map((v, vIdx) => (
                      <option key={vIdx} value={v}>{v}</option>
                    ))}
                  </select>

                  {isManual && (
                    <div className="mt-1.5 space-y-1">
                      <span className="text-[9px] font-sans font-bold text-[#2d4a22] block">
                        Spécifiez votre valeur personnalisée sur-mesure :
                      </span>
                      <input
                        type="text"
                        placeholder={`ex : Saisissez vos mensurations, dimensions de bois, capacité...`}
                        value={manualSpecs[opt.label] || ""}
                        onChange={(e) => {
                          const txt = e.target.value;
                          setManualSpecs(pref => ({ ...pref, [opt.label]: txt }));
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-[#2d4a22]/30 focus:border-[#2d4a22] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Output Visuals and Receipt - 7 Controls */}
        <div className="lg:col-span-7 p-6 md:p-8 bg-[#fbfdfa] dark:bg-slate-950 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide uppercase flex items-center gap-2 text-left">
              <span className="w-1.5 h-4 bg-[#2d4a22] rounded-full"></span>
              {previewTitle}
            </h3>

            {/* Visual preview widget mockup */}
            <div className="bg-[#1c301a] text-slate-100 p-6 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[16rem] h-64 shadow-inner">
              <div 
                className="absolute w-44 h-44 rounded-full blur-3xl opacity-35 animate-pulse transition-all duration-700 pointer-events-none"
                style={{ backgroundColor: colors[selectedColorIndex]?.hex || "#2d4a22" }}
              ></div>

              <div className="relative z-10 text-center space-y-4 flex flex-col items-center">
                {activeProduct?.image ? (
                  <img 
                    src={activeProduct.image} 
                    alt={activeProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 object-cover rounded-2xl border border-white/20 shadow-md transition-all transform hover:scale-105"
                  />
                ) : (
                  <Armchair className="w-14 h-14 text-white transition-all transform hover:scale-105" />
                )}
                <div>
                  <h4 className="text-sm font-sans font-black tracking-wide text-white uppercase">
                    {isCustomSpecialAtelier 
                      ? (customOrderForm.desiredProductName || "PROJET D'EXCEPTION SUR-MESURE") 
                      : (activeProduct?.name || "Modèle unique d'Exception")}
                  </h4>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5 uppercase tracking-wider">
                    Teinte : {colors[selectedColorIndex]?.name} &bull; Catégorie : {isCustomSpecialAtelier ? "Atelier Craft" : activeProduct?.category || "Mobilier"}
                  </p>
                </div>
              </div>

              {/* Tag FSC floating */}
              <div className="absolute top-3 right-3 bg-white/10 text-white/90 text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-md">
                Usinage d'Atelier Garanti
              </div>
            </div>

            {/* Dynamic specifications summary list */}
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-[#e6eee3] dark:border-slate-800 sleek-shadow-sm space-y-3 text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-405 block border-b border-slate-50 dark:border-slate-800/80 pb-2">
                Aperçu des choix artisanaux et finitions
              </span>
              <ul className="text-xs font-semibold space-y-2 mt-2 text-slate-600 dark:text-slate-300 font-sans">
                <li className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                  <span className="font-bold text-slate-700">Type de Création :</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold uppercase text-[10px]">
                    {isCustomSpecialAtelier ? "Création Unique Libre" : activeProduct?.name || "Modèle standard"}
                  </span>
                </li>
                <li className="flex justify-between items-center px-1">
                  <span>Coloris Sélectionné :</span>
                  <span className="font-mono text-slate-800 dark:text-slate-205 flex items-center gap-1">
                    {colors[selectedColorIndex]?.name}
                    <span className="w-2.5 h-2.5 rounded-full inline-block border border-black/10" style={{ backgroundColor: colors[selectedColorIndex]?.hex }}></span>
                  </span>
                </li>
                {Object.entries(selectedSpecs).map(([label, val]) => {
                  let finalVal = String(val);
                  if (String(val).includes("Saisir manuellement") && manualSpecs[label]) {
                    finalVal = manualSpecs[label];
                  }
                  return (
                    <li key={label} className="flex justify-between px-1 text-slate-500 dark:text-slate-400">
                      <span>{label} :</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{finalVal || "—"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Detection Badge for manually entered custom suggestions */}
          {isCustomSpecialMode && (
            <div className="bg-amber-500/5 border border-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-2xl text-[11px] font-sans flex items-start gap-2.5 text-left animate-scaleUp">
              <span className="text-base select-none">💡</span>
              <div>
                <span className="font-bold block text-amber-800 dark:text-amber-300">Spécification ou Projet Unique Détecté !</span>
                Cette configuration sur-mesure n'est pas présente dans le stock d'origine du catalogue. Nos artisans d'art concevront et trouveront avec soin ce meuble ou produit spécialement pour vous.
              </div>
            </div>
          )}

          {/* Pricing Row and Dynamic Actions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#e6eee3] dark:border-slate-800 sleek-shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-left">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-400 font-bold">
                Tarif Estimatif d'Atelier
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3.5xl font-mono font-bold text-[#2d4a22] dark:text-[#a0cfa0]">{finalPrice.toLocaleString()} F CFA</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-mono font-semibold">TVA, conception pièce unique & amp ; livraison incluses.</p>
            </div>

            {isCustomSpecialMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsSubmitSuccess(false);
                  setIsCustomOrderOpen(true);
                }}
                className="w-full md:w-auto px-6 py-4 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-805 text-white shadow-md shadow-amber-600/10 hover:shadow-lg hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-4 h-4" />
                Commander en Sur-Mesure
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full md:w-auto px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAdded 
                    ? "bg-emerald-600 text-white animate-scaleUp" 
                    : "bg-[#2d4a22] hover:bg-[#1c301a] text-white shadow-md shadow-[#2d4a22]/10"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {isAdded ? "Ajouté avec succès !" : "Ajouter à mon panier"}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* MODAL FULLY CUSTOM WORKSHOP COMMISSION - DIRECT FIREBASE PERSISTENCE */}
      {isCustomOrderOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 max-w-lg w-full p-6 md:p-8 space-y-6 animate-scaleUp relative overflow-hidden text-left shadow-2xl">
            
            <button
              type="button"
              onClick={() => setIsCustomOrderOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {isSubmitSuccess ? (
              <div className="text-center py-8 space-y-4 animate-scaleUp">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="font-sans font-black text-[#2d4a22] dark:text-emerald-450 text-xl tracking-tight">Commande Sur-Mesure Enregistrée !</h3>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans max-w-sm mx-auto">
                  Votre demande de création exclusive a été transmise directement aux maîtres artisans de notre atelier. 
                  Nous allons étudier votre projet sous 24h et prendre contact par téléphone avec vous.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCustomOrderOpen(false)}
                  className="px-6 py-2 bg-[#2d4a22] hover:bg-[#1c301a] text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomOrderSubmit} className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-sans font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Commande Atelier Sur-Mesure
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-1 leading-normal font-sans">
                    Complétez vos coordonnées pour que nos artisans vous recontactent afin de valider et de lancer la fabrication spéciale de votre projet.
                  </p>
                </div>

                {isCustomSpecialAtelier && (
                  <div className="bg-amber-50 border border-amber-200/40 p-3 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-600 block">Projet à concevoir :</span>
                    <span className="text-xs font-bold text-slate-800">{customOrderForm.desiredProductName}</span>
                  </div>
                )}

                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Nom Complet *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ex : Marie Fall"
                        value={customOrderForm.fullName}
                        onChange={(e) => setCustomOrderForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#2d4a22]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Numéro de Téléphone *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="ex : +221 77 ••• •• ••"
                        value={customOrderForm.phone}
                        onChange={(e) => setCustomOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#2d4a22]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Adresse Email</label>
                    <input 
                      type="email" 
                      placeholder="votre@adresse.com (Optionnel)"
                      value={customOrderForm.email}
                      onChange={(e) => setCustomOrderForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#2d4a22]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Ville *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ex : Dakar, Abidjan, Bamako..."
                        value={customOrderForm.city}
                        onChange={(e) => setCustomOrderForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#2d4a22]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Adresse de Livraison *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Quartier, Rue, Immeuble..."
                        value={customOrderForm.address}
                        onChange={(e) => setCustomOrderForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#2d4a22]"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[10px] leading-relaxed text-slate-500">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    La commande sur-mesure d'un produit unique n'exige aucun paiement immédiat par carte bancaire. 
                    Nous élaborons un devis gratuit et réglons les modalités d'expédition avec vous par téléphone.
                  </span>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCustomOrderOpen(false)}
                    className="px-4.5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 text-xs uppercase font-extrabold tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="px-6 py-3 bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs uppercase font-extrabold tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-75 cursor-pointer shadow-md"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Transmission...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 animate-pulse" />
                        <span>Valider ma demande</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
