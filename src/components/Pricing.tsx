import React, { useState, useMemo } from "react";
import { Check, ShoppingBag, Heart, Search, Star, Archive } from "lucide-react";
import { Product } from "../types";
import { TRANSLATIONS, Language, Currency, formatPrice } from "../translations";

interface PricingProps {
  products: Product[];
  onAddToCart: (product: Product, color: { name: string; hex: string }, variant?: string) => void;
  lang?: Language;
  currency?: Currency;
  layoutMode?: "grid" | "collection";
  categories?: string[];
}

export default function Pricing({ products, onAddToCart, lang = "fr", currency = "EUR", layoutMode = "grid", categories }: PricingProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  
  // Favorites tracking
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  
  // Adding animation feedback state
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, { name: string; hex: string }>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Categories list matching reference image (internal keys represent pristine filter tokens)
  const categoriesList = useMemo(() => {
    return ["Tous", ...(categories || ["Lounge", "Office", "Dining", "Rocking"])];
  }, [categories]);

  // Helper translation mapping for categories
  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case "Tous": return t.catAll || "Tous";
      case "Lounge": return t.catLounge || "Lounge";
      case "Office": return t.catOffice || "Office";
      case "Dining": return t.catDining || "Dining";
      case "Rocking": return t.catRocking || "Rocking";
      default: return cat;
    }
  };

  // Filter products by category and query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle adding
  const handleAddToCart = (product: Product) => {
    const activeColor = selectedColors[product.id] || product.colors[0];
    const activeVariant = selectedVariants[product.id] || (product.variants && product.variants[0]);

    onAddToCart(product, activeColor, activeVariant);

    setAddedProductIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedProductIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Simulating random discounts for retail visual flair
  const getProductDiscount = (id: string) => {
    if (id === "orris-chair") return "-5%";
    if (id === "elvo-chair") return "-10%";
    if (id === "mollis-accent") return "-15%";
    return null;
  };

  const isRTL = lang === "ar";
  const emptyFilterMsg = lang === "en" ? "No products match your search filters" : lang === "es" ? "Ningún modelo coincide con los filtros" : lang === "ar" ? "لم نجد أي تصاميم تطابق خيارات البحث الحالية" : "Aucun produit ne correspond à vos filtres";
  const emptyFilterSub = lang === "en" ? "Try typing different letters or choose another filter above like Lounge." : lang === "es" ? "Intente escribir otros términos o seleccione otra categoría." : lang === "ar" ? "يرجى كتابة كلمة مفتاحية أخرى أو تغيير الفئات في الأعلى." : "Essayez de taper un autre terme ou de sélectionner une autre catégorie comme 'Lounge'.";

  return (
    <div id="pricing-plans" className="space-y-8 text-left">
      
      {/* Categories Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-4 bg-[#f4f8f3] dark:bg-slate-900/60 p-4.5 rounded-3xl border border-[#e6eee3] dark:border-slate-800 max-w-2xl mx-auto">
        {/* Categories Pills list */}
        <div className="flex flex-wrap gap-2 justify-center py-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap select-none ${
                selectedCategory === cat
                  ? "bg-[#2d4a22] text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-[#e2eae0] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#f4f8f3] dark:hover:bg-slate-800"
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog Grid */}
      <div className={`grid ${layoutMode === "collection" ? "grid-cols-1 md:grid-cols-2 max-w-4xl" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl"} gap-8 mx-auto items-stretch`}>
        {filteredProducts.map((product) => {
          const discount = getProductDiscount(product.id);
          const defaultColor = product.colors[0] || { name: "Slate", hex: "#1e293b" };
          const activeColor = selectedColors[product.id] || defaultColor;
          const activeVariant = selectedVariants[product.id] || (product.variants && product.variants[0]);
          const isAdded = addedProductIds[product.id];
          const isFav = !!favorites[product.id];
          const isLowStock = product.stock > 0 && product.stock <= 5;

          return (
            <div
              key={product.id}
              className="group/card relative bg-white dark:bg-slate-900 rounded-[1.8rem] border border-[#e2eae0]/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-all duration-300 sleek-shadow-sm hover:sleek-shadow-md hover:border-[#2d4a22]/30"
            >
              {/* Image box frame with overlay layout */}
              <div className="relative h-64 w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Discount Tag Top-Left */}
                {discount && (
                  <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} bg-[#fcf5eb] dark:bg-slate-800 text-[#b45309] dark:text-amber-450 font-mono text-[10px] tracking-wider uppercase font-extrabold px-2.5 py-1 rounded-full z-15 shadow-sm`}>
                    {discount}
                  </div>
                )}

                {/* Categories Badge backup */}
                {!discount && (
                  <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} bg-slate-500/10 text-slate-705 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800 text-[9px] font-mono uppercase font-bold px-2.5 py-1 rounded-full z-15`}>
                    {getCategoryLabel(product.category)}
                  </div>
                )}

                {/* Heart/Favorite toggle on Top-Right */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} p-2.5 rounded-full z-15 transition-all shadow-sm ${
                    isFav 
                      ? "bg-rose-50 dark:bg-rose-950 text-rose-500" 
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-800 dark:hover:text-slate-150"
                  }`}
                  title={isFav ? "Retirer" : "Ajouter"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500" : ""}`} />
                </button>

                {/* Main Product graphic */}
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Stock Tag Overlay */}
                {product.stock === 0 ? (
                  <div className={`absolute bottom-3 ${isRTL ? "right-3" : "left-3"} bg-rose-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase`}>
                    {t.outOfStock}
                  </div>
                ) : isLowStock ? (
                  <div className={`absolute bottom-3 ${isRTL ? "right-3" : "left-3"} bg-amber-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase animate-pulse`}>
                    {t.lowStock}
                  </div>
                ) : null}
              </div>

              {/* Inside details */}
              <div className="p-5.5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold font-sans text-slate-900 dark:text-slate-100 tracking-tight flex items-center justify-between pr-2">
                    <span>{product.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-normal mt-1 font-semibold">{product.tagline}</p>
                  
                  {/* Detailed Description */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                    {product.description}
                  </p>

                  {/* Bullet features list */}
                  {product.features && product.features.length > 0 && (
                    <div className="mt-2.5 space-y-1 bg-[#2d4a22]/5 dark:bg-[#2d4a22]/10 p-2.5 rounded-xl border border-dashed border-[#2d4a22]/20 text-left">
                      <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold text-[#2d4a22] dark:text-[#84a98c] block mb-1">
                        {lang === "en" ? "Specifications :" : lang === "es" ? "Especificaciones :" : lang === "ar" ? "المواصفات :" : "Caractéristiques :"}
                      </span>
                      {product.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-start gap-1 text-[10px] text-slate-705 dark:text-slate-300">
                          <span className="text-[#2d4a22] dark:text-[#84a98c] mr-1 flex-shrink-0">•</span>
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stock count display */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                    <span className="text-[10px] font-mono font-extrabold text-slate-600 dark:text-slate-350">
                      {lang === "en" ? `${product.stock} in stock` : lang === "es" ? `${product.stock} en stock` : lang === "ar" ? `${product.stock} في المخزن` : `${product.stock} en stock`}
                    </span>
                  </div>
                </div>

                {/* Color Swatch selectors */}
                {product.colors && product.colors.length > 1 && (
                  <div className="flex gap-1.5 pt-1 items-center">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 font-extrabold uppercase mr-1.5">
                      {lang === "en" ? "Colors:" : lang === "es" ? "Colores:" : lang === "ar" ? "الألوان :" : "Coloris :"}
                    </span>
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColors(prev => ({ ...prev, [product.id]: color }));
                        }}
                        className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          activeColor.hex === color.hex
                            ? "border-slate-800 dark:border-white scale-110"
                            : "border-transparent hover:border-slate-305"
                        }`}
                        title={color.name}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full block border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        ></span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sizing / Variant selection */}
                {product.variants && product.variants.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 font-extrabold uppercase">{product.variantsLabel || t.fabricColor} :</span>
                    <select
                      value={activeVariant || ""}
                      onChange={(e) => setSelectedVariants(prev => ({ ...prev, [product.id]: e.target.value }))}
                      className="bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 text-[10px] font-bold text-slate-755 dark:text-slate-200 py-1 px-2 rounded-lg cursor-pointer outline-none"
                    >
                      {product.variants.map((v, idx) => (
                        <option key={idx} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Card Footer pricing */}
              <div className="px-5.5 py-4 bg-[#fbfdfa] dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400 dark:text-slate-400 block">{t.tarifBoutique}</span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white leading-none">
                    {formatPrice(product.price, currency)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={product.stock === 0}
                  onClick={() => handleAddToCart(product)}
                  className={`p-3 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    product.stock === 0
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : isAdded
                      ? "bg-emerald-600 text-white animate-scaleUp"
                      : "bg-[#2d4a22] text-white hover:bg-[#1a2d15] hover:scale-105 shadow-sm"
                  }`}
                  title={product.stock === 0 ? "Épuisé" : t.addToCart}
                >
                  {isAdded ? (
                    <Check className="w-3.5 h-3.5 font-bold" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-16 space-y-3 bg-[#fbfdfa] dark:bg-slate-900 rounded-[1.8rem] border border-[#e6eee3] dark:border-slate-800">
            <Archive className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-350">{emptyFilterMsg}</h4>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">{emptyFilterSub}</p>
          </div>
        )}
      </div>

      {/* Trust reassurance banner */}
      <div className="bg-[#fbfdfa] dark:bg-slate-900/40 border border-[#e6eee3] dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-3.5 text-left">
          <div className="p-3 bg-[#eef5eb] dark:bg-slate-950 text-[#2d4a22] flex-shrink-0 font-bold select-none text-xs rounded-xl">
            ★ ★ ★ ★ ★
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{t.warrantyTitle}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 font-medium">{t.warrantyDesc}</p>
          </div>
        </div>
        <a
          href="#faqs-anchor"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-[#e2eae0] dark:border-slate-800 hover:bg-[#2d4a22] hover:text-white rounded-xl text-[10px] font-extrabold text-slate-750 dark:text-slate-200 transition-all text-center uppercase tracking-wider"
        >
          {t.warrantyDeliveryBtn} &rarr;
        </a>
      </div>

    </div>
  );
}
