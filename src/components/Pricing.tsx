import React, { useState, useMemo } from "react";
import { Check, ShoppingBag, Heart, Search, Star, Archive } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { TRANSLATIONS, Language, Currency, formatPrice } from "../translations";
import { SmartMedia } from "./SmartMedia";
import { ProductMediaGallery } from "./ProductMediaGallery";

interface PricingProps {
  products: Product[];
  onAddToCart: (product: Product, color: { name: string; hex: string }, variant?: string) => void;
  onOpenDetails?: (product: Product) => void;
  lang?: Language;
  currency?: Currency;
  layoutMode?: "grid" | "collection";
  categories?: string[];
}

export default function Pricing({ products, onAddToCart, onOpenDetails, lang = "fr", currency = "EUR", layoutMode = "grid", categories }: PricingProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  
  // Persistent Favorites tracking via localStorage
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("user_liked_products");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Randomized / Shuffled products array on component mount / page refresh
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [products]);
  
  // Adding animation feedback state
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<Record<string, { name: string; hex: string }>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const handleCopyAffiliateCode = (e: React.MouseEvent, code: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Categories list matching reference image
  const categoriesList = useMemo(() => {
    return Array.from(new Set(["Tous", ...(categories || ["Lounge", "Office", "Dining", "Rocking"])]));
  }, [categories]);

  // Count of liked items
  const likedCount = useMemo(() => {
    return Object.keys(favorites).filter(id => favorites[id]).length;
  }, [favorites]);

  // Helper translation mapping for categories
  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case "Tous": return t.catAll || "Tous";
      case "Lounge": return t.catLounge || "Lounge";
      case "Office": return t.catOffice || "Office";
      case "Dining": return t.catDining || "Dining";
      case "Rocking": return t.catRocking || "Rocking";
      case "Likes": return lang === "en" ? `Likes (${likedCount})` : lang === "es" ? `Favoritos (${likedCount})` : lang === "ar" ? `المفضلة (${likedCount})` : `Likes (${likedCount})`;
      default: return cat;
    }
  };

  // Utility function for accent-insensitive search matching
  const normalizeStr = (str: string = "") =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Filter products by category, Likes, and query
  const filteredProducts = useMemo(() => {
    const q = normalizeStr(searchQuery);
    return displayProducts.filter((product) => {
      let matchesCategory = false;
      if (selectedCategory === "Likes") {
        matchesCategory = !!favorites[product.id];
      } else if (selectedCategory === "Tous") {
        matchesCategory = true;
      } else {
        matchesCategory = product.category === selectedCategory;
      }

      if (!q) return matchesCategory;
      
      const matchesSearch =
        normalizeStr(product.name).includes(q) ||
        normalizeStr(product.tagline || "").includes(q) ||
        normalizeStr(product.description || "").includes(q) ||
        normalizeStr(product.category).includes(q) ||
        normalizeStr(product.affiliateCode || "").includes(q) ||
        normalizeStr(product.id).includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [displayProducts, selectedCategory, searchQuery, favorites]);

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
    setFavorites(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("user_liked_products", JSON.stringify(updated));
      } catch (err) {
        console.warn("Unable to save favorites to localStorage:", err);
      }
      return updated;
    });
  };

  // Simulating random discounts for retail visual flair
  const getProductDiscount = (id: string) => {
    if (id === "orris-chair") return "-5%";
    if (id === "elvo-chair") return "-10%";
    if (id === "mollis-accent") return "-15%";
    return null;
  };

  const isRTL = lang === "ar";
  const emptyFilterMsg = products.length === 0
    ? (lang === "en" ? "The boutique catalog is currently empty" : lang === "es" ? "El catálogo está vacío" : lang === "ar" ? "كتالوج الورشة فارغ حالياً" : "Le catalogue de la boutique est actuellement vide")
    : (lang === "en" ? "No products match your search filters" : lang === "es" ? "Ningún modelo coincide con los filtros" : lang === "ar" ? "لم نجد أي تصاميم تطابق خيارات البحث الحالية" : "Aucun produit ne correspond à vos filtres");
  const emptyFilterSub = products.length === 0
    ? (lang === "en" ? "Log in as administrator to create products and populate your online boutique!" : lang === "es" ? "Inicie sesión como administrador para añadir artículos." : "Veuillez vous connecter à l'espace Administrateur (grasdvirus@gmail.com) pour ajouter vos articles et commencer à vendre.")
    : (lang === "en" ? "Try typing different letters or choose another filter above like Lounge." : lang === "es" ? "Intente escribir otros términos o seleccione otra categoría." : lang === "ar" ? "يرجى كتابة كلمة مفتاحية أخرى أو تغيير الفئات في الأعلى." : "Essayez de taper un autre terme ou de sélectionner une autre catégorie comme 'Lounge'.");

  return (
    <div id="pricing-plans" className="space-y-8 text-left">
      
      {/* Categories Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-4 bg-[#f4f8f3] dark:bg-slate-900/60 p-4.5 rounded-3xl border border-[#e6eee3] dark:border-slate-800 max-w-2xl mx-auto">
        {/* Categories Pills list */}
        <div className="flex flex-wrap gap-2 justify-center py-1 items-center">
          {categoriesList.map((cat, idx) => (
            <button
              key={`price-cat-${cat}-${idx}`}
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

          {/* Likes Filter Button - Distinctive Rose / Pink Theme */}
          <button
            type="button"
            onClick={() => setSelectedCategory("Likes")}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
              selectedCategory === "Likes"
                ? "bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white shadow-md ring-2 ring-rose-300 dark:ring-rose-800 scale-105"
                : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200/90 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 shadow-2xs"
            }`}
            title="Afficher vos articles coup de cœur"
          >
            <Heart className={`w-3.5 h-3.5 ${selectedCategory === "Likes" || likedCount > 0 ? "fill-rose-500 text-rose-500" : "text-rose-500"}`} />
            <span>{getCategoryLabel("Likes")}</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Grid */}
      <div className={`grid ${layoutMode === "collection" ? "grid-cols-1 md:grid-cols-2 max-w-4xl" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl"} gap-8 mx-auto items-stretch`}>
        {filteredProducts.map((product, pIdx) => {
          const discount = getProductDiscount(product.id);
          const defaultColor = product.colors[0] || { name: "Slate", hex: "#1e293b" };
          const activeColor = selectedColors[product.id] || defaultColor;
          const activeVariant = selectedVariants[product.id] || (product.variants && product.variants[0]);
          const isAdded = addedProductIds[product.id];
          const isFav = !!favorites[product.id];
          const isLowStock = product.stock > 0 && product.stock <= 5;

          return (
            <div
              key={`price-prod-${product.id}-${pIdx}`}
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

                {/* Main Product graphic / Dual Image Slideshow */}
                <ProductMediaGallery
                  image={product.image}
                  image2={product.image2}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                  containerClassName="w-full h-full"
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
                  
                  {/* Affiliate Code Badge */}
                  {product.affiliateCode && (
                    <div className="mt-2 flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 text-left">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold">
                        Code affiliation : <strong className="text-[#2d4a22] dark:text-emerald-400 font-bold">{product.affiliateCode}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyAffiliateCode(e, product.affiliateCode!, product.id)}
                        className="text-[9px] font-mono font-bold text-[#2d4a22] dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                      >
                        {copiedCodeId === product.id ? "✓ Copié !" : "Copier"}
                      </button>
                    </div>
                  )}
                  
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
                        <div key={`pfeat-${product.id}-${fidx}`} className="flex items-start gap-1 text-[10px] text-slate-705 dark:text-slate-300">
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

                {/* Color Swatch selectors - always display when colors exist */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 items-center">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 font-extrabold uppercase mr-1">
                      {lang === "en" ? "Colors:" : lang === "es" ? "Colores:" : lang === "ar" ? "الألوان :" : "Coloris :"}
                    </span>
                    {product.colors.map((color, idx) => (
                      <button
                        key={`pcol-${product.id}-${color.hex || idx}-${idx}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColors(prev => ({ ...prev, [product.id]: color }));
                        }}
                        className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          activeColor.hex === color.hex
                            ? "border-slate-800 dark:border-white scale-110 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                        }`}
                        title={color.name}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full block border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        ></span>
                      </button>
                    ))}
                    <span className="text-[10px] font-mono font-bold text-[#2d4a22] dark:text-emerald-400 ml-1">
                      {activeColor.name}
                    </span>
                  </div>
                )}

                {/* Sizing / Variant selection - always display when variants exist */}
                {product.variants && product.variants.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 font-extrabold uppercase">
                      {product.variantsLabel || (lang === "en" ? "Size / Option:" : "Taille / Option")} :
                    </span>
                    <select
                      value={activeVariant || ""}
                      onChange={(e) => setSelectedVariants(prev => ({ ...prev, [product.id]: e.target.value }))}
                      className="bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 text-[10px] font-bold text-slate-755 dark:text-slate-200 py-1 px-2 rounded-lg cursor-pointer outline-none"
                    >
                      {product.variants.map((v, idx) => (
                        <option key={`pvar-${product.id}-${v}-${idx}`} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Card Footer pricing & Action CTAs */}
              <div className="px-5.5 py-4 bg-[#fbfdfa] dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400 dark:text-slate-400 block">{t.tarifBoutique}</span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white leading-none">
                    {formatPrice(product.price, currency)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenDetails && (
                    <button
                      type="button"
                      onClick={() => onOpenDetails(product)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      title="Voir tous les détails, tailles et couleurs"
                    >
                      Détails
                    </button>
                  )}

                  <motion.button
                    type="button"
                    disabled={product.stock === 0}
                    onClick={() => handleAddToCart(product)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`relative p-3 rounded-xl transition-colors duration-200 cursor-pointer flex items-center justify-center ${
                      product.stock === 0
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : isAdded
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40"
                        : "bg-[#2d4a22] text-white hover:bg-[#1a2d15] shadow-md"
                    }`}
                    title={product.stock === 0 ? "Épuisé" : t.addToCart}
                  >
                  <AnimatePresence mode="wait">
                    {isAdded ? (
                      <motion.span
                        key="check-icon"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check className="w-4 h-4 font-extrabold stroke-[3]" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="bag-icon"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Floating +1 particle badge */}
                  <AnimatePresence>
                    {isAdded && (
                      <motion.span
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -26, scale: 1.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.75, ease: "easeOut" }}
                        className="absolute -top-3 font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-emerald-500/40 px-1.5 py-0.5 rounded-full shadow-md pointer-events-none select-none z-10"
                      >
                        +1
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        );
      })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-16 px-4 space-y-3 bg-[#fbfdfa] dark:bg-slate-900 rounded-[1.8rem] border border-[#e6eee3] dark:border-slate-800">
            {selectedCategory === "Likes" ? (
              <div className="space-y-3">
                <Heart className="w-10 h-10 text-rose-500 fill-rose-100 dark:fill-rose-950/60 mx-auto animate-bounce" />
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {lang === "en" ? "No favorite items yet!" : lang === "es" ? "¡Aún no hay favoritos!" : lang === "ar" ? "لا توجد عناصر مفضلة بعد!" : "Aucun coup de cœur pour le moment !"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {lang === "en" 
                    ? "Click the heart icon on any product in the catalog to save it to your likes filter." 
                    : lang === "es"
                    ? "Haga clic en el icono de corazón en cualquier producto para guardarlo aquí."
                    : lang === "ar"
                    ? "انقر على رمز القلب في أي منتج لإضافته إلى قائمتك المفضلة."
                    : "Cliquez sur le petit cœur d'un produit dans le catalogue pour le mettre en favori et le retrouver ici !"}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Tous")}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-[#2d4a22] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1f3418] transition-colors cursor-pointer"
                >
                  {lang === "en" ? "Explore Catalog" : "Voir tous les articles"}
                </button>
              </div>
            ) : (
              <>
                <Archive className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-350">{emptyFilterMsg}</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">{emptyFilterSub}</p>
              </>
            )}
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
