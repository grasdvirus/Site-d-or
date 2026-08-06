import { useState, useMemo, useEffect, useRef } from "react";
import { triggerOrderCelebration } from "../utils/confetti";
import { SmartMedia } from "./SmartMedia";
import { ProductMediaGallery } from "./ProductMediaGallery";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Shirt, 
  Tv, 
  Smartphone, 
  Laptop, 
  Flame, 
  Gamepad, 
  Watch, 
  Sparkles, 
  Armchair, 
  Heart, 
  Briefcase, 
  HelpCircle, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  AlertTriangle, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Users, 
  MessageSquare,
  Search,
  CheckCircle2,
  RefreshCcw,
  Sparkle,
  Info,
  Sliders,
  Sparkles as SparklesIcon
} from "lucide-react";
import { Product } from "../types";
import { TRANSLATIONS, Language, Currency, formatPrice } from "../translations";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Footprints icon is sometimes not available or called differently in older lucide packages.
// Let's create a sturdy inline SVG-like footprint or use lucide Footprints icon if resolved, 
// or map it gracefully to a robust custom icon if needed. We will import what is safe, and create 
// a custom small component or use standard lucide footprints to be elegant.
import { Footprints } from "lucide-react";

interface InteractiveModelProps {
  products: Product[];
  onAddToCart: (product: Product, color: { name: string; hex: string }, variant: string, customPrice: number) => void;
  lang?: Language;
  currency?: Currency;
  customOptions?: Record<string, { label: string; values: string[] }[]>;
  currentUser?: any;
  siteConfig?: any;
}

const AVAILABLE_COLORS = [
  { name: "Noir Intense", hex: "#111827" },
  { name: "Blanc Pur", hex: "#ffffff" },
  { name: "Gris Sidéral", hex: "#4b5563" },
  { name: "Bleu Minuit", hex: "#1e3a8a" },
  { name: "Vert Forêt", hex: "#14532d" },
  { name: "Rouge Rubis", hex: "#b91c1c" },
  { name: "Or Satiné", hex: "#d97706" },
  { name: "Rose Poudré", hex: "#fbcfe8" }
];

const CATEGORIES = [
  { id: "Vêtements", label: "Vêtements", icon: Shirt, description: "T-shirts, robes, pantalons, costumes..." },
  { id: "Chaussures", label: "Chaussures", icon: Footprints, description: "Baskets, bottes, souliers de luxe..." },
  { id: "Téléphones", label: "Téléphones", icon: Smartphone, description: "Smartphones, marques phares..." },
  { id: "Ordinateurs", label: "Ordinateurs", icon: Laptop, description: "Laptops, stations de travail, PC gamer..." },
  { id: "Téléviseurs", label: "Téléviseurs", icon: Tv, description: "Écrans plats, OLED, 4K, Smart TV..." },
  { id: "Electroménager", label: "Electroménager", icon: Flame, description: "Fours, réfrigérateurs, lave-linges..." },
  { id: "Accessoires", label: "Accessoires", icon: Briefcase, description: "Sacs, ceintures, lunettes de soleil..." },
  { id: "Jeux vidéo", label: "Jeux vidéo", icon: Gamepad, description: "Consoles, accessoires, jeux physiques..." },
  { id: "Montres", label: "Montres", icon: Watch, description: "Montres connectées, analogiques, luxe..." },
  { id: "Beauté", label: "Beauté", icon: Heart, description: "Parfums, maquillage, soins bio..." },
  { id: "Mobilier", label: "Mobilier", icon: Armchair, description: "Canapés, chaises d'ébéniste, tables..." },
  { id: "Autre", label: "Autre", icon: HelpCircle, description: "Tout autre produit introuvable..." }
];

