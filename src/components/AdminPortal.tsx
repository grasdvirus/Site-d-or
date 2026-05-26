import React, { useState, useEffect } from "react";
import { Lock, Unlock, Plus, Trash2, Tag, Layers, Euro, Image as ImageIcon, Sliders, CheckCircle2, AlertTriangle, Hammer, ShieldCheck, Box, UserCheck, Settings, HelpCircle, FileText, Globe } from "lucide-react";
import { Product } from "../types";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AdminPortalProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
}

export default function AdminPortal({ products, onAddProduct, onDeleteProduct, currentUser, onGoogleLogin }: AdminPortalProps) {
  // Authentication state
  const [localAuthenticated, setLocalAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // Product creation form states
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Lounge");
  const [image, setImage] = useState("");
  
  // Interactive additions: Colors
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#2d4a22");
  const [colorsList, setColorsList] = useState<{ name: string; hex: string }[]>([
    { name: "Vert Signature", hex: "#2d4a22" },
    { name: "Orange Terre Cuite", hex: "#c2410c" }
  ]);

  // Interactive additions: Variants (like Size: ["Standard", "Pro Upgrade"])
  const [variantsLabel, setVariantsLabel] = useState("Taille");
  const [variantInput, setVariantInput] = useState("");
  const [variantsList, setVariantsList] = useState<string[]>(["Standard Edition"]);

  // Key features (up to 5 bullets)
  const [featureInput, setFeatureInput] = useState("");
  const [featuresList, setFeaturesList] = useState<string[]>([
    "Conception artisanale nexus. exclusive",
    "Garantie constructeur prolongée incluse"
  ]);

  const [notifMessage, setNotifMessage] = useState("");

  // Site dynamic configuration editing states
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "site_config">("catalog");
  const [footerAbout, setFooterAbout] = useState("");
  const [footerContact, setFooterContact] = useState("");
  const [footerWarranty, setFooterWarranty] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroDesc, setHeroDesc] = useState("");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  // FAQ creator input items
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Load configuration
  useEffect(() => {
    const fetchCurrentConfig = async () => {
      try {
        const docRef = doc(db, "site_config", "main_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFooterAbout(data.footerAbout || "");
          setFooterContact(data.footerContact || "");
          setFooterWarranty(data.footerWarranty || "");
          setHeroTitle(data.heroTitle || "");
          setHeroSub(data.heroSub || "");
          setHeroDesc(data.heroDesc || "");
          setFaqs(data.faq || []);
        } else {
          setFooterAbout("Atelier d'ébénisterie d'art et de confection d'assises ergonomiques de grand confort. Nos matières premières proviennent de forêts certifiées à gestion durable. Cabinet d'inspiration rétro-scandinave.");
          setFooterContact("Livraison nationale sécurisée dans des emballages renforcés sur-mesure. Service client réactif et chaleureux par mail sous 24h. E-mail : contact@nexus-atelier.fr");
          setFooterWarranty("Toutes les pièces commandées en ligne bénéficient d'une assurance contre les déformations de mousse de 5 ans et d'une assistance directe par chat d'atelier.");
          setHeroTitle("L'Assise Unique.");
          setHeroSub("Façonnée à la main.");
          setHeroDesc("Parcourez nos créations exclusives de mobilier haut de gamme, fabriquées à la pièce et garanties à vie.");
          setFaqs([
            { question: "Où sont fabriquées vos assises ?", answer: "Toutes nos assises sont entièrement conçues et assemblées à la main dans notre atelier d'ébénisterie d'art." },
            { question: "Quelles sont vos garanties ?", answer: "Toutes nos pièces d'exception bénéficient d'une assurance structurelle de 5 ans et de notre assistance à vie." }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch site config inside admin section:", err);
      }
    };
    if (localAuthenticated || (currentUser && currentUser.email === "grasdvirus@gmail.com")) {
      fetchCurrentConfig();
    }
  }, [localAuthenticated, currentUser, activeSubTab]);

  const handleSaveSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "site_config", "main_config");
      await setDoc(docRef, {
        id: "main_config",
        footerAbout,
        footerContact,
        footerWarranty,
        heroTitle,
        heroSub,
        heroDesc,
        faq: faqs
      });
      setNotifMessage("La configuration de votre site a été enregistrée avec succès !");
      setTimeout(() => setNotifMessage(""), 5050);
    } catch (err) {
      console.error("Failed to commit site configuration values to Firestore:", err);
      alert("Une erreur est survenue lors de l'enregistrement de la configuration.");
    }
  };

  const handleAddFaqItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs(prev => [...prev, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleRemoveFaqItem = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setFaqs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toLowerCase() === "admin") {
      setLocalAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Code d'accès incorrect. Astuce : utilisez 'admin'");
    }
  };

  // Helper additions handles
  const addColorSwatch = () => {
    if (!colorName.trim()) return;
    setColorsList([...colorsList, { name: colorName.trim(), hex: colorHex }]);
    setColorName("");
  };

  const removeColorSwatch = (idx: number) => {
    setColorsList(colorsList.filter((_, i) => i !== idx));
  };

  const addVariantOption = () => {
    if (!variantInput.trim()) return;
    setVariantsList([...variantsList, variantInput.trim()]);
    setVariantInput("");
  };

  const removeVariantOption = (idx: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== idx));
  };

  const addFeatureBullet = () => {
    if (!featureInput.trim()) return;
    setFeaturesList([...featuresList, featureInput.trim()]);
    setFeatureInput("");
  };

  const removeFeatureBullet = (idx: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  // Submit and create product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !stock) {
      alert("Veuillez remplir au moins le nom, le tarif et le stock !");
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    const defaultImages = [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"
    ];

    const finalImage = image.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];

    const newProduct: Product = {
      id: `nexus-${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim() || "Une création nexus. élégante.",
      description: description.trim() ||"Aucune description fournie.",
      price: isNaN(priceNum) ? 49 : priceNum,
      image: finalImage,
      category: category,
      colors: colorsList.length > 0 ? colorsList : [{ name: "Noir mat", hex: "#000000" }],
      variantsLabel: variantsLabel.trim() || undefined,
      variants: variantsList.length > 0 ? variantsList : undefined,
      features: featuresList.length > 0 ? featuresList : ["Matériaux recyclés eco-conçus", "Emballage carton bio-dégradable"],
      stock: isNaN(stockNum) ? 10 : stockNum
    };

    onAddProduct(newProduct);
    setNotifMessage(`Le produit "${newProduct.name}" a été ajouté avec succès.`);
    
    // Reset Form
    setName("");
    setTagline("");
    setDescription("");
    setPrice("");
    setStock("");
    setImage("");
    setColorsList([{ name: "Slate Deep", hex: "#0f172a" }, { name: "Royal Purple", hex: "#4f46e5" }]);
    setVariantsList(["Standard Edition"]);
    setFeaturesList(["Conception artisanale nexus. exclusive", "Garantie constructeur prolongée incluse"]);

    setTimeout(() => {
      setNotifMessage("");
    }, 4000);
  };

  const deleteProduct = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le produit "${name}" du magasin ?`)) {
      onDeleteProduct(id);
      setNotifMessage(`Le produit "${name}" a été retiré.`);
      setTimeout(() => setNotifMessage(""), 2000);
    }
  };

  // Stats
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const avgPrice = Math.round(products.reduce((acc, p) => acc + p.price, 0) / (products.length || 1));

  // Verify dual login authorization pathways
  const isAdmin = localAuthenticated || (currentUser && currentUser.email === "grasdvirus@gmail.com");

  if (!isAdmin) {
    return (
      <div id="admin-login" className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-8 sleek-shadow-md text-center space-y-6 animate-fadeIn py-12">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 font-sans">Espace Administration Privé</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Accès réservé aux gestionnaires de boutique pour superviser le stock et publier de nouvelles pièces d'artisanat.
          </p>
        </div>

        {/* Firebase Authentication prompt based on google account privileges */}
        {currentUser ? (
          <div className="bg-rose-50/80 border border-rose-100 p-4 rounded-xl text-left space-y-2.5">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-xs font-bold">Compte non autorisé</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Vous êtes authentifié avec <strong className="font-semibold text-slate-800">{currentUser.email}</strong>, mais ce compte ne figure pas sur notre liste blanche d'administrateurs.
            </p>
            {onGoogleLogin && (
              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full bg-[#1e1b4b] hover:bg-slate-850 text-white font-mono font-bold text-[10px] uppercase py-2.5 rounded-lg text-center cursor-pointer transition-colors"
              >
                Changer de compte Google
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {onGoogleLogin && (
              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full bg-[#f4f8f3] hover:bg-[#eef5eb] border border-[#2d4a22]/20 hover:border-[#2d4a22] text-[#2d4a22] font-semibold py-3 rounded-xl text-center text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-[#2d4a22]" />
                S'authentifier via Google
              </button>
            )}
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">ou</p>
          </div>
        )}

        {/* Regular passcode entry pathway */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Saisir le Code d'accès
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all"
            />
          </div>
          {authError && (
            <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {authError}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-3.5 rounded-xl text-center text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Unlock className="w-3.5 h-3.5 text-indigo-400" />
            Déverrouiller avec le code
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-workspace" className="space-y-10 animate-fadeIn max-w-6xl mx-auto text-left">
      {/* Admin stats widgets bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 sleek-shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Modèles en Ligne</p>
            <span className="text-xl font-mono font-extrabold text-slate-900">{products.length} produits</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 sleek-shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Unités Totales en Stock</p>
            <span className="text-xl font-mono font-extrabold text-slate-900">{totalStock} pièces</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 sleek-shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Euro className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Panier Moyen Boutique</p>
            <span className="text-xl font-mono font-extrabold text-slate-900">{avgPrice}€ d'achat</span>
          </div>
        </div>
      </div>

      {notifMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">{notifMessage}</span>
        </div>
      )}

      {/* Sub-navigation pill tabs bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <button
          type="button"
          onClick={() => setActiveSubTab("catalog")}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "catalog"
              ? "bg-[#2d4a22] text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-105 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Gestion Catalogue & Modèles
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("site_config")}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "site_config"
              ? "bg-[#2d4a22] text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-105 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Configuration du Site (Accueil, FAQ & Footer)
        </button>
      </div>

      {activeSubTab === "catalog" ? (
        /* Grid: Forms & Lists */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ADD PRODUCT FORM - 7 Cols */}
        <form onSubmit={handleCreateProduct} className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 space-y-6 sleek-shadow-md">
          <h3 className="font-sans font-bold text-slate-800 text-base tracking-tight flex items-center gap-2 pb-3 border-b border-slate-50">
            <Hammer className="w-5 h-5 text-indigo-600" />
            Créer et publier un nouveau produit
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Nom du Produit</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex : nexus. Keycaps Artisan Kit" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Slogan Court</label>
                <input 
                  type="text" 
                  placeholder="ex : Une touche de design sous chaque doigt" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs rounded-xl px-3.5 py-2.5 text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-[#2d4a22]"
                >
                  <option value="Lounge">Lounge</option>
                  <option value="Office">Office</option>
                  <option value="Dining">Dining</option>
                  <option value="Rocking">Rocking</option>
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Tarif unit. (€)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="ex : 79" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              {/* Stock */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Quantité en Stock</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  placeholder="ex : 15" 
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Image URL with standard helper choices */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                <span>URL de l'image (Optionnel)</span>
                <span className="text-[10px] text-slate-400 font-sans italic">Laisser vide pour une image par défaut</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setImage("https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80")}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition-colors"
                  title="Utiliser une image de bureau moderne"
                >
                  Démo Bureau
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Description Complète</label>
              <textarea 
                rows={3}
                placeholder="Décrivez en détail les matériaux, l'ergonomie, les détails de production de l'article..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors resize-none"
              />
            </div>

            {/* DYNAMIC SUBSECTION: COLORS SWATCHES ADDITION */}
            <div className="border-t border-slate-50 pt-4 space-y-3">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Palette de Couleurs Disponibles</label>
              <p className="text-[10px] text-slate-400 leading-normal mb-2">Ajoutez les différentes nuances dans lesquelles cet article est manufacturé.</p>
              
              <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-1/3 min-w-[120px] space-y-1">
                  <span className="text-[9px] font-mono text-slate-400">Nom de la couleur</span>
                  <input
                    type="text"
                    placeholder="ex : Brun Whisky"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Hex : {colorHex}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent overflow-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addColorSwatch}
                  className="mt-4 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
                >
                  <Plus className="w-4 h-4 cursor-pointer" />
                  Ajouter coloris
                </button>
              </div>

              {/* Swatches List */}
              <div className="flex flex-wrap gap-2 mt-2">
                {colorsList.map((col, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-100/90 text-slate-700 text-xs py-1.5 px-3 rounded-full font-semibold"
                  >
                    <span className="w-2.5 h-2.5 rounded-full block border border-black/10" style={{ backgroundColor: col.hex }}></span>
                    <span>{col.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeColorSwatch(idx)}
                      className="text-slate-400 hover:text-rose-500 ml-1 font-bold text-[10px]"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* DYNAMIC SUBSECTION: VARIANTS */}
            <div className="border-t border-slate-50 pt-4 space-y-3">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Options / Variantes Techniques</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Libellé de l'option (Taille, Connectique...)</span>
                  <input
                    type="text"
                    placeholder="ex : Type de Prise"
                    value={variantsLabel}
                    onChange={(e) => setVariantsLabel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Ajouter une valeur</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ex : Version Europe"
                      value={variantInput}
                      onChange={(e) => setVariantInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={addVariantOption}
                      className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Variants List */}
              <div className="flex flex-wrap gap-2 mt-2">
                {variantsList.map((val, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 text-[11px] font-semibold py-1 px-2.5 rounded-lg border border-slate-100"
                  >
                    <Sliders className="w-3 h-3 text-slate-400" />
                    <span>{val}</span>
                    <button 
                      type="button" 
                      onClick={() => removeVariantOption(idx)}
                      className="text-slate-400 hover:text-rose-500 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* DYNAMIC SUBSECTION: SPECIFICATIONS/FEATURES BULLETS */}
            <div className="border-t border-slate-50 pt-4 space-y-3">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Fiche Technique / Spécifications (bullets)</label>
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Ajouter une ligne de spécification technique</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex : Certifié CE, garantie constructeur active..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-xs outline-none animate-none"
                  />
                  <button
                    type="button"
                    onClick={addFeatureBullet}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bullet List bullets preview */}
              <ul className="space-y-1.5 mt-2">
                {featuresList.map((val, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs text-slate-650 bg-slate-50/50 p-2 rounded-lg border border-slate-50">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      {val}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => removeFeatureBullet(idx)}
                      className="text-slate-400 hover:text-rose-500 font-bold px-1.5"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer transform transition-all hover:-translate-y-0.5"
            >
              Publier l'article en ligne &rarr;
            </button>
          </div>
        </form>

        {/* ACTIVE PRODUCT LIST & DELETIONS - 5 Cols */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 space-y-6 sleek-shadow-md">
          <h3 className="font-sans font-bold text-slate-800 text-base tracking-tight flex items-center gap-2 pb-3 border-b border-slate-50">
            <Tag className="w-5 h-5 text-indigo-600" />
            Supervision du catalogue actuel ({products.length})
          </h3>

          <p className="text-[11px] text-slate-400 leading-normal">
            Vous trouverez ci-dessous les articles actives de la boutique. Cliquez sur la corbeille pour supprimer définitivement de l'exposition.
          </p>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {products.map((p) => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100/80 hover:bg-white transition-all space-x-3 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <img 
                    src={p.image} 
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{p.price}€</span>
                      <span>&bull;</span>
                      <span className="text-slate-500">{p.category}</span>
                    </p>
                    <p className="text-[9px] text-indigo-600 font-bold font-mono">Stock : {p.stock} pièces</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteProduct(p.id, p.name)}
                  className="p-2.5 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer opacity-85 group-hover:opacity-100"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}

            {products.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Le catalogue est entièrement vide !</p>
                <p className="text-[10px] text-slate-400">Veuillez créer un produit pour restaurer l'achalandage.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      ) : (
        /* DYNAMIC SITE CONFIGURATION FORM */
        <form onSubmit={handleSaveSiteConfig} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-8 sleek-shadow-md text-left animate-fadeIn">
          
          <div className="border-b border-slate-150 dark:border-slate-805 pb-4">
            <h3 className="font-sans font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#2d4a22] dark:text-emerald-455" />
              Personnalisation de la Page d'Accueil (Accroches et descriptif Hero)
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Modifiez le slogan principal de l'Atelier visible en haut du site pour chacune des zones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Badge/Slogan Hero Principal</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="ex : L'Assise Unique."
                className="w-full bg-slate-50 border border-slate-105 dark:bg-slate-950 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-405 dark:text-slate-500">Sous-titre Itallique d'Atelier</label>
              <input
                type="text"
                value={heroSub}
                onChange={(e) => setHeroSub(e.target.value)}
                placeholder="ex : Façonnée entièrement à la main d'artiste."
                className="w-full bg-slate-50 border border-slate-105 dark:bg-slate-950 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Paragraphe descriptif Hero</label>
              <textarea
                value={heroDesc}
                onChange={(e) => setHeroDesc(e.target.value)}
                rows={3}
                placeholder="ex : Parcourez nos créations exclusives de mobilier haut de gamme..."
                className="w-full bg-slate-50 border border-slate-105 dark:bg-slate-950 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors resize-none lg:text-left"
              ></textarea>
            </div>
          </div>

          <div className="border-b border-slate-155 dark:border-slate-800 pb-4 pt-4">
            <h3 className="font-sans font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2d4a22] dark:text-emerald-4555" />
              Informations textuelles complémentaires du Pied de Page (Footer)
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-505 mt-1">
              Mettez à jour les descriptions de garantie, de logistique et d'ébénisterie d'art.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Colonne 1 : À Propos d'Atelier</label>
              <textarea
                value={footerAbout}
                onChange={(e) => setFooterAbout(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-105 dark:bg-slate-953 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors resize-none mb-1 text-left"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Colonne 2 : Support & Livraison</label>
              <textarea
                value={footerContact}
                onChange={(e) => setFooterContact(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-105 dark:bg-slate-953 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors resize-none mb-1 text-left"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Colonne 3 : Garanties d'Atelier</label>
              <textarea
                value={footerWarranty}
                onChange={(e) => setFooterWarranty(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-105 dark:bg-slate-953 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs text-slate-805 dark:text-slate-100 outline-none transition-colors resize-none mb-1 text-left"
              ></textarea>
            </div>
          </div>

          <div className="border-b border-slate-155 dark:border-slate-800 pb-4 pt-4">
            <h3 className="font-sans font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#2d4a22] dark:text-emerald-455" />
              Éditeur de la Foire Aux Questions (FAQ)
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Rajoutez, réorganisez, et supprimez directement les questions fréquentes ci-dessous.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">FAQ active de la boutique ({faqs.length})</label>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 bg-slate-50/40 dark:bg-slate-950">
              {faqs.map((f, idx) => (
                <div key={idx} className="flex items-start justify-between bg-white dark:bg-slate-900 border border-slate-201 dark:border-slate-800 rounded-xl p-4 text-xs gap-3">
                  <div className="space-y-1 min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">Q : {f.question}</h5>
                    <p className="text-slate-500 dark:text-slate-400">R : {f.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFaqItem(idx, e)}
                    className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer flex-shrink-0"
                    title="Retirer de la FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {faqs.length === 0 && (
                <p className="text-slate-400 dark:text-slate-505 text-center py-6 font-mono text-[10px]">Aucun élément de FAQ configuré pour le moment.</p>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-101 dark:border-slate-800/80 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase text-[#2d4a22] dark:text-emerald-455">Ajouter une question FAQ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Question (ex : Vos bois sont-ils certifiés ?)"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-805 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none"
                />
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Réponse explicative..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-805 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddFaqItem}
              className="px-4 py-2.5 bg-slate-100/80 hover:bg-[#2d4a22] hover:text-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#2d4a22] dark:text-slate-300 transition-all cursor-pointer"
            >
              + Rajouter à la FAQ
            </button>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="py-3 px-8 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer la Configuration du Site
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
