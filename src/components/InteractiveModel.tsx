import { useState, useMemo, useEffect } from "react";
import { Sliders, Sparkles, Check, RefreshCcw, Armchair, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { Product } from "../types";
import { TRANSLATIONS, Language, Currency, formatPrice } from "../translations";

interface InteractiveModelProps {
  products: Product[];
  onAddToCart: (product: Product, color: { name: string; hex: string }, variant: string, customPrice: number) => void;
  lang?: Language;
  currency?: Currency;
}

export default function InteractiveModel({ 
  products = [], 
  onAddToCart, 
  lang = "fr", 
  currency = "CFA" 
}: InteractiveModelProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Selected product from the shop
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Find the active product dynamically
  const activeProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Handle default selection when products load
  useEffect(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Configurator options for our flagship luxury chair
  const basePrice = useMemo(() => activeProduct ? activeProduct.price : 320, [activeProduct]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedFabricIndex, setSelectedFabricIndex] = useState(0);
  const [withOttoman, setWithOttoman] = useState(false);
  const [withCushion, setWithCushion] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Available warm organic color swatches matching the active product colors or fallbacks
  const colors = useMemo(() => {
    if (activeProduct && activeProduct.colors && activeProduct.colors.length > 0) {
      return activeProduct.colors.map(col => ({
        name: col.name,
        hex: col.hex,
        colorClass: "" // we will use inline styling style={{ backgroundColor: col.hex }} to be extremely safe
      }));
    }

    // Default fallbacks in case product colors are not structured
    if (lang === "en") {
      return [
        { name: "Forest Green (Signature)", hex: "#2d4a22", colorClass: "bg-[#2d4a22]" },
        { name: "Soft Sage (Sleek)", hex: "#84a98c", colorClass: "bg-[#84a98c]" },
        { name: "Terracotta Orange", hex: "#c2410c", colorClass: "bg-[#c2410c]" },
        { name: "Charcoal Gray", hex: "#1e293b", colorClass: "bg-[#1e293b]" },
      ];
    } else if (lang === "es") {
      return [
        { name: "Verde Bosque (Firma)", hex: "#2d4a22", colorClass: "bg-[#2d4a22]" },
        { name: "Salvia Suave", hex: "#84a98c", colorClass: "bg-[#84a98c]" },
        { name: "Naranja Terracota", hex: "#c2410c", colorClass: "bg-[#c2410c]" },
        { name: "Gris Carbón", hex: "#1e293b", colorClass: "bg-[#1e293b]" },
      ];
    } else if (lang === "ar") {
      return [
        { name: "أخضر غابي (توقيع)", hex: "#2d4a22", colorClass: "bg-[#2d4a22]" },
        { name: "مرمية ناعمة", hex: "#84a98c", colorClass: "bg-[#84a98c]" },
        { name: "برتقالي طيني", hex: "#c2410c", colorClass: "bg-[#c2410c]" },
        { name: "رمادي فحمي", hex: "#1e293b", colorClass: "bg-[#1e293b]" },
      ];
    } else {
      return [
        { name: "Vert Forêt (Signature)", hex: "#2d4a22", colorClass: "bg-[#2d4a22]" },
        { name: "Sauge Doux (Sleek)", hex: "#84a98c", colorClass: "bg-[#84a98c]" },
        { name: "Orange Terre Cuite", hex: "#c2410c", colorClass: "bg-[#c2410c]" },
        { name: "Gris Anthracite", hex: "#1e293b", colorClass: "bg-[#1e293b]" },
      ];
    }
  }, [lang, activeProduct]);

  // Ensure index is always valid when active product changes
  useEffect(() => {
    setSelectedColorIndex(0);
  }, [colors]);

  // Premium fabrics variants selector matching language
  const fabrics = useMemo(() => {
    if (lang === "en") {
      return [
        { 
          name: "Premium Velvet", 
          desc: "Ultra-soft ribbed texture, elegant vintage classic.", 
          priceBonus: 0,
        },
        { 
          name: "Soft Bouclé Wool", 
          desc: "Comforting warmth and textured sheep-like look.", 
          priceBonus: 40,
        },
        { 
          name: "Full-Grain Italian Leather", 
          desc: "Majestic hand-stitched leather that ages beautifully.", 
          priceBonus: 125,
        }
      ];
    } else if (lang === "es") {
      return [
        { 
          name: "Terciopelo Premium", 
          desc: "Textura acanalada ultra suave, gran clásico vintage.", 
          priceBonus: 0,
        },
        { 
          name: "Lana Bouclé Suave", 
          desc: "Calidez reconfortante y textura rizada de gran elegancia.", 
          priceBonus: 40,
        },
        { 
          name: "Cuero Plena Flor de Italia", 
          desc: "Pátina majestuosa cosida a mano que embellece.", 
          priceBonus: 125,
        }
      ];
    } else if (lang === "ar") {
      return [
        { 
          name: "مخمل مضلع فاخر", 
          desc: "نسيج ذو قوام مميز فائق النعومة، لمسة كلاسيكية عتيقة ومبهرة.", 
          priceBonus: 0,
        },
        { 
          name: "صوف بوقل ناعم", 
          desc: "دفء مريح وشكل مجعد أنيق يعطي طابعاً ملكياً للجلوس.", 
          priceBonus: 40,
        },
        { 
          name: "جلد إيطالي طبيعي فاخر", 
          desc: "صناعة يدوية عالية الجودة تزداد جمالاً وعراقة مع الزمن.", 
          priceBonus: 125,
        }
      ];
    } else {
      return [
        { 
          name: "Velours Côtelé Premium", 
          desc: "Trame nervurée ultra douce au toucher, grand classique vintage.", 
          priceBonus: 0,
        },
        { 
          name: "Laine Bouclée Soft", 
          desc: "Chaleur réconfortante et texture moutonnée d'une élégance rare.", 
          priceBonus: 40,
        },
        { 
          name: "Cuir Pleine Fleur d'Italie", 
          desc: "Patine majestueuse cousue à la main qui s'embellit d'année en année.", 
          priceBonus: 125,
        }
      ];
    }
  }, [lang]);

  // Price calculations
  const finalPrice = useMemo(() => {
    let total = basePrice;
    total += fabrics[selectedFabricIndex].priceBonus;
    if (withOttoman) total += 120;
    if (withCushion) total += 35;
    return total;
  }, [basePrice, fabrics, selectedFabricIndex, withOttoman, withCushion]);

  const handleReset = () => {
    setSelectedColorIndex(0);
    setSelectedFabricIndex(0);
    setWithOttoman(false);
    setWithCushion(false);
    setIsAdded(false);
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;
    const colorObj = colors[selectedColorIndex] || { name: "Noir mat", hex: "#000000" };
    
    const customProduct: Product = {
      id: `custom-${activeProduct.id}-${colorObj.name.toLowerCase().replace(/\s/g, "-")}-${Date.now()}`,
      name: `Commandé Sur-Mesure : ${activeProduct.name}`,
      tagline: lang === "en" ? `${colorObj.name} custom finishing.` : `Finiton artisanale personnalisée couleur ${colorObj.name}.`,
      description: `Création personnalisée de ${activeProduct.name}. Teinte de bois/coloris sélectionnée : ${colorObj.name}. Garnissage et tissu d'exception : ${fabrics[selectedFabricIndex].name}.${withOttoman ? " Repose-pieds ottoman assorti inclus." : ""}${withCushion ? " Coussin de confort ergonomique inclus." : ""}`,
      price: finalPrice,
      image: activeProduct.image,
      category: activeProduct.category,
      colors: [colorObj],
      variantsLabel: t.fabricColor || "Couleur / Revêtement",
      variants: [fabrics[selectedFabricIndex].name],
      features: [
        `Revêtement sélectionné : ${fabrics[selectedFabricIndex].name}`,
        `Coloris de la pièce : ${colorObj.name}`,
        withOttoman ? "Option repose-pieds ottoman assorti incluse" : "",
        withCushion ? "Option coussin lombaire de confort incluse" : ""
      ].filter(Boolean),
      stock: 1
    };

    onAddToCart(customProduct, colorObj, fabrics[selectedFabricIndex].name, finalPrice);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isRTL = lang === "ar";
  const resetBtnLabel = lang === "en" ? "Reset" : lang === "es" ? "Restablecer" : lang === "ar" ? "إعادة تعيين" : "Réinitialiser";
  const calibrationLabel = lang === "en" ? "Craft Quality" : lang === "es" ? "Calibrado" : lang === "ar" ? "معايرة يدوية" : "Calibrage artisan";
  const optionsTitle = lang === "en" ? "Shades & Structure" : lang === "es" ? "Variaciones" : lang === "ar" ? "الأطراف والهيكل" : "Nuances & Structure";
  const optionSelectColor = lang === "en" ? "2. Select color swatch" : lang === "es" ? "2. Seleccionar color" : lang === "ar" ? "٢. حدد اللون الفاخر" : "2. Sélectionner le coloris";
  const optionChooseFabric = lang === "en" ? "3. Outstanding upholstery" : lang === "es" ? "3. Elegir Tapizado" : lang === "ar" ? "٣. نوع تنجيد القماش المختار" : "3. Revêtement d'exception";
  const optionalComfort = lang === "en" ? "4. Optional add-on features" : lang === "es" ? "4. Confort Opcional" : lang === "ar" ? "٤. إضافات الراحة الاختيارية" : "4. Confort optionnel additionnel";
  const ottomanTitle = lang === "en" ? "Matching Ottoman footrest" : lang === "es" ? "Reposa-pies Otomano" : lang === "ar" ? "مسند أوتوماني إضافي للقدمين" : "Ottomane repose-pieds assortie";
  const ottomanDesc = lang === "en" ? "Identical wood finish and matching premium padding." : lang === "es" ? "Estructura de madera noble a juego con tapiz idéntico." : lang === "ar" ? "هيكل خشبي مطابق وتنجيد متناسق بالكامل." : "Structure bois assortie avec rembourrage identique.";
  const cushionTitle = lang === "en" ? "Ergonomic lumbar support cushion" : lang === "es" ? "Cojín de Soporte Lumbar" : lang === "ar" ? "وسادة ظهر طبية مريحة" : "Coussin lombaire ergonomique";
  const cushionDesc = lang === "en" ? "Ultra memory foam dressed in identical luxury textile fabric." : lang === "es" ? "Cojín con memoria tapizada del mismo material." : lang === "ar" ? "رغوة طبية مرنة مغلفة بنفس نسيج الكرسي الفاخر." : "Mousse ultra mémoire de forme tapissée du même tissu.";
  const previewTitle = lang === "en" ? "Live setup overview" : lang === "es" ? "Aperto de la configuración" : lang === "ar" ? "معاينة حية للمواصفات" : "Aperçu de votre configuration";
  
  const selectedColorSymbol = colors[selectedColorIndex] || { name: "Naturel", hex: "#2d4a22" };

  return (
    <div id="interactive-model-sandbox" className="bg-white dark:bg-slate-900 rounded-[1.8rem] border border-[#e6eee3] dark:border-slate-800 sleek-shadow-lg overflow-hidden">
      
      {/* Configuration Header bar */}
      <div className="bg-[#f4f8f3] dark:bg-slate-950 border-b border-[#e6eee3] dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2d4a22]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#84a98c]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#cbd3c9] dark:bg-slate-700"></span>
          <span className="font-mono text-xs text-[#2d4a22]/70 dark:text-slate-400 ml-2 font-bold select-none">{t.atelierConfig || "Atelier"}</span>
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

          {/* New Live Selection of Available Store Products */}
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
            </select>
          </div>

          {/* Color swatches */}
          <div className="space-y-3 text-left">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {optionSelectColor}
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
                      : "border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                    style={{ backgroundColor: color.hex }}
                  ></span>
                  <span className="text-[11px]">{color.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fabrics variant */}
          <div className="space-y-3 text-left">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {optionChooseFabric}
            </label>
            <div className="space-y-2">
              {fabrics.map((fabric, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedFabricIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedFabricIndex === idx
                      ? "border-[#2d4a22] bg-[#f4f8f3] dark:bg-slate-950 ring-1 ring-[#2d4a22]/30"
                      : "border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex justify-between items-center font-bold text-slate-900 dark:text-slate-100 mb-1">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${selectedFabricIndex === idx ? "bg-[#2d4a22]" : "bg-slate-300 dark:bg-slate-700"}`}></span>
                      {fabric.name}
                    </span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-extrabold text-[10px]">
                      {fabric.priceBonus === 0 ? (lang === "en" ? "Included" : lang === "es" ? "Incluido" : lang === "ar" ? "مشمول" : "Inclus") : `+ ${formatPrice(fabric.priceBonus, currency)}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">{fabric.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Add-on options */}
          <div className="space-y-3 text-left">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {optionalComfort}
            </label>
            <div className="space-y-2.5">
              {/* Option 1 */}
              <button
                type="button"
                onClick={() => setWithOttoman(!withOttoman)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  withOttoman ? "bg-[#f4f8f3] dark:bg-slate-950 border-[#2d4a22]" : "border-slate-100 dark:border-slate-850 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${withOttoman ? "bg-[#2d4a22] border-[#2d4a22] text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"}`}>
                    {withOttoman && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{ottomanTitle}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{ottomanDesc}</p>
                  </div>
                </div>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded text-[10px]">+ {formatPrice(120, currency)}</span>
              </button>

              {/* Option 2 */}
              <button
                type="button"
                onClick={() => setWithCushion(!withCushion)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  withCushion ? "bg-[#f4f8f3] dark:bg-slate-950 border-[#2d4a22]" : "border-slate-101 dark:border-slate-850 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${withCushion ? "bg-[#2d4a22] border-[#2d4a22] text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-905"}`}>
                    {withCushion && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{cushionTitle}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">{cushionDesc}</p>
                  </div>
                </div>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded text-[10px]">+ {formatPrice(35, currency)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Visuals and Receipt - 7 Cols */}
        <div className="lg:col-span-7 p-6 md:p-8 bg-[#fbfdfa] dark:bg-slate-950 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide uppercase flex items-center gap-2 text-left">
              <span className="w-1.5 h-4 bg-[#2d4a22] rounded-full"></span>
              {previewTitle}
            </h3>

            {/* Virtual Chair graphic representation */}
            <div className="bg-[#1c301a] text-slate-100 p-6 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[16rem] h-64 shadow-inner">
              <div 
                className="absolute w-44 h-44 rounded-full blur-3xl opacity-35 animate-pulse transition-all duration-700 pointer-events-none"
                style={{ backgroundColor: selectedColorSymbol.hex }}
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
                  <h4 className="text-sm font-sans font-black tracking-wide text-white uppercase">{activeProduct?.name || "Modèle unique d'Exception"}</h4>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                    Modèle {selectedColorSymbol.name.split(" ")[0]} &bull; Finition {fabrics[selectedFabricIndex].name}
                  </p>
                </div>
              </div>

              {/* Details tag floating */}
              <div className={`absolute top-3 ${isRTL ? "left-3" : "right-3"} bg-white/10 text-white/90 text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-md`}>
                {lang === "en" ? "FSC certified wood craft" : lang === "es" ? "Estructura certificada FSC" : lang === "ar" ? "خشب معتمد ومصادق FSC" : "Usinage fsc garanti"}
              </div>
            </div>

            {/* Summary details */}
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-[#e6eee3] dark:border-slate-800 sleek-shadow-sm space-y-3 text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400 block border-b border-slate-50 dark:border-slate-800/80 pb-2">
                {lang === "en" ? "Production cost breakdown" : lang === "es" ? "Resumen de costos" : lang === "ar" ? "تحليل تكاليف الإنتاج والتصميم" : "Résumé des coûts de production"}
              </span>
              <ul className="text-xs font-semibold space-y-2 mt-2 text-slate-600 dark:text-slate-300 font-sans">
                <li className="flex justify-between">
                  <span>Structure de base {activeProduct?.name || "Modèle"} :</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{formatPrice(basePrice, currency)}</span>
                </li>
                {fabrics[selectedFabricIndex].priceBonus > 0 && (
                  <li className="flex justify-between text-[#2d4a22] dark:text-emerald-450">
                    <span>{t.fabricColor || "Matériau"} {fabrics[selectedFabricIndex].name} :</span>
                    <span className="font-mono font-bold">+ {formatPrice(fabrics[selectedFabricIndex].priceBonus, currency)}</span>
                  </li>
                )}
                {withOttoman && (
                  <li className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{ottomanTitle} :</span>
                    <span className="font-mono font-bold">+ {formatPrice(120, currency)}</span>
                  </li>
                )}
                {withCushion && (
                  <li className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{cushionTitle} :</span>
                    <span className="font-mono font-bold">+ {formatPrice(35, currency)}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Pricing Row and Cart push actions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#e6eee3] dark:border-slate-800 sleek-shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-left">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-400 font-bold">
                {lang === "en" ? "Elite craftsmanship tarif" : lang === "es" ? "Suscripciones del taller" : lang === "ar" ? "سعر الحرفية المتميزة والمتقنة" : "Tarif de l'artisanat d'excellence"}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{formatPrice(finalPrice, currency)}</span>
                <span className="text-[10px] text-[#2d4a22] dark:text-emerald-450 font-semibold bg-[#2d4a22]/10 dark:bg-[#2d4a22]/20 px-2 py-0.5 rounded font-mono ml-1">
                  {lang === "en" ? "Tax & Shipping incl." : lang === "es" ? "Envío e Impuestos incl." : lang === "ar" ? "مشمول الضريبة والشحن" : "TVA & Livraison Incl."}
                </span>
              </div>
            </div>

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
              {isAdded ? t.customAddedText : t.addCustomToCartBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