const CATEGORY_FIELDS: Record<string, Array<{
  name: string;
  label: string;
  type: "select" | "color" | "radio" | "text" | "slider";
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
}>> = {
  "Vêtements": [
    { name: "type", label: "Type de vêtement", type: "select", options: ["T-shirt", "Chemise", "Pantalon", "Jean", "Robe", "Costume", "Sweat", "Veste", "Pull", "Autre"] },
    { name: "couleur", label: "Couleur souhaitée", type: "color" },
    { name: "taille", label: "Taille de vêtement", type: "radio", options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
    { name: "genre", label: "Genre", type: "radio", options: ["Homme", "Femme", "Mixte"] },
    { name: "matiere", label: "Matière favorite", type: "select", options: ["Coton", "Jean", "Laine", "Polyester", "Lin", "Autre"] },
    { name: "marque", label: "Marque souhaitée", type: "text", placeholder: "ex: Lacoste, Nike..." },
    { name: "budget", label: "Budget maximum", type: "slider", min: 5000, max: 500000, step: 5000, defaultValue: 45000 }
  ],
  "Chaussures": [
    { name: "type", label: "Type de chaussures", type: "select", options: ["Baskets", "Chaussures de ville", "Bottes", "Sandales", "Escarpins", "Autre"] },
    { name: "pointure", label: "Pointure de pied", type: "select", options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { name: "couleur", label: "Couleur souhaitée", type: "color" },
    { name: "matiere", label: "Matière extérieure", type: "select", options: ["Cuir", "Daim", "Toile", "Synthétique", "Autre"] },
    { name: "marque", label: "Marque souhaitée", type: "text", placeholder: "ex: Adidas, Nike..." },
    { name: "budget", label: "Budget maximum", type: "slider", min: 10000, max: 800000, step: 10000, defaultValue: 65000 }
  ],
  "Téléphones": [
    { name: "marque", label: "Constructeur / Marque", type: "select", options: ["Apple (iPhone)", "Samsung", "Google Pixel", "Xiaomi", "Huawei", "Tecno", "Infinix", "Autre"] },
    { name: "couleur", label: "Finition / Couleur", type: "color" },
    { name: "stockage", label: "Capacité de stockage", type: "radio", options: ["64 Go", "128 Go", "256 Go", "512 Go", "1 To"] },
    { name: "ram", label: "Mémoire vive (RAM)", type: "radio", options: ["4 Go", "6 Go", "8 Go", "12 Go", "16 Go"] },
    { name: "etat", label: "État souhaité", type: "radio", options: ["Neuf", "Reconditionné", "Occasion"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 50000, max: 1500000, step: 20000, defaultValue: 350000 }
  ],
  "Ordinateurs": [
    { name: "marque", label: "Marque d'ordinateur", type: "select", options: ["Apple Mac", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Autre"] },
    { name: "ram", label: "Mémoire vive (RAM)", type: "radio", options: ["8 Go", "16 Go", "32 Go", "64 Go"] },
    { name: "stockage", label: "Capacité de stockage", type: "select", options: ["256 Go SSD", "512 Go SSD", "1 To SSD", "2 To SSD", "Disque HDD"] },
    { name: "ssd_hdd", label: "Type de disque dur", type: "radio", options: ["SSD", "HDD", "Les deux"] },
    { name: "carte_graphique", label: "Carte graphique", type: "select", options: ["Intégrée", "Nvidia RTX", "AMD Radeon", "Autre"] },
    { name: "systeme", label: "Système d'exploitation", type: "radio", options: ["Windows", "MacOS", "Linux"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 100000, max: 3000000, step: 50000, defaultValue: 650000 }
  ],
  "Téléviseurs": [
    { name: "taille", label: "Diagonale de l'écran", type: "radio", options: ["32 pouces", "43 pouces", "55 pouces", "65 pouces", "75 pouces", "Autre"] },
    { name: "technologie", label: "Technologie d'affichage", type: "radio", options: ["OLED", "QLED", "LED classique", "Mini LED"] },
    { name: "resolution", label: "Résolution native", type: "radio", options: ["HD standard", "Full HD", "4K Ultra HD", "8K Cinéma"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 80000, max: 2000000, step: 20000, defaultValue: 280000 }
  ],
  "Electroménager": [
    { name: "type", label: "Type d'appareil", type: "select", options: ["Réfrigérateur", "Lave-linge", "Micro-ondes", "Four de cuisson", "Lave-vaisselle", "Cafetière", "Autre"] },
    { name: "marque", label: "Marque souhaitée", type: "text", placeholder: "ex: Bosch, Samsung, LG..." },
    { name: "etat", label: "État de l'appareil", type: "radio", options: ["Neuf", "Reconditionné", "Occasion"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 15000, max: 1500000, step: 10000, defaultValue: 250000 }
  ],
  "Accessoires": [
    { name: "type", label: "Type d'accessoire", type: "select", options: ["Sac à dos", "Sac à main", "Casquette", "Ceinture", "Lunettes de soleil", "Portefeuille", "Autre"] },
    { name: "couleur", label: "Couleur souhaitée", type: "color" },
    { name: "marque", label: "Marque ou créateur", type: "text", placeholder: "ex: Gucci, Herschel, Samsonite..." },
    { name: "etat", label: "État souhaité", type: "radio", options: ["Neuf", "Occasion"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 5000, max: 500000, step: 5000, defaultValue: 30000 }
  ],
  "Jeux vidéo": [
    { name: "type", label: "Type de produit", type: "select", options: ["Console de jeu", "Jeu physique", "Manette de contrôle", "Casque gaming", "Autre"] },
    { name: "plateforme", label: "Plateforme / Console", type: "radio", options: ["PS5", "PS4", "Xbox Series", "Nintendo Switch", "PC Gaming"] },
    { name: "titre", label: "Nom du jeu ou modèle", type: "text", placeholder: "ex: EA Sports FC 26, Manette DualSense..." },
    { name: "etat", label: "État du produit", type: "radio", options: ["Neuf", "Occasion"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 5000, max: 600000, step: 5000, defaultValue: 45000 }
  ],
  "Montres": [
    { name: "type", label: "Type de montre", type: "select", options: ["Analogique classique", "Numérique sportive", "Connectée (Smartwatch)", "Automatique haut de gamme"] },
    { name: "marque", label: "Marque souhaitée", type: "text", placeholder: "ex: Seiko, Apple, Rolex, Huawei..." },
    { name: "matiere", label: "Matière du bracelet", type: "select", options: ["Cuir véritable", "Acier / Métal", "Silicone", "Tissu tressé", "Autre"] },
    { name: "etat", label: "État souhaité", type: "radio", options: ["Neuf", "Occasion", "Reconditionné"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 10000, max: 2000000, step: 10000, defaultValue: 120000 }
  ],
  "Beauté": [
    { name: "type", label: "Catégorie beauté", type: "select", options: ["Parfum d'exception", "Maquillage pro", "Soin du visage", "Soin du corps", "Traitement capillaire", "Autre"] },
    { name: "marque", label: "Marque / Maison", type: "text", placeholder: "ex: Chanel, Dior, Lancôme..." },
    { name: "contenance", label: "Contenance flacon", type: "select", options: ["30 ml", "50 ml", "100 ml", "200 ml", "Autre"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 5000, max: 300000, step: 5000, defaultValue: 65000 }
  ],
  "Mobilier": [
    { name: "type", label: "Type de meuble", type: "select", options: ["Chaise de designer", "Fauteuil de salon", "Canapé d'angle", "Table basse", "Lit double", "Bureau de travail", "Autre"] },
    { name: "matiere", label: "Essence de bois / Matière", type: "select", options: ["Bois massif noble", "Structure métal", "Velours premium", "Laine bouclée", "Cuir d'Italie", "Plastique éco-sourcé"] },
    { name: "couleur", label: "Finition textile", type: "color" },
    { name: "dimensions", label: "Dimensions souhaitées", type: "text", placeholder: "ex: 180cm x 90cm, standard..." },
    { name: "etat", label: "État du meuble", type: "radio", options: ["Neuf", "Occasion"] },
    { name: "budget", label: "Budget maximum", type: "slider", min: 50000, max: 5000000, step: 25000, defaultValue: 250000 }
  ],
  "Autre": [
    { name: "nom_produit", label: "Désignation de l'article recherché", type: "text", placeholder: "Entrez le nom ou modèle du produit..." },
    { name: "etat", label: "État recherché", type: "radio", options: ["Neuf", "D'occasion", "Peu importe"] },
    { name: "budget", label: "Budget maximum estimé", type: "slider", min: 5000, max: 5000000, step: 10000, defaultValue: 100000 }
  ]
};

interface AIAnalysisPayload {
  similarCategories: string[];
  foundExactMatch: boolean;
  matchedProductId: string | null;
  matchedProductMessage: string | null;
  nearbyProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
    matchReason: string;
  }>;
  alternatives: Array<{ name: string; price: number; description: string }>;
  performantUpgrades: Array<{ name: string; price: number; description: string }>;
  compatibleAccessories: Array<{ name: string; price: number; description: string }>;
  aiTips: string;
}

export default function InteractiveModel({ 
  products = [], 
  onAddToCart, 
  lang = "fr", 
  currency = "CFA",
  currentUser,
  siteConfig
}: InteractiveModelProps) {
  
  // Steps: 1 = Catégorie, 2 = Caractéristiques, 3 = Détails & Contact, 4 = Finalisation/Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Master Configurator state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [characteristics, setCharacteristics] = useState<Record<string, string>>({});
  const [description, setDescription] = useState<string>("");
  const [beContacted, setBeContacted] = useState<boolean>(true);
  const [contactChannel, setContactChannel] = useState<"email" | "phone" | "whatsapp">("email");
  const [contactValue, setContactValue] = useState<string>("");
  const [desiredDelay, setDesiredDelay] = useState<string>("Cette semaine");
  const [desiredQuantity, setDesiredQuantity] = useState<string>("1");
  const [country, setCountry] = useState<string>("Sénégal");
  const [city, setCity] = useState<string>("Dakar");

  // AI Matches and Analysis States
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIAnalysisPayload | null>(null);
  const [aiError, setAiError] = useState<boolean>(false);
  
  // Submit action states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitProgressStage, setSubmitProgressStage] = useState<string>("");
  const [successRequestId, setSuccessRequestId] = useState<string>("");

  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize characteristics when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    const fields = CATEGORY_FIELDS[selectedCategory] || [];
    const initialSpecs: Record<string, string> = {};
    fields.forEach(f => {
      if (f.type === "color") {
        initialSpecs[f.name] = AVAILABLE_COLORS[0].name;
      } else if (f.type === "slider") {
        initialSpecs[f.name] = String(f.defaultValue || f.min || 0);
      } else if (f.options && f.options.length > 0) {
        initialSpecs[f.name] = f.options[0];
      } else {
        initialSpecs[f.name] = "";
      }
    });
    setCharacteristics(initialSpecs);
  }, [selectedCategory]);

  // Trigger AI Matching dynamically with Debounce (2000ms)
  useEffect(() => {
    if (!selectedCategory) {
      setAiSuggestions(null);
      setAiError(false);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setAiLoading(true);
    setAiError(false);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/analyze-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedCategory,
            characteristics,
            description
          })
        });
        if (response.ok) {
          const data = await response.json();
          setAiSuggestions(data);
          setAiError(false);
        } else {
          setAiSuggestions(null);
          setAiError(true);
        }
      } catch (err) {
        console.error("Failed to run real-time AI product analysis:", err);
        setAiSuggestions(null);
        setAiError(true);
      } finally {
        setAiLoading(false);
      }
    }, 2000);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedCategory, characteristics, description]);

  // Pre-populate contact fields if user details are available
  useEffect(() => {
    if (currentUser) {
      if (currentUser.email && !contactValue) {
        setContactValue(currentUser.email);
        setContactChannel("email");
      } else if (currentUser.phoneNumber && !contactValue) {
        setContactValue(currentUser.phoneNumber);
        setContactChannel("phone");
      }
    }
  }, [currentUser]);

  // Calculate current estimated budget based on the slider or fallback
  const estimatedBudget = useMemo(() => {
    if (characteristics.budget) {
      return Number(characteristics.budget);
    }
    const currentFields = CATEGORY_FIELDS[selectedCategory] || [];
    const budgetField = currentFields.find(f => f.name === "budget");
    return budgetField ? (budgetField.defaultValue as number) : 75000;
  }, [characteristics, selectedCategory]);

  // Exact matching catalog product logic
  const matchedCatalogProduct = useMemo(() => {
    if (!aiSuggestions || !aiSuggestions.foundExactMatch || !aiSuggestions.matchedProductId) {
      return null;
    }
    return products.find(p => p.id === aiSuggestions.matchedProductId) || null;
  }, [aiSuggestions, products]);

  // Handle category visual selection
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentStep(2);
  };

  // Submit complete custom product request to Firestore
  const handleSendRequest = async () => {
    if (beContacted && !contactValue) {
      alert("Veuillez renseigner vos coordonnées de contact pour être recontacté.");
      return;
    }

    setSubmitting(true);
    const stages = [
      "Analyse des spécifications...",
      "Archivage de votre demande...",
      "Synchronisation avec nos maîtres d'oeuvre...",
      "Génération du dossier de recherche..."
    ];

    // Cycle through stages for beautiful dynamic visuals
    for (let i = 0; i < stages.length; i++) {
      setSubmitProgressStage(stages[i]);
      await new Promise(resolve => setTimeout(resolve, 550));
    }

    const generatedId = `RQ-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const requestPayload = {
        id: generatedId,
        category: selectedCategory,
        characteristics,
        description: description || "Aucune description complémentaire fournie.",
        beContacted,
        contactChannel,
        contactValue,
        desiredDelay,
        desiredQuantity: Number(desiredQuantity) || 1,
        country,
        city,
        estimatedBudget,
        userId: currentUser?.uid || "anonymous",
        userDisplayName: currentUser?.displayName || "Invité d'Atelier",
        createdAt: serverTimestamp(),
        status: "En attente d'attribution",
        isBespokeRequest: true
      };

      await setDoc(doc(db, "product_requests", generatedId), requestPayload);
      setSuccessRequestId(generatedId);
      setCurrentStep(4);
      triggerOrderCelebration();
    } catch (err) {
      console.warn("Firestore database offline/error while submitting custom request, storing locally:", err);
      // Fallback local storage backup for seamless user experience
      try {
        const localRequests = JSON.parse(localStorage.getItem("nexus_local_product_requests") || "[]");
        localRequests.push({
          id: generatedId,
          category: selectedCategory,
          characteristics,
          description: description || "Aucune description complémentaire fournie.",
          beContacted,
          contactChannel,
          contactValue,
          desiredDelay,
          desiredQuantity: Number(desiredQuantity) || 1,
          country,
          city,
          estimatedBudget,
          userId: currentUser?.uid || "anonymous",
          userDisplayName: currentUser?.displayName || "Invité d'Atelier",
          createdAt: new Date().toISOString(),
          status: "En attente d'attribution",
          isBespokeRequest: true
        });
        localStorage.setItem("nexus_local_product_requests", JSON.stringify(localRequests));
      } catch (e) {
        console.warn("Local storage fallback error:", e);
      }
      setSuccessRequestId(generatedId);
      setCurrentStep(4);
      triggerOrderCelebration();
    } finally {
      setSubmitting(false);
    }
  };

  // Reset complete wizard form
  const handleResetForm = () => {
    setSelectedCategory("");
    setCharacteristics({});
    setDescription("");
    setBeContacted(true);
    setDesiredDelay("Cette semaine");
    setDesiredQuantity("1");
    setCountry("Sénégal");
    setCity("Dakar");
    setSuccessRequestId("");
    setCurrentStep(1);
  };

  const stepsHeader = [
    { num: 1, title: "Catégorie" },
    { num: 2, title: "Caractéristiques" },
    { num: 3, title: "Détails & Envoi" }
  ];

  return (
    <div id="intelligent-configurator" className="w-full max-w-7xl mx-auto space-y-8">
      
      {/* Dynamic progression indicator block */}
      <div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-10 h-10 rounded-2xl bg-[#2d4a22]/10 dark:bg-[#2d4a22]/30 flex items-center justify-center">
            <Sparkle className="w-5 h-5 text-[#2d4a22] dark:text-emerald-450" />
          </div>
          <div>
            <h3 className="font-sans font-black text-slate-900 dark:text-white text-base tracking-tight">
              Configurateur Intelligent de Recherche
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Créez votre demande d'article introuvable en quelques étapes guidées par l'IA.
            </p>
          </div>
        </div>

        {/* Stepper Progression dots */}
        <div className="flex items-center gap-2 md:gap-4 select-none">
          {stepsHeader.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isActive = currentStep === st.num;
            return (
              <div key={`step-head-${st.num}-${idx}`} className="flex items-center">
                <button
                  type="button"
                  disabled={st.num > currentStep && !selectedCategory}
                  onClick={() => setCurrentStep(st.num)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold font-sans transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#2d4a22] text-white shadow-md shadow-[#2d4a22]/10"
                      : isCompleted
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#2d4a22]"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                    {isCompleted ? <Check className="w-3 h-3 text-[#2d4a22]" /> : st.num}
                  </span>
                  <span>{st.title}</span>
                </button>
                {idx < stepsHeader.length - 1 && (
                  <div className="w-3 md:w-8 h-0.5 bg-slate-200 dark:bg-slate-800 mx-2 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main container with Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE STEP FORM (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CATEGORY SELECTION */}
            {currentStep === 1 && (
              <motion.div
                key="step1-category"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22]">Étape 1 sur 3</span>
                  <h4 className="font-sans text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Quelle est la catégorie du produit recherché ?
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Sélectionnez la catégorie ci-dessous pour adapter instantanément les caractéristiques techniques.
                  </p>
                </div>

                {/* Grid layout of stylish cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4.5">
                  {CATEGORIES.map((cat, idx) => {
                    const CatIcon = cat.icon;
                    const isSel = selectedCategory === cat.id;
                    return (
                      <button
                        key={`cat-${cat.id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`group p-4 md:p-5 rounded-2xl border text-left flex flex-col justify-between gap-4 transition-all relative overflow-hidden cursor-pointer ${
                          isSel 
                            ? "bg-[#2d4a22]/5 border-[#2d4a22] ring-1 ring-[#2d4a22] dark:border-emerald-450"
                            : "bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 hover:bg-[#2d4a22]/5 hover:border-[#2d4a22]/30 hover:shadow-md"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isSel 
                            ? "bg-[#2d4a22] text-white" 
                            : "bg-slate-105 dark:bg-slate-800 group-hover:bg-[#2d4a22] group-hover:text-white text-slate-700 dark:text-slate-300"
                        }`}>
                          <CatIcon className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <span className="font-sans font-bold text-xs text-slate-900 dark:text-white block tracking-tight group-hover:text-[#2d4a22] dark:group-hover:text-emerald-400 transition-colors">
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-normal block mt-1 line-clamp-1">
                            {cat.description}
                          </span>
                        </div>

                        {/* subtle animated dots background decoration */}
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-[#2d4a22]/5 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: CHARACTERISTICS FOR CHOSEN CATEGORY */}
            {currentStep === 2 && (
              <motion.div
                key="step2-characteristics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-101 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22]">Étape 2 sur 3</span>
                    <h4 className="font-sans text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Personnalisez les caractéristiques
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Les critères ci-dessous ont été générés intelligemment pour la catégorie <strong className="text-[#2d4a22] dark:text-emerald-450 font-bold">{selectedCategory}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="self-start sm:self-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-350 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-colors border border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
                  >
                    Changer de catégorie
                  </button>
                </div>

                {/* Map dynamic fields */}
                <div className="space-y-5">
                  {(CATEGORY_FIELDS[selectedCategory] || []).map((f, fIdx) => {
                    const val = characteristics[f.name] || "";
                    
                    return (
                      <div key={`catfield-${selectedCategory}-${f.name}-${fIdx}`} className="space-y-2">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-205 flex items-center justify-between">
                          <span>{f.label}</span>
                          {f.type === "slider" && (
                            <span className="font-mono text-xs text-[#2d4a22] dark:text-emerald-400 font-bold bg-[#2d4a22]/5 dark:bg-[#2d4a22]/10 px-2.5 py-0.5 rounded-full">
                              {Number(val).toLocaleString()} F CFA
                            </span>
                          )}
                        </label>

                        {/* Type: SELECT DROPDOWN */}
                        {f.type === "select" && (
                          <select
                            value={val}
                            onChange={(e) => setCharacteristics(prev => ({ ...prev, [f.name]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-[#2d4a22] transition-colors"
                          >
                            {f.options?.map((opt, idx) => (
                              <option key={`fselect-${f.name}-${opt}-${idx}`} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {/* Type: TEXT INPUT */}
                        {f.type === "text" && (
                          <input
                            type="text"
                            placeholder={f.placeholder}
                            value={val}
                            onChange={(e) => setCharacteristics(prev => ({ ...prev, [f.name]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#2d4a22] transition-colors"
                          />
                        )}

                        {/* Type: SLIDER RANGE */}
                        {f.type === "slider" && (
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={f.min}
                              max={f.max}
                              step={f.step}
                              value={val || f.defaultValue}
                              onChange={(e) => setCharacteristics(prev => ({ ...prev, [f.name]: e.target.value }))}
                              className="w-full accent-[#2d4a22] h-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Min: {f.min?.toLocaleString()} FCFA</span>
                              <span>Max: {f.max?.toLocaleString()} FCFA</span>
                            </div>
                          </div>
                        )}

                        {/* Type: RADIO CHIPS */}
                        {f.type === "radio" && (
                          <div className="flex flex-wrap gap-2">
                            {f.options?.map((opt, idx) => {
                              const isActive = val === opt;
                              return (
                                <button
                                  key={`fradio-${f.name}-${opt}-${idx}`}
                                  type="button"
                                  onClick={() => setCharacteristics(prev => ({ ...prev, [f.name]: opt }))}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all ${
                                    isActive
                                      ? "bg-[#2d4a22] text-white shadow-sm"
                                      : "bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Type: INTERACTIVE COLOR SPOTS */}
                        {f.type === "color" && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {AVAILABLE_COLORS.map((col, cIdx) => {
                              const isActive = val === col.name;
                              return (
                                <button
                                  key={`colspot-${col.name}-${cIdx}`}
                                  type="button"
                                  onClick={() => setCharacteristics(prev => ({ ...prev, [f.name]: col.name }))}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                    isActive
                                      ? "border-[#2d4a22] bg-[#2d4a22]/5 text-[#2d4a22] ring-2 ring-[#e6eee3] dark:ring-slate-800"
                                      : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350"
                                  }`}
                                >
                                  <span 
                                    className="w-4 h-4 rounded-full inline-block border border-black/10 shrink-0"
                                    style={{ backgroundColor: col.hex }}
                                  ></span>
                                  <span className="text-[10px] font-bold line-clamp-1">{col.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* Footer buttons row */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs uppercase font-extrabold tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-3 bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs uppercase font-extrabold tracking-wider rounded-xl transition-all shadow-md shadow-[#2d4a22]/10 hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Continuer <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS & DESCRIPTIONS & SUBMIT */}
            {currentStep === 3 && (
              <motion.div
                key="step3-details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-101 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left"
              >
                <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22]">Étape 3 sur 3</span>
                  <h4 className="font-sans text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Décrivez précisément le produit recherché
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Plus vous fournissez d'éléments (marques de référence, dimensions précises, matière), plus notre service de sourcing sera rapide.
                  </p>
                </div>

                {/* Big Precise Description Text Area */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Spécifications et description libre *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Saisissez ici des détails précis (Exemple : Je recherche un canapé d'angle de 3 places, convertible, couleur vieux rose en velours, avec des pieds en noyer massif. Sans accoudoirs si possible.)"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#2d4a22] transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* Grid for Quantity and Desired delay */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Desired Quantity selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">Quantité recherchée</label>
                    <div className="flex gap-1.5">
                      {["1", "2", "3", "4", "5+"].map((q, qIdx) => {
                        const isQSel = desiredQuantity === q;
                        return (
                          <button
                            key={`des-qty-${q}-${qIdx}`}
                            type="button"
                            onClick={() => setDesiredQuantity(q)}
                            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                              isQSel 
                                ? "bg-[#2d4a22] text-white" 
                                : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-350"
                            }`}
                          >
                            {q}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desired Delay selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">Délai souhaité de réception</label>
                    <select
                      value={desiredDelay}
                      onChange={(e) => setDesiredDelay(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-805 dark:text-slate-250 outline-none cursor-pointer focus:border-[#2d4a22]"
                    >
                      <option value="Urgent">⚠️ Urgent (Moins de 3 jours)</option>
                      <option value="Cette semaine">⚡ Cette semaine</option>
                      <option value="Ce mois-ci">📅 Ce mois-ci</option>
                      <option value="Aucune urgence">😌 Aucune urgence</option>
                    </select>
                  </div>

                </div>

                {/* Country and City Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">Pays de livraison</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Sénégal, Côte d'Ivoire, France..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#2d4a22]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">Ville de destination</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Dakar, Abidjan, Paris..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#2d4a22]"
                    />
                  </div>
                </div>

                {/* Contact Notification Checkbox and Fields */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={beContacted}
                      onChange={(e) => setBeContacted(e.target.checked)}
                      className="mt-1 w-4.5 h-4.5 accent-[#2d4a22] rounded cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Je souhaite être contacté lorsque ce produit sera disponible
                      </span>
                      <span className="text-[10px] text-slate-450 block leading-normal">
                        Nos conseillers vous recontacteront par le canal sélectionné dès qu'un produit valide est trouvé.
                      </span>
                    </div>
                  </label>

                  {beContacted && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      
                      {/* Channel */}
                      <div className="sm:col-span-4">
                        <select
                          value={contactChannel}
                          onChange={(e: any) => setContactChannel(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="email">📧 Email</option>
                          <option value="phone">📞 Téléphone</option>
                          <option value="whatsapp">💬 WhatsApp</option>
                        </select>
                      </div>

                      {/* Value Input */}
                      <div className="sm:col-span-8">
                        <input
                          type={contactChannel === "email" ? "email" : "tel"}
                          required
                          value={contactValue}
                          onChange={(e) => setContactValue(e.target.value)}
                          placeholder={
                            contactChannel === "email" 
                              ? "ex : client@distingue.com" 
                              : "ex : +221 77 123 45 67"
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-[#2d4a22]"
                        />
                      </div>

                    </div>
                  )}
                </div>

                {/* Back and Submit Actions row */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs uppercase font-extrabold tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Précédent
                  </button>

                  <button
                    type="button"
                    disabled={submitting || !description.trim()}
                    onClick={handleSendRequest}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs uppercase font-extrabold tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        <span>{submitProgressStage}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {lang === 'en'
                            ? (siteConfig?.btnCta3TextEn || "Submit Custom Request")
                            : (siteConfig?.btnCta3Text || "Envoyer ma demande")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: GORGEOUS CONFIRMATION SUCCESS */}
            {currentStep === 4 && (
              <motion.div
                key="step4-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-emerald-500/10 rounded-[2rem] p-8 shadow-xl text-center space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100/50">
                  <CheckCircle2 className="w-10 h-10 stroke-[2] animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 tracking-widest bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full">
                    Dossier enregistré avec succès
                  </span>
                  <h3 className="font-sans font-black text-slate-900 dark:text-white text-2xl tracking-tight">
                    Félicitations, demande transmise !
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Votre requête a été indexée et transmise à nos équipes de sourcing d'Atelier ainsi qu'à nos partenaires internationaux.
                  </p>
                </div>

                {/* Code of reference */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 max-w-sm mx-auto text-left space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase font-black">
                    <span>Référence de Requête</span>
                    <span className="text-[#2d4a22]">Statut : Actif</span>
                  </div>
                  <div className="text-lg font-mono font-extrabold text-slate-800 dark:text-slate-100">
                    {successRequestId}
                  </div>
                  <div className="text-[10px] text-slate-505 leading-relaxed font-sans border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    Catégorie : <strong>{selectedCategory}</strong> &bull; Quantité : {desiredQuantity} &bull; Délai : {desiredDelay}
                  </div>
                </div>

                {/* Next Steps Card */}
                <div className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-sans bg-[#2d4a22]/5 p-4 rounded-xl text-left border border-[#2d4a22]/10">
                  <span className="font-black text-[#2d4a22] dark:text-emerald-450 block mb-1">🛠️ Quelle est la suite ?</span>
                  1. Notre algorithme IA poursuit l'évaluation approfondie du marché global.<br/>
                  2. Un de nos artisans d'Atelier vous contactera via <strong>{contactChannel.toUpperCase()} ({contactValue})</strong> sous 24h pour confirmer le lancement ou la commande.<br/>
                  3. Vous recevrez un devis descriptif 100% gratuit et sans engagement.
                </div>

                {/* Reset or retry button */}
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-6 py-3 bg-[#2d4a22] hover:bg-[#1c301a] text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all cursor-pointer shadow-md"
                >
                  Faire une nouvelle recherche
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: INTELLIGENT AI MATCHES & ASSISTANT (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm space-y-5 text-left relative overflow-hidden">
            
            {/* Header tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                <span className="font-sans font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">
                  Assistant IA d'Atelier
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[#2d4a22]/5 px-2.5 py-1 rounded-full border border-[#2d4a22]/10">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="text-[9px] font-mono font-bold uppercase text-[#2d4a22]">Temps réel</span>
              </div>
            </div>

            {/* AI analysis progress indicator */}
            {aiLoading && (
              <div className="py-8 text-center space-y-3.5 animate-pulse">
                <div className="w-10 h-10 border-2 border-[#2d4a22] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-xs text-slate-500 font-mono font-bold block">
                  L'IA analyse vos choix en direct...
                </span>
              </div>
            )}

            {/* If no category is chosen yet */}
            {!selectedCategory && !aiLoading && (
              <div className="py-12 text-center text-slate-400 space-y-3 font-sans">
                <Sliders className="w-10 h-10 mx-auto opacity-35" />
                <p className="text-xs font-semibold leading-relaxed max-w-[200px] mx-auto">
                  Choisissez une catégorie pour démarrer l'assistance et l'analyse de l'IA.
                </p>
              </div>
            )}

            {/* AI Assistant Error / Unavailable message */}
            {selectedCategory && aiError && !aiLoading && (
              <div className="py-8 text-center space-y-3.5 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mx-auto text-slate-405">
                  <AlertTriangle className="w-6 h-6 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Assistant indisponible
                  </span>
                  <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto leading-normal">
                    L'assistant est indisponible en ce moment. Veuillez réessayer plus tard.
                  </p>
                </div>
              </div>
            )}

            {/* AI SUGGESTIONS DISPLAY */}
            {selectedCategory && aiSuggestions && !aiLoading && (
              <div className="space-y-5 animate-scaleUp">
                
                {/* 1. EXACT CATALOG MATCH IF ANY */}
                {aiSuggestions.foundExactMatch && matchedCatalogProduct ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4.5 rounded-2xl space-y-3.5">
                    <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-400">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-sans font-black text-xs block uppercase tracking-tight">
                          Bonne nouvelle !
                        </span>
                        <span className="text-[10px] block leading-normal font-sans text-slate-500">
                          {aiSuggestions.matchedProductMessage || "Nous avons trouvé un produit correspondant dans notre catalogue !"}
                        </span>
                      </div>
                    </div>

                    {/* Exact matched product card */}
                    <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-emerald-200/40 flex gap-3.5 items-center">
                      <ProductMediaGallery 
                        image={matchedCatalogProduct.image}
                        image2={matchedCatalogProduct.image2} 
                        alt={matchedCatalogProduct.name}
                        containerClassName="w-14 h-14 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {matchedCatalogProduct.name}
                        </h5>
                        <p className="text-[10px] text-slate-450 font-mono truncate">
                          {formatPrice(matchedCatalogProduct.price, currency)}
                        </p>
                        <p className="text-[9px] text-emerald-600 font-bold truncate">
                          En stock - Expédition immédiate
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddToCart(
                            matchedCatalogProduct, 
                            matchedCatalogProduct.colors?.[0] || { name: "Signature", hex: "#2d4a22" }, 
                            "Achat direct via Assistant IA", 
                            matchedCatalogProduct.price
                          );
                          alert(`${matchedCatalogProduct.name} a été ajouté à votre panier !`);
                        }}
                        className="p-2 bg-[#2d4a22] hover:bg-[#1c301a] text-white rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Ajouter directement au panier"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-[11px] leading-relaxed text-slate-500 font-sans">
                    <span className="font-bold text-amber-800 dark:text-amber-400 block mb-0.5">ℹ️ Aucun produit identique trouvé</span>
                    Votre demande de recherche exclusive sera transmise à notre atelier afin de le concevoir ou de le sourcer spécialement.
                  </div>
                )}

                {/* 2. DYNAMIC AI TIPS */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#2d4a22] dark:text-emerald-450 block">
                    💡 Analyse & Conseil d'Atelier
                  </span>
                  <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-sans">
                    {aiSuggestions.aiTips}
                  </p>
                </div>

                {/* 3. SIMILAR CATEGORIES CHIPS */}
                {aiSuggestions.similarCategories && aiSuggestions.similarCategories.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                      Catégories similaires recommandées
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.similarCategories.map((c, idx) => (
                        <span key={`sim-cat-${c}-${idx}`} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. RECOMMENDATIONS: ALTERNATIVES, UPGRADES, ACCESSORIES */}
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* Alternatives */}
                  {aiSuggestions.alternatives && aiSuggestions.alternatives.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                        Alternatives moins chères ou durables
                      </span>
                      <div className="space-y-1.5">
                        {aiSuggestions.alternatives.map((alt, idx) => (
                          <div key={`alt-${alt.id || alt.name}-${idx}`} className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4">
                            <div className="text-left">
                              <span className="text-[11px] font-bold text-slate-805 dark:text-white block">{alt.name}</span>
                              <span className="text-[9px] text-slate-400 block leading-normal">{alt.description}</span>
                            </div>
                            <span className="text-[10px] font-mono font-black text-[#2d4a22] dark:text-emerald-400 shrink-0">
                              {alt.price ? `${alt.price.toLocaleString()} FCFA` : "Contact"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upgrades */}
                  {aiSuggestions.performantUpgrades && aiSuggestions.performantUpgrades.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                        Options de niveau supérieur ou Premium
                      </span>
                      <div className="space-y-1.5">
                        {aiSuggestions.performantUpgrades.map((upg, idx) => (
                          <div key={`upg-${upg.id || upg.name}-${idx}`} className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4">
                            <div className="text-left">
                              <span className="text-[11px] font-bold text-slate-805 dark:text-white block">{upg.name}</span>
                              <span className="text-[9px] text-slate-400 block leading-normal">{upg.description}</span>
                            </div>
                            <span className="text-[10px] font-mono font-black text-amber-600 shrink-0">
                              {upg.price ? `${upg.price.toLocaleString()} FCFA` : "Contact"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accessories */}
                  {aiSuggestions.compatibleAccessories && aiSuggestions.compatibleAccessories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                        Accessoires compatibles suggérés
                      </span>
                      <div className="space-y-1.5">
                        {aiSuggestions.compatibleAccessories.map((acc, idx) => (
                          <div key={`acc-${acc.id || acc.name}-${idx}`} className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-101 dark:border-slate-800 flex justify-between items-start gap-4">
                            <div className="text-left">
                              <span className="text-[11px] font-bold text-slate-805 dark:text-white block">{acc.name}</span>
                              <span className="text-[9px] text-slate-450 block leading-normal">{acc.description}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                              {acc.price ? `${acc.price.toLocaleString()} FCFA` : "Contact"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
