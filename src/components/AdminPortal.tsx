import React, { useState, useEffect } from "react";
import { Lock, Unlock, Plus, Trash2, Tag, Layers, Coins, ChevronDown, ChevronUp, Image as ImageIcon, Sliders, CheckCircle2, AlertTriangle, Hammer, ShieldCheck, Box, UserCheck, Settings, HelpCircle, FileText, Globe } from "lucide-react";
import { Product } from "../types";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { formatPrice } from "../translations";

interface AdminPortalProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  categories: string[];
  onCategoriesChange: (cats: string[]) => void;
  orders?: any[];
  onDeleteOrder?: (orderId: string) => void;
}

export default function AdminPortal({ 
  products, 
  onAddProduct, 
  onDeleteProduct, 
  currentUser, 
  onGoogleLogin,
  categories,
  onCategoriesChange,
  orders = [],
  onDeleteOrder
}: AdminPortalProps) {
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
  const [category, setCategory] = useState("");
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
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "site_config" | "categories" | "orders">("catalog");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [footerAbout, setFooterAbout] = useState("");
  const [footerContact, setFooterContact] = useState("");
  const [footerWarranty, setFooterWarranty] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroDesc, setHeroDesc] = useState("");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  // FAQ input state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // New Category creator state
  const [newCategoryName, setNewCategoryName] = useState("");

  // Auto-init active category to the first available category if none is set
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Read config state on mount from Firebase Firestore to allow live customization
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, "site_config", "general");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFooterAbout(data.footerAbout || "");
          setFooterContact(data.footerContact || "");
          setFooterWarranty(data.footerWarranty || "");
          setHeroTitle(data.heroTitle || "");
          setHeroSub(data.heroSub || "");
          setHeroDesc(data.heroDesc || "");
          if (data.faqs) {
            setFaqs(data.faqs);
          }
        } else {
          // Default fallbacks matching beautiful design values
          setFooterAbout("nexus. est un atelier artisanal d'exception engagé dans la création de mobilier haut de gamme éco-responsable. Chaque pièce allie lignes sculpturées et confort absolu.");
          setFooterContact("Atelier Central : Rue des Artisans d'Art, Zone Éco-Nexus • Écrivez-nous : contact@nexus-atelier.com • Service Client : +225 07 48 59 10 20");
          setFooterWarranty("Garantie Constructeur Prolongée de 5 Ans • Service de Livraison & d'Installation Offert partout à Abidjan.");
          setHeroTitle("L'Atelier d'Artisanat d'Art d'Exception.");
          setHeroSub("DESIGN RAFFINÉ & ACCENTS NATURELS");
          setHeroDesc("Découvrez des pièces uniques façonnées à la main par nos maîtres ébénistes. Une harmonie parfaite entre design contemporain épuré, matériaux durables nobles et confort d'assise incomparable.");
          setFaqs([
            { question: "Où sont fabriquées vos créations ?", answer: "Toutes nos pièces de mobilier sont dessinées et fabriquées à la main avec passion dans nos ateliers par des artisans d'art hautement qualifiés." },
            { question: "Quels sont vos délais moyens de livraison ?", answer: "Chaque commande étant personnalisée, comptez un délai moyen de fabrication et de livraison de 5 à 10 jours ouvrés pour Abidjan et 2000 F CFA fixes." }
          ]);
        }
      } catch (err) {
        console.error("Firestore loading error:", err);
      }
    };
    fetchConfig();
  }, []);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "1234" || passcode === "nexus-admin-99") {
      setLocalAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Code d'accès incorrect. Veuillez réessayer.");
    }
  };

  const handleAddColor = () => {
    if (!colorName.trim() || !colorHex) return;
    if (colorsList.some((c) => c.hex.toLowerCase() === colorHex.toLowerCase())) {
      alert("Ce coloris existe déjà !");
      return;
    }
    setColorsList([...colorsList, { name: colorName.trim(), hex: colorHex }]);
    setColorName("");
  };

  const removeColor = (hex: string) => {
    setColorsList(colorsList.filter((c) => c.hex !== hex));
  };

  const handleAddVariant = () => {
    if (!variantInput.trim()) return;
    if (variantsList.includes(variantInput.trim())) {
      alert("Cette variante existe déjà !");
      return;
    }
    setVariantsList([...variantsList, variantInput.trim()]);
    setVariantInput("");
  };

  const removeVariant = (val: string) => {
    setVariantsList(variantsList.filter((v) => v !== val));
  };

  const handleAddFeatureBullet = () => {
    if (!featureInput.trim()) return;
    if (featuresList.includes(featureInput.trim())) return;
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

    const priceInCFA = parseFloat(price);
    const priceNum = isNaN(priceInCFA) ? 100000 / 655.957 : priceInCFA / 655.957;
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
      description: description.trim() || "Aucune description fournie.",
      price: priceNum,
      image: finalImage,
      category: category,
      colors: colorsList.length > 0 ? colorsList : [{ name: "Noir mat", hex: "#000000" }],
      variantsLabel: variantsLabel.trim() || undefined,
      variants: variantsList.length > 0 ? variantsList : undefined,
      features: featuresList.length > 0 ? featuresList : ["Matériaux recyclés eco-conçus", "Emballage carton bio-dégradable"],
      stock: isNaN(stockNum) ? 10 : stockNum
    };

    onAddProduct(newProduct);

    // Reset fields
    setName("");
    setTagline("");
    setDescription("");
    setPrice("");
    setStock("");
    setImage("");
    setColorsList([
      { name: "Vert Signature", hex: "#2d4a22" },
      { name: "Orange Terre Cuite", hex: "#c2410c" }
    ]);
    setVariantsList(["Standard Edition"]);
    setFeaturesList([
      "Conception artisanale nexus. exclusive",
      "Garantie constructeur prolongée incluse"
    ]);

    setNotifMessage("Félicitations ! Le produit de luxe a bien été ajouté au catalogue en ligne.");
    setTimeout(() => setNotifMessage(""), 5000);
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configRef = doc(db, "site_config", "general");
      await setDoc(configRef, {
        footerAbout: footerAbout.trim(),
        footerContact: footerContact.trim(),
        footerWarranty: footerWarranty.trim(),
        heroTitle: heroTitle.trim(),
        heroSub: heroSub.trim(),
        heroDesc: heroDesc.trim(),
        faqs: faqs
      }, { merge: true });

      setNotifMessage("Configuration du site enregistrée avec succès sur le Cloud Firestore !");
      setTimeout(() => setNotifMessage(""), 5000);
    } catch (err) {
      console.error("Save config failure:", err);
      alert("Le paramétrage n'a pas pu être enregistré. Activez Firebase dans le panneau de ressources.");
    }
  };

  const handleAddFaqItem = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs([...faqs, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion("");
    setNewAnswer("");
  };

  const removeFaqItem = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCat = newCategoryName.trim();
    if (!cleanCat) return;
    if (categories.some(c => c.toLowerCase() === cleanCat.toLowerCase())) {
      alert("Cette catégorie de meuble existe déjà !");
      return;
    }
    const updated = [...categories, cleanCat];
    onCategoriesChange(updated);
    setNewCategoryName("");
    setNotifMessage(`La catégorie "${cleanCat}" a été ajoutée avec succès !`);
    setTimeout(() => setNotifMessage(""), 4000);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert("Impossible de supprimer la dernière catégorie du site !");
      return;
    }
    const linkedCount = products.filter(p => p.category === catToDelete).length;
    if (linkedCount > 0) {
      if (!window.confirm(`Attention ! ${linkedCount} produit(s) sont liés à la catégorie "${catToDelete}". Souhaitez-vous quand même la supprimer ?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Confirmez-vous la suppression de la catégorie "${catToDelete}" ?`)) {
        return;
      }
    }
    const updated = categories.filter(c => c !== catToDelete);
    onCategoriesChange(updated);
    setNotifMessage(`La catégorie "${catToDelete}" a été retirée.`);
    setTimeout(() => setNotifMessage(""), 4000);
  };

  // Auth gate check
  const hasAccess = localAuthenticated || (currentUser?.email === "grasdvirus@gmail.com");

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 sleek-shadow-md text-left animate-fadeIn">
        <div className="text-center space-y-3 mb-6">
          <div className="w-12 h-12 bg-[#2d4a22]/10 text-[#2d4a22] rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-lg text-slate-800 dark:text-white tracking-tight">Espace Administrateur</h2>
          <p className="text-xs text-slate-400">Pour gérer les produits, configurations globales et expéditions, authentifiez-vous ci-dessous.</p>
        </div>

        <form onSubmit={handleLocalSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Code d'accès secret</label>
            <input 
              type="password"
              placeholder="Saisissez le code"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:bg-white focus:border-[#2d4a22]"
            />
          </div>

          {authError && <p className="text-rose-500 font-bold text-[10px] bg-rose-50 p-2.5 rounded-lg border border-rose-100">{authError}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Se Connecter à l'Atelier
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-black block mb-3">OU AUTHENTIFICATION GOOGLE</span>
          <button
            onClick={onGoogleLogin}
            className="w-full py-2.5 border border-slate-200 dark:border-slate-820 hover:bg-slate-50 text-slate-600 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4 text-[#2d4a22]" />
            Se connecter avec Google Admin
          </button>
        </div>
      </div>
    );
  }

  // Statistics calculation
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const avgPrice = Math.round(products.reduce((acc, p) => acc + p.price, 0) / (products.length || 1));

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 sleek-shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Modèles Uniques en Ligne</p>
            <span className="text-xl font-mono font-extrabold text-slate-900">{products.length} références</span>
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
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Panier Moyen Boutique</p>
            <span className="text-xl font-mono font-extrabold text-slate-900">{formatPrice(avgPrice, "CFA")}</span>
          </div>
        </div>
      </div>

      {notifMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{notifMessage}</span>
        </div>
      )}

      {/* Admin Panel Multi Sub Navigation Tabs */}
      <div className="flex border-b border-slate-100 justify-start space-x-5 select-none font-sans font-bold text-xs tracking-tight">
        <button
          onClick={() => setActiveSubTab("catalog")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "catalog" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Création & Inventaire
        </button>
        <button
          onClick={() => setActiveSubTab("categories")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "categories" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Catégories de Meubles ({categories.length})
        </button>
        <button
          onClick={() => setActiveSubTab("orders")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "orders" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Livraisons Clients ({orders.length})
        </button>
        <button
          onClick={() => setActiveSubTab("site_config")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "site_config" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Configurations & FAQ
        </button>
      </div>

      {activeSubTab === "catalog" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form to add item */}
          <form 
            onSubmit={handleCreateProduct}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-5 text-left sleek-shadow-md"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
              <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2d4a22]" />
                Façonner un Nouveau Modèle Virtuel
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Saisissez les informations techniques de la création artisanale à exposer en ligne.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Product title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Nom du meuble</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex : Chaise Scandinave Héra" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Slogan / Accroche</label>
                <input 
                  type="text" 
                  placeholder="ex : Bois de chêne & assise bouclée" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-101 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Famille de meuble</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs rounded-xl px-3.5 py-2.5 text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-[#2d4a22]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Tarif unit. (F CFA)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="ex : 150000" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
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
                  className="w-full bg-slate-50 border border-slate-101 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Adresse URL de la photo</label>
                <input 
                  type="url" 
                  placeholder="ex: https://images.unsplash.com/photo-..." 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                />
              </div>
            </div>

            {/* Custom description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Présentation & Matériaux</label>
              <textarea 
                rows={3}
                placeholder="Décrivez les finitions, l'inspiration..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all resize-none"
              />
            </div>

            {/* Configurator settings: Colors of fabric */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-101/80 space-y-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#2d4a22] block">Personnalisation 3D : Textures & Teintes colorées</span>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Nom de la couleur (ex: Camel de luxe)"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  className="flex-1 bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs outline-none"
                />
                
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-10 h-8 bg-transparent cursor-pointer border-none"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{colorHex}</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-4 py-2 bg-slate-800 hover:bg-[#2d4a22] text-white text-[10px] font-black uppercase rounded-xl transition-colors"
                >
                  Inclure cet échantillon
                </button>
              </div>

              {/* Display colors generated */}
              <div className="flex flex-wrap gap-2 pt-1">
                {colorsList.map((c) => (
                  <span 
                    key={c.hex}
                    className="flex items-center gap-2 bg-white text-slate-700 font-bold text-[10px] p-1.5 px-3 rounded-xl border border-slate-100 shadow-3xs"
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: c.hex }}></span>
                    {c.name}
                    <button 
                      type="button" 
                      onClick={() => removeColor(c.hex)}
                      className="text-rose-500 hover:text-rose-700 font-black ml-1 scale-110"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Product configuration options (variants) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-101/80 space-y-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#2d4a22] block">Variantes de taille ou de garnissage</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase font-mono tracking-wider text-slate-400 block">Libellé variant (ex: Finition)</span>
                  <input 
                    type="text" 
                    placeholder="Libellé" 
                    value={variantsLabel}
                    onChange={(e) => setVariantsLabel(e.target.value)}
                    className="w-full bg-white border border-slate-150 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                </div>
                
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[8px] uppercase font-mono tracking-wider text-slate-400 block">Valeurs d'options</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ajouter (ex : Coussin bouclé, Pieds bronze...)" 
                      value={variantInput}
                      onChange={(e) => setVariantInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-150 rounded-xl px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-[#2d4a22] text-white text-[10px] uppercase font-bold rounded-xl"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Display variants badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {variantsList.map((v) => (
                  <span 
                    key={v}
                    className="flex items-center gap-1.5 bg-white text-slate-600 font-mono font-semibold text-[10px] p-1.5 px-3 rounded-lg border border-slate-150"
                  >
                    {v}
                    <button 
                      type="button" 
                      onClick={() => removeVariant(v)}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-sm leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Custom technical highlights */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-101/80 space-y-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#2d4a22] block">Points Forts de Qualité (Atouts)</span>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="ex : Cuir tanné végétal d'Italie certifié"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-150 rounded-xl px-3 py-2 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFeatureBullet}
                  className="px-4 py-2 bg-slate-800 hover:bg-[#2d4a22] text-white text-[10px] uppercase font-black rounded-xl"
                >
                  Ajouter l'atout
                </button>
              </div>

              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {featuresList.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-100">
                    <span className="font-sans font-medium text-slate-600">{f}</span>
                    <button 
                      type="button" 
                      onClick={() => removeFeatureBullet(i)}
                      className="text-rose-500 hover:text-rose-700 font-bold px-1"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4.5 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Exposer et publier dans l'Atelier en ligne
            </button>
          </form>

          {/* List of current store products */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6 text-left sleek-shadow-md lg:col-span-1">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
              <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#2d4a22]" />
                Catalogue Actif
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Vous pouvez à tout moment retirer de la vente certaines créations.</p>
            </div>

            <div className="space-y-3.5 max-h-[800px] overflow-y-auto pr-1">
              {products.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-101/80 hover:bg-white transition-all space-x-3 group"
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
                        <span>{formatPrice(p.price, "CFA")}</span>
                        <span>&bull;</span>
                        <span className="text-slate-500">{p.category}</span>
                      </p>
                      <p className="text-[9px] text-indigo-600 font-bold font-mono">Stock : {p.stock} pièces</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteProduct(p.id)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shrink-0"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSubTab === "categories" ? (
        
        /* CATEGORY MANAGEMENT SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <form 
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4 text-left sleek-shadow-md"
          >
            <div className="border-b border-slate-101 dark:border-slate-800 pb-3 block">
              <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#2d4a22]" />
                Ajouter une Nouvelle Catégorie
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Créez une catégorie de mobilier sur-mesure pour classifier vos futures créations.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Intitulé de la catégorie</label>
              <input 
                type="text" 
                required
                placeholder="ex : Canapés, Buffets, Luminaires..." 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Enregistrer la catégorie de meuble
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4 text-left sleek-shadow-md">
            <div className="border-b border-slate-101 dark:border-slate-800 pb-3 block">
              <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#2d4a22]" />
                Catégories de Meubles en Vigueur
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Liste des filtres de catégories activés pour l'utilisateur dans l'Atelier.</p>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const associatedCount = products.filter(p => p.category === cat).length;
                return (
                  <div 
                    key={cat}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-101 hover:bg-white transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-700">{cat}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 block">{associatedCount} meuble(s) associés</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      ) : activeSubTab === "site_config" ? (

        /* STOREFRONT THEME & STATIC TEXT CONFIGURATION ENGINE */
        <form 
          onSubmit={handleSaveConfigs}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-101 dark:border-slate-800 p-6 md:p-8 space-y-6 text-left sleek-shadow-lg"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
            <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#2d4a22]" />
              Personnalisation Editoriale & FAQ dynamique
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Consignez les textes phares des modules d'information et de la foire aux questions sans toucher au code.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2d4a22] font-mono border-b pb-1">Intro de la Boutique (Général)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Grand Titre Principal (Hero Title)</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Slogan de Bienvenue (Hero Subtitle)</label>
                <input
                  type="text"
                  value={heroSub}
                  onChange={(e) => setHeroSub(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Description textuelle d'Atelier</label>
                <textarea
                  rows={2}
                  value={heroDesc}
                  onChange={(e) => setHeroDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2d4a22] font-mono border-b pb-1">Informations Légales & Réassurance (Pied de page)</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">À propos de l'Atelier</label>
                <textarea
                  rows={2}
                  value={footerAbout}
                  onChange={(e) => setFooterAbout(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Coordonnées de Livraison / Contact / Adresse administrative</label>
                <input
                  type="text"
                  value={footerContact}
                  onChange={(e) => setFooterContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Informations Expédition & Garantie de l'ébénisterie</label>
                <input
                  type="text"
                  value={footerWarranty}
                  onChange={(e) => setFooterWarranty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dynamic FAQ list builder */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2d4a22] font-mono border-b pb-1 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#2d4a22]" />
              Foire Aux Questions dynamique (FAQ)
            </h4>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 relative text-xs">
                  <p className="font-bold text-slate-800 pr-8">Q : {faq.question}</p>
                  <p className="text-slate-500 mt-1">R : {faq.answer}</p>
                  <button
                    type="button"
                    onClick={() => removeFaqItem(i)}
                    className="absolute top-2 right-2 text-rose-500 font-bold hover:text-rose-700 font-sans"
                  >
                    Effacer
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-101 dark:border-slate-800/80 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase text-[#2d4a22] dark:text-emerald-450">Ajouter une question FAQ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Question (ex : Vos bois sont-ils certifiés ?)"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none"
                />
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Réponse explicative..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none"
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

          <div className="pt-5 border-t border-slate-105 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="py-3 px-8 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer la Configuration du Site
            </button>
          </div>
        </form>
      ) : (
        /* CUSTOM CLIENT ORDERS LIST FOR ADMIN PORTAL */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6 sleek-shadow-md text-left animate-fadeIn">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
            <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#2d4a22]" />
              Suivi et Livraison des Commandes Clients
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
              Visualisez le détail de chaque commande d'achat client, le numéro de téléphone et l'email direct saisis par l'utilisateur pour le livrer en mains propres ou par transporteur. Cliquez sur une commande pour afficher tous ses détails.
            </p>
          </div>

          <div className="space-y-4">
            {orders.map((ord: any) => {
              const isExpanded = !!expandedOrders[ord.id];
              return (
                <div 
                  key={ord.id} 
                  className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-3xs transition-all duration-300"
                >
                  {/* Collapsible Header row */}
                  <div 
                    onClick={() => setExpandedOrders(prev => ({ ...prev, [ord.id]: !prev[ord.id] }))}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-slate-200 dark:border-slate-800 cursor-pointer select-none group/header"
                  >
                    <div className="flex items-center gap-3 font-sans">
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 transition-colors group-hover/header:bg-[#2d4a22]/10 group-hover/header:text-[#2d4a22]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#2d4a22] dark:text-emerald-450 font-bold">Enregistrée</span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">({ord.fullName || ord.shippingAddress?.fullName || "Anonyme"})</span>
                        </div>
                        <span className="text-xs font-mono font-black text-slate-850 dark:text-slate-200 block sm:inline">CODE: {ord.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[200px]">
                      <div className="text-left sm:text-right font-sans">
                        <span className="text-base font-mono font-black text-slate-900 dark:text-slate-100 block">
                          {ord.total ? `${ord.total.toLocaleString()} F CFA` : "Contact requis"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {ord.createdAt ? new Date(ord.createdAt.seconds ? ord.createdAt.seconds * 1000 : ord.createdAt).toLocaleString("fr-FR") : "Récente"}
                        </span>
                      </div>

                      {/* Suppression de commande autorisée */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Supprimer définitivement la commande "${ord.id}" ?`)) {
                            if (onDeleteOrder) {
                              onDeleteOrder(ord.id);
                            }
                          }
                        }}
                        className="p-2.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white dark:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                        title="Supprimer la commande"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible details pane wrapper */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 animate-fadeIn">
                      {/* Client Coordinates Card */}
                      <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2.5 text-left font-sans">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 border-b border-slate-50 dark:border-slate-800/40 pb-1.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          Client & Coordonnées de Contact
                        </h4>
                        <div className="space-y-1.5">
                          <p className="text-slate-800 dark:text-slate-200">
                            <span className="font-bold text-slate-450 mr-2 uppercase text-[9px] font-mono">Nom Complet:</span> 
                            {ord.fullName || ord.shippingAddress?.fullName || "Anonyme"}
                          </p>
                          
                          <p className="text-slate-850 dark:text-slate-200 bg-amber-500/5 border border-amber-500/10 p-1 px-2 rounded-lg inline-block">
                            <span className="font-bold text-amber-600 dark:text-amber-450 mr-2 uppercase text-[9px] font-mono">Numéro Tél:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {ord.phone || ord.shippingAddress?.phone || "Non renseigné"}
                            </span>
                          </p>

                          <p className="text-slate-810 dark:text-slate-200 block">
                            <span className="font-bold text-slate-450 mr-2 uppercase text-[9px] font-mono">Email Direct:</span>
                            <span className="font-mono underline text-slate-900 dark:text-white">
                              {ord.email || ord.shippingAddress?.email || "Non renseigné"}
                            </span>
                          </p>

                          <p className="text-slate-800 dark:text-slate-200">
                            <span className="font-bold text-slate-450 mr-2 uppercase text-[9px] font-mono">Adresse:</span>
                            {ord.address || ord.shippingAddress?.address || "Retrait comptoir / Atelier"}
                          </p>
                          
                          <p className="text-slate-805 dark:text-slate-200">
                            <span className="font-bold text-slate-450 mr-2 uppercase text-[9px] font-mono">Ville & CP:</span>
                            {ord.city || ord.shippingAddress?.city || "—"} ({ord.zip || ord.shippingAddress?.zip || "—"})
                          </p>
                        </div>
                      </div>

                      {/* Items list details */}
                      <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3 text-left">
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-405 border-b border-slate-50 dark:border-slate-800/40 pb-1.5 flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-[#2d4a22]" />
                          Créations Sélectionnées & Quantités
                        </h4>
                        
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {ord.items?.map((it: any, index: number) => (
                            <div key={index} className="flex items-start justify-between border-b border-slate-50 dark:border-slate-800/40 pb-2 text-[11px] gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                  {it.quantity}x {it.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-405">
                                  {it.selectedColor?.name && (
                                    <span className="flex items-center gap-1 font-sans">
                                      Coloris: {it.selectedColor.name} 
                                      <span className="w-2.5 h-2.5 rounded-full inline-block border border-black/10 align-middle ml-1" style={{ backgroundColor: it.selectedColor.hex }}></span>
                                    </span>
                                  )}
                                  {it.selectedVariant && (
                                    <span className="font-sans">| Option: {it.selectedVariant}</span>
                                  )}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-[#2d4a22] dark:text-emerald-450 whitespace-nowrap">
                                {it.price ? `${it.price.toLocaleString()} F CFA` : ""}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] flex justify-between tracking-wide bg-slate-50 dark:bg-slate-950 p-2 rounded-lg font-mono text-slate-500">
                          <span>Frais d'expédition inclus</span>
                          <span className="font-bold text-slate-800 dark:text-white">2000 F CFA</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collapsible details footer bar */}
                  {isExpanded && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 gap-3">
                      <span className="text-[10px] font-mono font-extrabold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Utilisateur Authentifié: {ord.userId || "Invité"}
                      </span>
                      
                      {ord.phone && (
                        <a 
                          href={`tel:${ord.phone}`}
                          className="px-3.5 py-2 bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-[10px] uppercase font-black tracking-wider rounded-xl transition-all text-center select-none"
                        >
                          Contacter par Téléphone
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="text-center py-12 space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Box className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">Aucune commande d'achat reçue pour le moment.</p>
                <p className="text-[10px] text-slate-400">Toutes les nouvelles commandes d'achat s'afficheront en temps réel dans cette zone.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
