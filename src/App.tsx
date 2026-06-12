import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  ArrowRight, 
  Check, 
  Layers, 
  Lock, 
  Unlock,
  Sparkles, 
  User, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  Menu, 
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Tag,
  Heart,
  Search,
  Sliders,
  Info,
  ChevronRight,
  HelpCircle,
  Armchair,
  LogOut,
  ChevronDown,
  History,
  AlertTriangle,
  ArrowUp,
  Star
} from "lucide-react";

import InteractiveModel from "./components/InteractiveModel";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import AdminPortal from "./components/AdminPortal";
import ReviewsCarousel from "./components/ReviewsCarousel";
import { INITIAL_PRODUCTS } from "./data";
import { Product, CartItem } from "./types";
import { db, auth, googleProvider, signInWithPopup, signOut, handleFirestoreError, GoogleAuthProvider } from "./firebase";
import { collection, query, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp, where, addDoc } from "firebase/firestore";
import { TRANSLATIONS, Language, Theme, Currency, formatPrice, CURRENCIES } from "./translations";


export default function App() {
  const [activeTab, setActiveTab] = useState<"store" | "admin" | "collection">("store");
  
  const [siteConfig, setSiteConfig] = useState<{
    id: string;
    footerAbout?: string;
    footerContact?: string;
    footerWarranty?: string;
    heroTitle?: string;
    heroSub?: string;
    heroDesc?: string;
    faq?: { question: string; answer: string }[];
  } | null>(null);
  
  // Auth & UI States
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Settings & Localization parameters (persisted locally)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("nexus_lang") as Language) || "fr";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("nexus_theme") as Theme) || "white";
  });
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem("nexus_currency") as Currency) || "CFA";
  });
  const [categories, setCategories] = useState<string[]>(["Lounge", "Office", "Dining", "Rocking"]);
  const [customOptions, setCustomOptions] = useState<Record<string, { label: string; values: string[] }[]>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Review form states
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewNotif, setReviewNotif] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Active translation dictionary
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Products state - initialized to empty first, synced live from Firestore
  const [products, setProducts] = useState<Product[]>([]);

  // Cart State - Persisted locally
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("nexus_cart_list");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading cart", e);
      }
    }
    return [];
  });

  // Drawer states
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [activeDiscount, setActiveDiscount] = useState(0); // overall percentage discount
  const [appliedCodeName, setAppliedCodeName] = useState("");
  const [promoError, setPromoError] = useState("");

  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "form" | "confirm">("idle");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
    email: "",
    cardNumber: "4970 •••• •••• 9012",
    cvv: "325"
  });
  const [orderTracking, setOrderTracking] = useState("");

  // Favorites spotlight demo item state
  const [spotlightQty, setSpotlightQty] = useState(1);
  const [spotlightColorIdx, setSpotlightColorIdx] = useState(0);
  const [spotlightAdded, setSpotlightAdded] = useState(false);

  // Subscribe to Auth State Changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Protect Admin Route dynamically if user changes/logs out
  useEffect(() => {
    if (activeTab === "admin" && (!user || user.email !== "grasdvirus@gmail.com")) {
      setActiveTab("store");
    }
  }, [user, activeTab]);

  // Sync products dynamically from Firestore products collection (Client side query)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsDbLoading(true);
        const q = query(collection(db, "products"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Keep the catalog as clean/virgin when Firestore has zero products
          setProducts([]);
        } else {
          const loadedProducts: Product[] = [];
          querySnapshot.forEach((docSnapshot) => {
            loadedProducts.push(docSnapshot.data() as Product);
          });
          setProducts(loadedProducts);
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - loaded products from local fallback:", err);
          setProducts(INITIAL_PRODUCTS); // fallback to demo products only when offline/local mode
        } else {
          console.error("Failed to load products from Firestore, using empty list:", err);
          setProducts([]);
        }
      } finally {
        setIsDbLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  // Sync site dynamic configuration from Firestore general or main_config document
  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const q = query(collection(db, "site_config"));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const matched = snapshot.docs.find(d => d.id === "general") || 
                          snapshot.docs.find(d => d.id === "main_config") ||
                          snapshot.docs.find(d => d.id !== "categories_config");
          if (matched) {
            setSiteConfig({ id: matched.id, ...matched.data() } as any);
          }
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - using local fallback for site configuration:", err);
        } else {
          console.error("Failed to load global site configuration values from Firestore:", err);
        }
      }
    };
    fetchSiteConfig();
  }, [activeTab]);

  // Sync user orders tracking history from Firestore
  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }
    const fetchMyOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetched: any[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push(docSnap.data());
        });
        setMyOrders(fetched);
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - user orders history unavailable:", err);
        } else {
          console.error("Error reading past purchases:", err);
        }
      }
    };
    fetchMyOrders();
  }, [user, checkoutStep]);

  // Sync all orders for the admin from Firestore
  useEffect(() => {
    if (!user || user.email !== "grasdvirus@gmail.com") {
      setAllOrders([]);
      return;
    }
    const fetchAllOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const fetched: any[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ ...docSnap.data(), id: docSnap.id });
        });
        // Sort by timestamp newest first
        fetched.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setAllOrders(fetched);
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - admin orders tracking unavailable:", err);
        } else {
          console.error("Error reading all orders for admin:", err);
        }
      }
    };
    fetchAllOrders();
  }, [user, activeTab, checkoutStep]);

  // Sync Settings to LocalStorage
  useEffect(() => {
    localStorage.setItem("nexus_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("nexus_theme", theme);
    if (theme === "black") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("nexus_currency", currency);
  }, [currency]);

  // Sync Cart to local storage
  useEffect(() => {
    localStorage.setItem("nexus_cart_list", JSON.stringify(cart));
  }, [cart]);

  // Track scroll position to reveal "Back to Top" scrolling trigger
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch product categories from Firestore dynamic configuration
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const docSnap = await getDocs(query(collection(db, "site_config")));
        const catDoc = docSnap.docs.find(d => d.id === "categories_config");
        if (catDoc && catDoc.exists()) {
          const data = catDoc.data();
          if (data && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - loading categories from local fallback:", err);
        } else {
          console.error("Failed to load categories list from Firestore:", err);
        }
      }
    };
    fetchCategories();
  }, [user]);

  const handleCategoriesChange = async (newCategories: string[]) => {
    // Optimistic fast update
    const previousCategories = [...categories];
    setCategories(newCategories);
    
    try {
      const docRef = doc(db, "site_config", "categories_config");
      // Fire-and-forget background save without blocking UI thread
      setDoc(docRef, { categories: newCategories }).catch((err) => {
        console.error("Delayed background update of categories config failed:", err);
        setCategories(previousCategories);
      });
    } catch (err) {
      console.warn("Categories instant dispatch config err:", err);
    }
  };

  // Sync custom options from Firestore on mount/activeTab change
  useEffect(() => {
    const fetchCustomOptions = async () => {
      try {
        const docRef = doc(db, "site_config", "custom_options_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomOptions(docSnap.data().product_options_map || {});
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - custom options from local fallback:", err);
        } else {
          console.error("Failed to load product custom options from Firestore:", err);
        }
      }
    };
    fetchCustomOptions();
  }, [activeTab]);

  const handleSaveCustomOptions = async (newMap: Record<string, { label: string; values: string[] }[]>) => {
    // Optimistic fast update
    const previousOptions = { ...customOptions };
    setCustomOptions(newMap);
    
    try {
      const docRef = doc(db, "site_config", "custom_options_config");
      // Background save without blocking UI thread
      setDoc(docRef, { product_options_map: newMap }).catch((err) => {
        console.error("Delayed background custom options save failed:", err);
        setCustomOptions(previousOptions);
      });
    } catch (err) {
      console.warn("Custom options change dispatch err:", err);
    }
  };

  // Google Sign-In helper triggers Google Auth Provider
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google authentication failed:", e);
    }
  };

  // Logout helper triggers firebase sign out
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserDropdownOpen(false);
    } catch (e) {
      console.error("Sign-out failed:", e);
    }
  };

  // Admin seed database helper
  const handleSeedDatabase = async () => {
    if (!user || user.email !== "grasdvirus@gmail.com") {
      alert("Seul l'administrateur (grasdvirus@gmail.com) peut restaurer le catalogue initial dans Firestore.");
      return;
    }
    try {
      if (window.confirm("Voulez-vous peupler Firestore avec les produits de démonstration initiaux ?")) {
        for (const prod of INITIAL_PRODUCTS) {
          await setDoc(doc(db, "products", prod.id), prod);
        }
        // Also seed categories config doc
        const catRef = doc(db, "site_config", "categories_config");
        await setDoc(catRef, { categories: ["Lounge", "Office", "Dining", "Rocking"] });
        setCategories(["Lounge", "Office", "Dining", "Rocking"]);

        alert("Idées démo et catégories synchronisées avec succès dans Firestore !");
        // Re-read products trigger
        const q = query(collection(db, "products"));
        const querySnapshot = await getDocs(q);
        const loaded: Product[] = [];
        querySnapshot.forEach((d) => loaded.push(d.data() as Product));
        setProducts(loaded);
      }
    } catch (err: any) {
      console.error("Failed to seed items database:", err);
      try {
        handleFirestoreError(err);
      } catch (fmtDocErr: any) {
        const detObj = JSON.parse(fmtDocErr.message);
        alert(`Échec de la ré-initialisation : ${detObj.message}`);
      }
    }
  };

  // Admin add, update and remove connected to firestore
  const handleAddNewProduct = async (newProduct: Product) => {
    // Optimistic UI update
    const previousProducts = [...products];
    setProducts([newProduct, ...products]);

    try {
      // Async fire and forget
      setDoc(doc(db, "products", newProduct.id), newProduct).catch((e: any) => {
        console.error("Background product publishing failed:", e);
        setProducts(previousProducts);
      });
    } catch (e: any) {
      console.warn("Product add instant dispatch err:", e);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    // Optimistic UI update
    const previousProducts = [...products];
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    try {
      // Async fire and forget
      setDoc(doc(db, "products", updatedProduct.id), updatedProduct).catch((e: any) => {
        console.error("Background product update failed:", e);
        setProducts(previousProducts);
      });
    } catch (e: any) {
      console.warn("Product update instant dispatch err:", e);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    // Optimistic UI update
    const previousProducts = [...products];
    const previousCart = [...cart];
    setProducts(products.filter(p => p.id !== productId));
    setCart(cart.filter(item => item.product.id !== productId));

    try {
      // Async fire and forget
      deleteDoc(doc(db, "products", productId)).catch((e: any) => {
        console.error("Background product deletion failed, reverting:", e);
        setProducts(previousProducts);
        setCart(previousCart);
      });
    } catch (e: any) {
      console.warn("Product delete instant dispatch err:", e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Optimistic UI update
    const previousAllOrders = [...allOrders];
    const previousMyOrders = [...myOrders];
    setAllOrders(allOrders.filter(ord => ord.id !== orderId));
    setMyOrders(myOrders.filter(ord => ord.id !== orderId));

    try {
      // Async fire and forget
      deleteDoc(doc(db, "orders", orderId)).catch((e: any) => {
        console.error("Background order deletion failed, reverting:", e);
        setAllOrders(previousAllOrders);
        setMyOrders(previousMyOrders);
      });
    } catch (e: any) {
      console.warn("Order delete instant dispatch err:", e);
    }
  };

  // Add to Cart helper
  const handleAddToCart = (product: Product, color: { name: string; hex: string }, variant?: string, customPrice?: number) => {
    const cartEntryId = `${product.id}-${color.name}-${variant || "none"}`;
    
    const existingIndex = cart.findIndex(item => {
      const itemKey = `${item.product.id}-${item.selectedColor.name}-${item.selectedVariant || "none"}`;
      return itemKey === cartEntryId;
    });

    const finalProduct = customPrice ? { ...product, price: customPrice } : product;

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        product: finalProduct,
        selectedColor: color,
        selectedVariant: variant,
        quantity: 1
      }]);
    }

    // Auto-open side drawer to verify the action
    setCartOpen(true);
  };

  const handleSpotlightAddToCart = () => {
    const spotlightItem = products.find(p => p.id === "sienna-lounge") || products[0];
    if (!spotlightItem) return;

    const selectedColor = spotlightItem.colors[spotlightColorIdx] || spotlightItem.colors[0];
    const defaultVariant = spotlightItem.variants ? spotlightItem.variants[0] : undefined;

    // Insert purchase with exact quantity
    const cartEntryId = `${spotlightItem.id}-${selectedColor.name}-${defaultVariant || "none"}`;
    const existingIndex = cart.findIndex(item => {
      const itemKey = `${item.product.id}-${item.selectedColor.name}-${item.selectedVariant || "none"}`;
      return itemKey === cartEntryId;
    });

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += spotlightQty;
      setCart(newCart);
    } else {
      setCart([...cart, {
        product: spotlightItem,
        selectedColor: selectedColor,
        selectedVariant: defaultVariant,
        quantity: spotlightQty
      }]);
    }

    setSpotlightAdded(true);
    setCartOpen(true);
    setTimeout(() => setSpotlightAdded(false), 2000);
  };

  // Cart quantities update and item removal
  const updateCartQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + delta;
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = newQty;
    }
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Promo operations
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCodeInput.trim().toUpperCase() === "WELCOME10") {
      setActiveDiscount(10);
      setAppliedCodeName("WELCOME10 (-10%)");
      setPromoError("");
      setPromoCodeInput("");
    } else {
      setPromoError(lang === "en" ? "Invalid code. Use WELCOME10" : lang === "es" ? "Código no válido." : lang === "ar" ? "رمز ترويجي غير صحيح. استخدم WELCOME10" : "Code invalide. Utilisez WELCOME10");
    }
  };

  // Checkout values calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = Math.round((subtotal * activeDiscount) / 100);
  const currentRate = CURRENCIES[currency]?.rate || 1.0;
  const shippingCharge = subtotal === 0 ? 0 : (2000 / currentRate);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCharge);

  const handleLaunchCheckout = () => {
    setCheckoutStep("form");
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      alert(lang === "en" ? "Please fill required fields" : "Veuillez renseigner les champs requis.");
      return;
    }

    if (!user) {
      alert(lang === "en" ? "Kindly authenticate before checkout." : "Veuillez vous connecter pour valider votre commande.");
      return;
    }

    const orderId = `NX-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const orderDoc = {
        id: orderId,
        userId: user.uid,
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        zip: shippingAddress.zip || "",
        phone: shippingAddress.phone || "",
        email: shippingAddress.email || "",
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedVariant: item.selectedVariant || ""
        })),
        subtotal: subtotal,
        discount: activeDiscount,
        shipping: shippingCharge,
        total: grandTotal,
        createdAt: serverTimestamp() // Set dynamically on server to preserve temporal integrity
      };

      await setDoc(doc(db, "orders", orderId), orderDoc);
      setOrderTracking(orderId);
      setCheckoutStep("confirm");
    } catch (err: any) {
      console.error("Failed to place order in Firestore:", err);
      try {
        handleFirestoreError(err);
      } catch (fmtErr: any) {
        const payload = JSON.parse(fmtErr.message);
        alert(`Erreur de paiement Firestore: ${payload.message}\n${payload.details || ""}`);
      }
    }
  };

  const handleFinishCheckout = () => {
    setCart([]);
    setCheckoutStep("idle");
    setCartOpen(false);
  };

  // Navigate directly to an element anchor ID
  const handleScrollToId = (id: string) => {
    setActiveTab("store");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Spotlight Product selection reference
  const spotlightProduct = products.find(p => p.id === "sienna-lounge") || products[0];

  const isRTL = lang === "ar";

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        theme === "black" 
          ? "bg-slate-950 text-slate-100 selection:bg-[#2d4a22]/30 selection:text-emerald-400" 
          : "bg-white text-slate-800 selection:bg-[#2d4a22]/10 selection:text-[#2d4a22]"
      } overflow-x-hidden antialiased font-sans`}
      dir={isRTL ? "rtl" : "ltr"}
      id="nexus-root-container"
    >
      
      {/* Premium organic ambient glows exactly matching the reference style */}
      <div className="absolute top-0 inset-x-0 h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-250px] left-[10%] w-[650px] h-[650px] rounded-full glow-purple"></div>
        <div className="absolute top-[-150px] right-[5%] w-[600px] h-[600px] rounded-full glow-blue"></div>
        <div className="absolute top-[250px] left-[25%] w-[550px] h-[550px] rounded-full glow-lavender opacity-65"></div>
      </div>

      {/* FLOATING NAVBAR HEADER */}
      <header className="sticky top-4 z-40 max-w-5xl mx-auto px-4">
        <div className={`rounded-2xl border px-6 py-4 flex items-center justify-between transition-all sleek-shadow-sm ${
          theme === "black"
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-white/80 border-[#e6eee3] text-slate-850 backdrop-blur-md"
        }`}>
          
          {/* Logo with Green indicator */}
          <div 
            onClick={() => handleScrollToId("store-hero")} 
            className="flex items-center gap-1.5 cursor-pointer group select-none"
          >
            <span className={`font-sans font-black text-xl tracking-tight ${theme === 'black' ? 'text-white' : 'text-slate-900'}`}>
              nexus<span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2d4a22] ml-0.5 animate-pulse"></span>
            </span>
          </div>

          {/* Center navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-widest font-extrabold text-slate-500">
            <button 
              onClick={() => handleScrollToId("store-hero")} 
              className="hover:text-[#2d4a22] hover:dark:text-emerald-400 transition-colors cursor-pointer text-[10px]"
            >
              {t.home}
            </button>
            <button 
              onClick={() => handleScrollToId("interactive-model-sandbox")} 
              className="hover:text-[#2d4a22] text-[#2d4a22]/90 hover:dark:text-emerald-400 transition-colors cursor-pointer font-bold flex items-center gap-1 text-[10px]"
            >
              {t.atelier} <span className="text-[9px] bg-[#2d4a22]/10 dark:bg-[#2d4a22]/30 px-1 py-0.5 rounded">Custom</span>
            </button>
            <button 
              onClick={() => handleScrollToId("pricing-plans")} 
              className="hover:text-[#2d4a22] hover:dark:text-emerald-400 transition-colors cursor-pointer text-[10px]"
            >
              {t.collection}
            </button>
            <button 
              onClick={() => handleScrollToId("faqs-anchor")} 
              className="hover:text-[#2d4a22] hover:dark:text-emerald-400 transition-colors cursor-pointer text-[10px]"
            >
              {t.help}
            </button>
          </nav>

          {/* Action trigger items */}
          <div className="flex items-center gap-3">
            
            {/* SETTINGS BUTTON (Contains Multi-language translations, theme colors, currencies toggles) */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 bg-[#f4f8f3] dark:bg-slate-800 border border-[#e2eae0] dark:border-slate-700 rounded-xl hover:bg-[#eef5eb] dark:hover:bg-slate-750 cursor-pointer text-slate-800 dark:text-slate-100 transition-all flex items-center gap-1.5 shadow-2xs select-none"
              title="Paramètres / Settings"
              id="settings-trigger-btn"
            >
              <Sliders className="w-4 h-4 text-[#2d4a22]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider hidden md:inline text-slate-705 dark:text-slate-200">
                {lang === "en" ? "Settings" : lang === "es" ? "Ajustes" : lang === "ar" ? "الإعدادات" : "Paramètres"}
              </span>
            </button>

            {/* GOOGLE SIGN IN OR USER DISPLAY PROFILE BLOCK */}
            {authChecking ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border border-[#e2eae0] dark:border-slate-700"></div>
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="p-1 px-2.5 bg-[#f4f8f3] dark:bg-slate-800 border border-[#e2eae0] dark:border-slate-700 rounded-xl hover:bg-[#eef5eb] dark:hover:bg-slate-750 cursor-pointer text-slate-800 dark:text-slate-100 transition-all flex items-center gap-1.5 shadow-2xs select-none"
                  id="user-profile-menu-button"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User Avatar" 
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full border border-white"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-[#2d4a22]/10 text-[#2d4a22] rounded-full flex items-center justify-center">
                      <User className="w-3" />
                    </div>
                  )}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline text-slate-700 dark:text-slate-200">{t.myAccount}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="p-1.5 px-3 bg-white dark:bg-slate-800 border border-[#2d4a22]/20 dark:border-slate-700 hover:border-[#2d4a22] text-[#2d4a22] dark:text-slate-100 font-semibold rounded-xl hover:bg-[#2d4a22]/5 dark:hover:bg-slate-750 cursor-pointer text-xs tracking-wide transition-all flex items-center gap-1 shadow-2xs select-none"
                id="google-login-trigger"
              >
                <User className="w-3.5 h-3.5 text-[#2d4a22]" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{t.login}</span>
              </button>
            )}

            {/* Shopping Cart button handle */}
            <button 
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 bg-[#f4f8f3] dark:bg-slate-800 border border-[#e2eae0] dark:border-slate-700 rounded-xl hover:bg-[#eef5eb] dark:hover:bg-slate-750 cursor-pointer text-slate-800 dark:text-slate-100 transition-all flex items-center gap-1.5 shadow-2xs select-none"
              id="cart-hand-btn"
            >
              <ShoppingBag className="w-4 h-4 text-[#2d4a22]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline text-slate-705 dark:text-slate-200">{t.cart}</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 bg-[#2d4a22] text-white font-mono text-[10px] font-bold rounded-full items-center justify-center shadow-md border-2 border-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Admin toggle padlock button - conditionally displayed ONLY to grasdvirus@gmail.com */}
            {user && user.email === "grasdvirus@gmail.com" && (
              <button
                onClick={() => {
                  setActiveTab(activeTab === "store" ? "admin" : "store");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`text-[10px] uppercase font-extrabold tracking-widest px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 select-none ${
                  activeTab === "admin"
                    ? "bg-[#2d4a22]/10 text-[#2d4a22] border border-[#2d4a22]/20"
                    : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-white"
                }`}
              >
                {activeTab === "admin" ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    {t.store || "Boutique"}
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    {t.admin || "Admin 🔐"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CORE DISPLAY PORT VIEW */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-16 space-y-16 md:space-y-24">
        
        {activeTab === "admin" ? (
          /* ADMIN PORTAL GATEWAY */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <AdminPortal 
              products={products}
              onAddProduct={handleAddNewProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              currentUser={user}
              onGoogleLogin={handleGoogleLogin}
              categories={categories}
              onCategoriesChange={handleCategoriesChange}
              orders={allOrders}
              onDeleteOrder={handleDeleteOrder}
              customOptions={customOptions}
              onSaveCustomOptions={handleSaveCustomOptions}
              onSaveSiteConfig={setSiteConfig}
            />
          </motion.div>
        ) : activeTab === "collection" ? (
          /* DEDICATED COLUMN COLLECTION VIEW */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 py-6 text-left"
          >
            {/* Header and Back navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 text-left">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("store");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-[10px] font-mono font-bold text-[#2d4a22] dark:text-emerald-400 flex items-center gap-1.5 hover:underline mb-2.5 cursor-pointer uppercase tracking-wider"
                >
                  &larr; {lang === "en" ? "Back to store" : "Retour au magasin"}
                </button>
                <h1 className="font-sans text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {lang === 'en' ? "Atelier Design Collection" : lang === 'es' ? "Colección de Diseño" : lang === 'ar' ? "مجموعة المصمم الكاملة" : "La Collection Complète d'Atelier"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pb-1">
                  {lang === 'en' ? "Browse through our full horizontal double-frame lineup." : "Visualisez et commandez l'intégralité de notre catalogue artistique sous forme de cadres horizontaux doubles."}
                </p>
              </div>
            </div>

            {/* Render 2-card horizontal lineup */}
            <Pricing 
              products={products} 
              onAddToCart={handleAddToCart} 
              lang={lang} 
              currency={currency} 
              layoutMode="collection" 
              categories={categories}
            />
          </motion.div>
        ) : (
          /* USER STOREFRONT VIEW */
          <>
            {/* HERO COMBINED WITH SPOTLIGHT */}
            <section id="store-hero" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 md:pt-6">
              
              {/* Left Column Description */}
              <div className="lg:col-span-6 text-left space-y-6 md:space-y-8">
                
                {/* Launch badge indicator */}
                <div className="inline-flex items-center gap-2 bg-[#f4f8f3] dark:bg-slate-900 border border-[#e2eae0] dark:border-slate-800 rounded-full px-3.5 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#2d4a22] dark:text-emerald-400">
                    {t.heroTag}
                  </span>
                </div>

                {/* Elegant Headline exactly matching user request style */}
                <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
                  {siteConfig?.heroTitle || t.heroTitle}<br />
                  <span className="font-serif italic font-normal text-[#2d4a22] dark:text-emerald-450">{siteConfig?.heroSub || t.heroSub}</span>
                </h1>

                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                  {siteConfig?.heroDesc || t.heroDesc}
                </p>

                {/* Main Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <button 
                    type="button"
                    onClick={() => handleScrollToId("pricing-plans")}
                    className="bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-[10px] uppercase tracking-widest px-7 py-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 select-none"
                  >
                    {t.heroViewCollection}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleScrollToId("interactive-model-sandbox")}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-widest px-7 py-4 rounded-xl transition-all cursor-pointer text-center select-none"
                  >
                    {t.heroStartAtelier}
                  </button>
                </div>

                <div className="flex items-center gap-5 pt-2 border-t border-slate-150 dark:border-slate-800">
                  <div className="text-left font-sans">
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">4.9/5</div>
                    <div className="text-[9px] font-mono font-extrabold uppercase tracking-wide text-slate-400">
                      {lang === 'en' ? "Atelier Ratings" : lang === 'es' ? "Notas del Taller" : lang === 'ar' ? "تقييم المشغل" : "Notes d'Ateliers"}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                  <div className="text-left font-sans">
                    <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">100%</div>
                    <div className="text-[9px] font-mono font-extrabold uppercase tracking-wide text-slate-400">
                      {lang === 'en' ? "FSC Joinery" : lang === 'es' ? "Especialismo FSC" : lang === 'ar' ? "نجارة فاخرة FSC" : "Ébénisterie FSC"}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                  <div className="text-left">
                    <div className="text-lg font-mono font-bold text-[#2d4a22] dark:text-emerald-450">WELCOME10</div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-[#2d4a22] dark:text-emerald-450">
                      {lang === 'en' ? "Code -10% Active" : lang === 'es' ? "Código -10% Activo" : lang === 'ar' ? "خصم ترويجي نشط -10%" : "Code -10% Active"}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Spotlight Detailed Customizer Card */}
              <div className="lg:col-span-6">
                {spotlightProduct ? (
                  <div className="bg-[#fcfdfb] dark:bg-slate-900 border border-[#e6eee3] dark:border-slate-800 rounded-[2rem] p-6 lg:p-7 space-y-5 text-left sleek-shadow-md relative overflow-hidden">
                    
                    {/* Background Soft Studio shadow glow */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#2d4a22]/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Spotlight header */}
                    <div className="flex items-center justify-between border-b border-[#e6eee3] dark:border-slate-800 pb-3 z-10 relative">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-[#2d4a22] dark:text-[#84a98c] uppercase tracking-widest">
                          {lang === 'en' ? "Featured Today" : lang === 'es' ? "En Destacado Hoy" : lang === 'ar' ? "تصميم متميز للارتداء" : "En Vedette aujourd'hui"}
                        </span>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">{spotlightProduct.name}</h2>
                      </div>
                      <span className="bg-[#fcf5eb] dark:bg-slate-850 text-[#b45309] dark:text-amber-450 text-[9px] font-mono font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                        {lang === 'en' ? "Catalog Masterpiece" : lang === 'es' ? "Obra maestra" : lang === 'ar' ? "تحفة فنية فريدة" : "Chef d'œuvre du catalogue"}
                      </span>
                    </div>

                    {/* Image visual slider */}
                    <div className="h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 relative group/hero">
                      <img 
                        src={spotlightProduct.image} 
                        alt={spotlightProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/hero:scale-105" 
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-3 text-xs text-white font-mono font-semibold">
                        {lang === 'en' ? "Designer Edition • Polished Brass legs" : lang === 'es' ? "Diseño Premium • Patas Doradas" : lang === 'ar' ? "تصميم فاخر • كراسي منسقة ذهبية" : "Designer edition • Pieds Laiton poli"}
                      </div>
                    </div>

                    {/* Quick custom options */}
                    <div className="space-y-3 pt-1 text-left">
                      
                      {/* Interactive colors swatches */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-slate-400">
                          {lang === 'en' ? "Shades:" : lang === 'es' ? "Tonos:" : lang === 'ar' ? "درجات الألوان :" : "Nuancier :"} <strong className="text-slate-700 dark:text-slate-205 font-sans font-medium">{spotlightProduct.colors[spotlightColorIdx]?.name}</strong>
                        </span>
                        
                        <div className="flex gap-2">
                          {spotlightProduct.colors.map((col, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSpotlightColorIdx(idx)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                spotlightColorIdx === idx
                                  ? "border-[#2d4a22] ring-2 ring-[#e6eee3] scale-105"
                                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                              }`}
                              title={col.name}
                            >
                              <span className="w-3 h-3 rounded-full block border border-black/10" style={{ backgroundColor: col.hex }}></span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity stepping matches Image mockup precisely */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-slate-400">
                          {lang === 'en' ? "Select Quantity" : lang === 'es' ? "Cantidad" : lang === 'ar' ? "تحديد كمية الطلب" : "Sélectionner quantité"}
                        </span>
                        
                        <div className="flex items-center bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => setSpotlightQty(Math.max(1, spotlightQty - 1))}
                            className="p-1 text-[#2d4a22] hover:text-[#1a2d15] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          
                          <span className="font-mono text-xs font-bold px-3 text-slate-805 dark:text-slate-100">
                            {spotlightQty}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => setSpotlightQty(spotlightQty + 1)}
                            className="p-1 text-[#2d4a22] hover:text-[#1a2d15] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Direct Buy button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 text-left">
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">{lang === 'en' ? "Subtotal" : lang === 'es' ? "Total" : lang === 'ar' ? "الإجمالي" : "Total"}</span>
                        <span className="text-xl font-mono font-bold text-slate-900 dark:text-white leading-none">
                          {formatPrice(spotlightProduct.price * spotlightQty, currency)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSpotlightAddToCart}
                        className={`flex-1 py-3 px-6 rounded-xl text-xs uppercase tracking-widest font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          spotlightAdded
                            ? "bg-emerald-600 text-white animate-scaleUp"
                            : "bg-[#2d4a22] hover:bg-[#1a2d15] text-white shadow-sm"
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {spotlightAdded ? t.addedTitle : lang === 'en' ? "Instant Buy" : lang === 'es' ? "Comprar Ahora" : lang === 'ar' ? "شراء فوري" : "Acheter"}
                      </button>
                    </div>

                  </div>
                ) : null}
              </div>

            </section>

            {/* PRODUCT CATALOG FEED */}
            <section className="space-y-6 pt-4 border-t border-slate-50 dark:border-slate-805">
              <div className="text-left space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22] dark:text-emerald-450">
                  {lang === 'en' ? "Atelier Catalog" : lang === 'es' ? "Catálogo Boutique" : lang === 'ar' ? "كتالوج الورشة" : "Catalogue Magasin"}
                </span>
                <h2 className="font-sans text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {lang === 'en' ? "Master Seating Pieces" : lang === 'es' ? "El Mobiliario de Autor" : lang === 'ar' ? "أثاث ومقاعد المشغل" : "Le Mobilier d'Atelier"}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed font-sans">
                  {lang === 'en' ? "Explore our exclusive handcrafted high-end premium seats, individually sculpted and guaranteed for life." : lang === 'es' ? "Nuestros asientos exclusivos están hechos a medida con materiales de calidad." : lang === 'ar' ? "تصفح إبداعاتنا الحصرية للمقاعد والأثاث الفاخر المصنوع يدوياً قطعة بقطعة مع ضمان طويل المدى." : "Parcourez nos créations exclusives de mobilier haut de gamme, fabriquées à la pièce et garanties à vie."}
                </p>
              </div>

              {/* Grid with category filters and instant Search */}
              <Pricing 
                products={products.length > 5 ? products.slice(0, 5) : products} 
                onAddToCart={handleAddToCart} 
                lang={lang} 
                currency={currency} 
                categories={categories}
              />

              {products.length > 5 && (
                <div className="flex justify-center pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("collection");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-[#fcfdfc] hover:bg-[#2d4a22] text-[#2d4a22] hover:text-white dark:bg-slate-900 dark:hover:bg-[#2d4a22] dark:border-slate-800 border border-[#2d4a22] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
                  >
                    <span>{lang === "en" ? "See complete collection" : lang === "es" ? "Ver colección completa" : lang === "ar" ? "مشاهدة المجموعة الكاملة" : "Voir plus d'articles &rarr;"}</span>
                  </button>
                </div>
              )}
            </section>

            {/* INDIVIDUALIZED CUSTOMIZER ATELIER */}
            <section className="space-y-6 pt-6">
              <div className="text-left space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22] dark:text-emerald-450">
                  {lang === 'en' ? "Bespoke Manufacturing" : lang === 'es' ? "Hecho a Medida" : lang === 'ar' ? "صناعة وتفصيل يدوي" : "Manufacture sur-mesure"}
                </span>
                <h2 className="font-sans text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {lang === 'en' ? "Orris Configurator" : lang === 'es' ? "Modelador Orris" : lang === 'ar' ? "موجّه التخصيص لمنفاذ أوريس" : "Le Simulateur Orris"}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium font-sans">
                  {lang === 'en' ? "Select your eco-certified raw materials, add footrests or lumbar support cushions, and see your customized creation update instantly." : lang === 'es' ? "Diseñe su propia configuración y verifique la simulación en tempo real." : lang === 'ar' ? "اختر المواد الصديقة للبيئة، أضف مسامير القدم أو وسائد الأمان لراحتك وتحقق من النتيجة حياً." : "Incrustez vos matières premières éco-certifiées, ajoutez des ottomanes ou des coussins et validez votre configuration unique en direct."}
                </p>
              </div>

              {/* Chair Customizer */}
              <InteractiveModel 
                products={products} 
                onAddToCart={handleAddToCart} 
                lang={lang} 
                currency={currency} 
                customOptions={customOptions}
                currentUser={user}
              />
            </section>

            {/* REVIEWS TESTIMONIALS CAROUSEL */}
            <ReviewsCarousel lang={lang} currentUser={user} />

            {/* FREQUENTLY ASKED QUESTIONS SECTION */}
            <section id="faqs-anchor" className="space-y-6">
              <div className="text-left space-y-2 max-w-xl">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22] dark:text-emerald-450">
                  {lang === 'en' ? "Assistance Center" : lang === 'es' ? "Centro de Soporte" : lang === 'ar' ? "الدعم الفني واللوجستي" : "Assistance"}
                </span>
                <h2 className="font-sans text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.faqTitle}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed font-sans">
                  {lang === 'en' ? "Want to know more about shipping of large wooden crates, our eco-friendly craftsmanship, or showroom booking? Read our answers below." : lang === 'es' ? "¿Desea saber más sobre los envíos, nuestro showroom o garantía? Consulte respuestas rápidas." : lang === 'ar' ? "هل تود معرفة المزيد عن تسليم القطع الضخمة، نجارتنا الصديقة للبيئة أو المعرض؟ يرجى قراءة التفاصيل في الأسفل." : "Vous souhaitez en savoir plus sur l'expédition de pièces imposantes, notre ébénisterie éco-responsable ou l'essai en showroom ? Retrouvez nos réponses claires ci-dessous."}
                </p>
              </div>

              {/* Accordion list */}
              <FAQ lang={lang} customFaqs={siteConfig?.faqs || siteConfig?.faq} />
            </section>
          </>
        )}

      </main>

      {/* FOOTER COOPERATIVE PANEL */}
      <footer className="bg-slate-50 dark:bg-slate-900/40 border-t border-[#e6eee3] dark:border-slate-800 py-12 md:py-16 mt-20 select-none text-left">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-sans text-slate-500 dark:text-slate-400">
          
          <div className="space-y-3">
            <h4 className="font-sans font-black text-sm tracking-tight text-slate-950 dark:text-white flex items-center gap-1.5 justify-start">
              nexus<span className="w-2.5 h-2.5 rounded-full bg-[#2d4a22] inline-block"></span>
            </h4>
            <p className="leading-relaxed font-medium">
              {siteConfig?.footerAbout || (lang === 'en' ? "Artistic carpentry atelier and manufacturer of premium ergonomic comfort seating. All materials originate from state-certified sustainable forests with Retro-Scandinavian design." : lang === 'es' ? "Taller de carpintería artesanal de gran confort inspirado en corrientes nórdicas." : lang === 'ar' ? "ورشة نجارة فنية عالية الجودة لتصنيع المقاعد الوظيفية المريحة. جميع موادنا مستخلصة من غابات مستدامة." : "Atelier d'ébénisterie d'art et de confection d'assises ergonomiques de grand confort. Nos matières premières proviennent de forêts certifiées à gestion durable. Cabinet d'inspiration rétro-scandinave.")}
            </p>
            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-400">
              {lang === 'en' ? "Classic Retro-Scandinavian inspired studio." : lang === 'es' ? "Estilo nórdico retro-escandinavo." : lang === 'ar' ? "ستوديو معاصر مستوحى من الذوق الاسكندنافي القديم." : "Cabinet d'inspiration rétro-scandinave."}
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-800 dark:text-slate-350">
              {lang === 'en' ? "Support & Logistics" : lang === 'es' ? "Soporte de Envíos" : lang === 'ar' ? "الدعم الفني والتسليم" : "Support & Livraison"}
            </h4>
            <p className="leading-relaxed font-medium">
              {siteConfig?.footerContact || (lang === 'en' ? "Secure global express shipping in customized reinforced double-wall wooden cases. Warm responsive support via email within 24h." : lang === 'es' ? "Entrega nacional asegurada en embalajes reforzados. Soporte rápido vía correo electrónico." : lang === 'ar' ? "توصيل وتسليم آمن ومضمون في طروض خشبية معززة خصيصاً لمقعدك. خدمة عملاء دافئة وسريعة." : "Livraison nationale sécurisée dans des emballages renforcés sur-mesure. Service client réactif et chaleureux par mail sous 24h.")}
            </p>
            <div className="text-[#2d4a22] dark:text-[#84a98c] font-bold">
              E-mail : contact@nexus-atelier.fr
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-800 dark:text-slate-350">
              {lang === 'en' ? "Manufacturing Warranties" : lang === 'es' ? "Garantía de Fábrica" : lang === 'ar' ? "ضمانات التصنيع الممتازة" : "Garanties de Fabrication"}
            </h4>
            <p className="leading-relaxed font-medium">
              {siteConfig?.footerWarranty || (lang === 'en' ? "Every piece bought online includes a 5-year constructor warranty coverage on foam resilience along with direct workspace support." : lang === 'es' ? "Toda compra incluye cobertura de 5 años contra affaissement estructural." : lang === 'ar' ? "تستفيد جميع المنتجات المشترات إلكترونياً من تأمين وحماية ضد الأعطال الهيكلية لمدة 5 سنوات." : "Toutes les pièces commandées en ligne bénéficient d'une assurance contre les déformations de mousse de 5 ans et d'une assistance directe par chat d'atelier.")}
            </p>
            <div className="text-slate-400 dark:text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} nexus. All Rights Reserved.
            </div>
          </div>

        </div>
      </footer>

      {/* SHOPPING CART SIDEPANEL DRAWER */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden text-left font-sans">
            {/* Overlay backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 bg-black/60 cursor-pointer text-left"
            />

            {/* Drawer side panel */}
            <div className={`absolute inset-y-0 ${isRTL ? 'left-0' : 'right-0'} max-w-full flex ${isRTL ? 'pr-10' : 'pl-10'} text-left`}>
              <motion.div 
                initial={{ x: isRTL ? "-100%" : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "-100%" : "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#e6eee3] dark:border-slate-800 flex items-center justify-between bg-[#f4f8f3] dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#2d4a22]" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{t.cartTitle}</h3>
                    <span className="text-[10px] bg-[#2d4a22]/10 dark:bg-[#2d4a22]/35 text-[#2d4a22] dark:text-[#84a98c] font-bold px-2 py-0.5 rounded font-mono">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} {t.itemsLabel}
                    </span>
                  </div>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Body - Conditional view */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {checkoutStep === "confirm" ? (
                    /* Order placed Screen Success */
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-8 space-y-5"
                    >
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-900/60">
                        <Check className="w-8 h-8 stroke-[2.5]" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-[#2d4a22] dark:text-emerald-450 uppercase tracking-wider">{t.orderCompleted}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.orderConfirmedMsg}</p>
                      </div>

                      <div className="bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 p-4 rounded-xl text-left space-y-2.5">
                        <div className="flex justify-between items-center border-b border-[#e2eae0] dark:border-slate-800 pb-2 text-[11px] font-mono">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">{t.trackingNumber} :</span>
                          <span className="text-[#2d4a22] dark:text-emerald-400 font-black underline">{orderTracking}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-650 dark:text-slate-350 font-medium font-sans">
                          <p>&bull; {lang === 'en' ? "Recipient:" : lang === 'es' ? "Destinatario:" : lang === 'ar' ? "المستلم :" : "Destinataire :"} <strong className="text-slate-900 dark:text-white">{shippingAddress.fullName}</strong></p>
                          <p>&bull; {lang === 'en' ? "Shipping Details:" : lang === 'es' ? "Envío:" : lang === 'ar' ? "عنوان التوصيل :" : "Adresse de livraison :"} <strong className="text-slate-800 dark:text-slate-200">{shippingAddress.address}, {shippingAddress.city}</strong></p>
                          <p>&bull; {lang === 'en' ? "Logistic Option:" : lang === 'es' ? "Logística:" : lang === 'ar' ? "خيار التوصيل :" : "Option Logistique :"} <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Specialized Furniture Carrier" : lang === 'es' ? "Soporte de mobiliario especial" : lang === 'ar' ? "نقل وتوصيل أثاث فاخر مخصص" : "Transporteur Spécialisé Mobilier"}</strong></p>
                        </div>
                      </div>

                      <button
                        onClick={handleFinishCheckout}
                        className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer shadow-sm transition-colors"
                      >
                        {t.continueShoppingBtn}
                      </button>
                    </motion.div>
                  ) : checkoutStep === "form" ? (
                    /* Shipping Form Screen */
                    <form id="checkout-shipping-form" onSubmit={handleSubmitCheckout} className="space-y-4 text-left">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <button 
                          type="button" 
                          onClick={() => setCheckoutStep("idle")} 
                          className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline cursor-pointer"
                        >
                          &larr; {lang === 'en' ? "Back to Cart" : lang === 'es' ? "Volver" : lang === 'ar' ? "العودة للسلة" : "Retour au panier"}
                        </button>
                        <span className="text-xs text-slate-350">/</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.shippingAddress}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 dark:text-white font-sans uppercase">{t.checkoutFormTitle}</h3>

                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.fullName} *</label>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'en' ? "e.g. John Doe" : "ex : Alexandre Martin"}
                            value={shippingAddress.fullName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-150 outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.shippingAddress} *</label>
                          <input
                            type="text"
                            required
                            placeholder="12 rue de la Paix"
                            value={shippingAddress.address}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-150 outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.zipCode} *</label>
                            <input
                              type="text"
                              required
                              placeholder="75001"
                              value={shippingAddress.zip}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-150 outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.city} *</label>
                            <input
                              type="text"
                              required
                              placeholder="Paris"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-150 outline-none"
                            />
                          </div>
                        </div>

                        {/* Interactive contact details block requested by user */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#2d4a22] dark:text-emerald-450">Tél de contact (Pour livraison) *</label>
                            <input
                              type="tel"
                              required
                              placeholder="ex : +221 77 000 00 00"
                              value={shippingAddress.phone}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pb-1 focus:border-[#2d4a22] rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-150 outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#2d4a22] dark:text-emerald-450">Email de contact *</label>
                            <input
                              type="email"
                              required
                              placeholder="nom@exemple.com"
                              value={shippingAddress.email}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pb-1 focus:border-[#2d4a22] rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-150 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            {lang === 'en' ? "Secure Payment (Simulated demo)" : lang === 'es' ? "Detalles del pago seguro (simulación)" : lang === 'ar' ? "بيانات الدفع الإلكتروني الآمن (نموذج محاكاة)" : "Données Bancaires (Simulé de démos)"}
                          </label>
                          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            <input
                              type="text"
                              disabled
                              value={shippingAddress.cardNumber}
                              className="col-span-2 bg-transparent text-xs text-slate-500 dark:text-slate-300 outline-none pl-1"
                            />
                            <div className="text-right text-xs font-mono font-semibold text-slate-400 pr-1 select-none">
                              CVV {shippingAddress.cvv}
                            </div>
                          </div>
                        </div>
                      </div>

                    </form>
                  ) : cart.length === 0 ? (
                    /* Empty Cart */
                    <div className="text-center py-16 space-y-4">
                      <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.emptyCart}</p>
                      <button 
                        onClick={() => setCartOpen(false)}
                        className="text-xs text-[#2d4a22] dark:text-emerald-400 font-semibold underline hover:text-[#1a2d15]"
                      >
                        {t.continueShoppingBtn} &rarr;
                      </button>
                    </div>
                  ) : (
                    /* Display list of added products */
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-3 rounded-xl bg-[#fbfdfa] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 gap-3 text-left"
                        >
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.product.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {item.selectedColor.name} {item.selectedVariant ? `• ${item.selectedVariant}` : ""}
                            </p>
                            <p className="text-[10px] text-[#2d4a22] dark:text-emerald-450 font-bold font-mono">
                              {formatPrice(item.product.price, currency)}
                            </p>
                          </div>

                          {/* Stepper qty controls */}
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center border border-slate-250 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 text-xs scale-90">
                              <button 
                                onClick={() => updateCartQuantity(idx, -1)}
                                className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold px-2 text-slate-800 dark:text-slate-100">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(idx, 1)}
                                className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeCartItem(idx)}
                              className="text-slate-455 hover:text-rose-500 text-[9px] font-mono flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> {lang === 'en' ? "Remove" : "Retirer"}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Promo Code section */}
                      <form onSubmit={handleApplyPromo} className="pt-4 border-t border-[#e6eee3] dark:border-slate-800 space-y-2 text-left">
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{lang === 'en' ? "Promo Coupon Code" : "Ajouter un code de réduction"}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ex : WELCOME10"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:border-[#2d4a22] rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none"
                          />
                          <button
                            type="submit"
                            className="bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-[10px] uppercase font-bold tracking-wider px-4 rounded-lg cursor-pointer"
                          >
                            {lang === 'en' ? "Apply" : "Appliquer"}
                          </button>
                        </div>
                        {appliedCodeName && (
                          <p className="text-[10px] text-emerald-600 font-bold">{t.promoApplied} : {appliedCodeName}</p>
                        )}
                        {promoError && (
                          <p className="text-[10px] text-rose-600 font-bold">{promoError}</p>
                        )}
                      </form>
                    </div>
                  )}

                </div>

                {/* Footer Drawer - Billing calculation if not confirmation */}
                {checkoutStep !== "confirm" && cart.length > 0 && (
                  <div className="p-6 border-t border-[#e6eee3] dark:border-slate-800 bg-[#fbfdfa] dark:bg-slate-950 space-y-4">
                    <div className="space-y-1.5 text-xs text-slate-650 dark:text-slate-300 font-medium font-sans">
                      <div className="flex justify-between">
                        <span>{t.cartSubtotal} :</span>
                        <span className="font-mono text-slate-800 dark:text-slate-105 font-bold">{formatPrice(subtotal, currency)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-650">
                          <span>{t.promoApplied} ({activeDiscount}%) :</span>
                          <span className="font-mono font-bold">- {formatPrice(discountAmount, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{t.shipping} :</span>
                        <span className="font-mono text-slate-800 dark:text-slate-105 font-bold">
                          {formatPrice(shippingCharge, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 dark:text-slate-400 text-[10px] italic">
                        <span>{lang === 'en' ? "Fixed standard shipping charge." : "Frais d'expédition forfaitaires fixes de 2000 unités."}</span>
                      </div>
                      <div className="h-px bg-[#e6eee3] dark:bg-slate-800 my-2"></div>
                      <div className="flex justify-between text-[#2d4a22] dark:text-emerald-450 text-sm font-black uppercase">
                        <span>{t.cartTotal} :</span>
                        <span className="font-mono font-bold">{formatPrice(grandTotal, currency)}</span>
                      </div>
                    </div>

                    {checkoutStep === "idle" && (
                      <button
                        onClick={handleLaunchCheckout}
                        className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer shadow-sm transition-all text-center flex items-center justify-center gap-2 select-none"
                      >
                        {t.checkoutBtn}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {checkoutStep === "form" && (
                      <button
                        type="submit"
                        form="checkout-shipping-form"
                        className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer shadow-sm transition-all text-center flex items-center justify-center gap-2 select-none"
                      >
                        {t.paySubmit} ({formatPrice(grandTotal, currency)})
                      </button>
                    )}
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* User Centered Modal Windows (Minimalist pop-up containing user information & purchases list) */}
      <AnimatePresence>
        {userDropdownOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserDropdownOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 border border-[#e6eee3] dark:border-slate-800 rounded-[2rem] shadow-2xl p-6 md:p-8 max-w-lg w-full z-10 text-left space-y-6 max-h-[90vh] overflow-y-auto select-text"
            >
              {/* Profile Card Header section */}
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full border-2 border-[#2d4a22] dark:border-[#84a98c] shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#2d4a22]/10 dark:bg-[#2d4a22]/20 text-[#2d4a22] dark:text-[#84a98c] rounded-full flex items-center justify-center border-2 border-[#2d4a22] shadow-inner text-xl font-bold uppercase flex-shrink-0">
                    {user.displayName ? user.displayName.slice(0, 2) : "NX"}
                  </div>
                )}
                
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono tracking-widest text-[#2d4a22] dark:text-emerald-450 uppercase font-extrabold bg-[#2d4a22]/10 dark:bg-[#2d4a22]/30 px-2 py-0.5 rounded-full">
                    {user.email === "grasdvirus@gmail.com" ? t.userRoleAdmin : t.userRoleClient}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mt-1">
                    {user.displayName || "Client nexus."}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(false)}
                  className="p-1 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 text-sm font-bold rounded-lg cursor-pointer transition-all self-start"
                >
                  &times;
                </button>
              </div>

              {/* Past Receipts and Purchases list */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#2d4a22]" /> 
                  {t.myPurchases} ({myOrders.length})
                </h5>
                
                <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1.5 text-left">
                  {myOrders.map((ord: any) => (
                    <div key={ord.id} className="bg-slate-50/50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-[#e6eee3] dark:border-slate-850 text-xs">
                      <div className="flex justify-between font-mono font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{t.orderCode} : {ord.id}</span>
                        <span className="text-[#2d4a22] dark:text-emerald-450 font-black">{formatPrice(ord.total, currency)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 pb-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                        <span>{t.deliveredTo} {ord.city}</span>
                        <span>{ord.items?.length || 1} {t.itemsLabel}</span>
                      </div>
                      {/* Nested ordered items listing */}
                      <div className="mt-2 space-y-1">
                        {ord.items?.map((it: any, k: number) => (
                          <div key={k} className="flex justify-between text-[10px] text-slate-400 dark:text-slate-400 italic font-medium font-sans">
                            <span>&bull; {it.quantity}x {it.name} ({it.selectedColor?.name || ""})</span>
                            <span className="font-mono">{formatPrice(it.price, currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {myOrders.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-950/10">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-sans">{t.noOrdersYet}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client write feedback action */}
              <div className="bg-[#2d4a22]/5 dark:bg-[#2d4a22]/10 p-4 border border-[#cadac4] dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h6 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    Laisser un avis
                  </h6>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Exprimez votre avis sur l'Atelier pour qu'il s'affiche sur notre site !</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReviewName(user?.displayName || "");
                    setReviewRating(5);
                    setReviewComment("");
                    setReviewNotif("");
                    setUserDropdownOpen(false);
                    setReviewFormOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer flex-shrink-0"
                >
                  Rédiger
                </button>
              </div>

              {/* Secure restoration option for grasdvirus@gmail.com */}
              {user.email === "grasdvirus@gmail.com" && (
                <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/30 space-y-2">
                  <p className="text-[9px] font-mono tracking-wider font-extrabold text-indigo-700 dark:text-indigo-400 uppercase">Option exclusive d'administration</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleSeedDatabase();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full bg-[#1e1b4b] hover:bg-indigo-900 text-white font-mono uppercase font-bold py-2.5 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    {t.restoreCatalogBtn}
                  </button>
                </div>
              )}

              {/* Large logout action */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-650 dark:text-slate-300 dark:hover:text-rose-450 border border-slate-200 dark:border-slate-750 hover:border-rose-100 dark:hover:border-rose-900 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {t.signOut}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS DIALOG MODAL */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 border border-[#e6eee3] dark:border-slate-850 rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full z-10 text-left space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#2d4a22] dark:text-emerald-450" />
                  {t.settingsTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="font-sans text-xl font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {/* Language selection tab */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {t.langLabel}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["fr", "en", "es", "ar"] as Language[]).map((la) => (
                      <button
                        key={la}
                        type="button"
                        onClick={() => setLang(la)}
                        className={`py-2 px-1 text-center font-extrabold text-xs rounded-xl border transition-all cursor-pointer ${
                          lang === la
                            ? "bg-[#2d4a22] text-white border-[#2d4a22]"
                            : "bg-stone-50/50 dark:bg-slate-950 border-[#e2eae0] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {la === "fr" ? "FR" : la === "en" ? "EN" : la === "es" ? "ES" : "AR"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme switching buttons */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {t.themeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme("white")}
                      className={`py-2 px-3 text-center font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        theme === "white"
                          ? "bg-[#2d4a22] text-white border-[#2d4a22]"
                          : "bg-stone-50/50 dark:bg-slate-950 border-[#e2eae0] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 block"></span>
                      {t.lightTheme}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("black")}
                      className={`py-2 px-3 text-center font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        theme === "black"
                          ? "bg-[#2d4a22] text-white border-[#2d4a22]"
                          : "bg-stone-50/50 dark:bg-slate-950 border-[#e2eae0] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-750 block"></span>
                      {t.darkTheme}
                    </button>
                  </div>
                </div>

                {/* Currency select tabs */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {t.currencyLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["EUR", "USD", "CFA"] as Currency[]).map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        className={`py-2 px-1 text-center font-extrabold text-xs rounded-xl border transition-all cursor-pointer ${
                          currency === cur
                            ? "bg-[#2d4a22] text-white border-[#2d4a22]"
                            : "bg-stone-50/50 dark:bg-slate-950 border-[#e2eae0] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {cur === "EUR" ? "EUR (€)" : cur === "USD" ? "USD ($)" : "CFA (FCFA)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs uppercase font-extrabold tracking-widest py-3.5 rounded-xl cursor-pointer shadow-sm transition-all text-center block"
              >
                {t.closeBtn}
              </button>
            </motion.div>
          </div>
        )}

        {/* CUSTOM REVIEW WRITING MODAL OVERLAY */}
        {reviewFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewFormOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 border border-[#e6eee3] dark:border-slate-800 rounded-[2rem] shadow-2xl p-6 md:p-8 max-w-md w-full z-10 text-left space-y-5 max-h-[90vh] overflow-y-auto select-text"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <h3 className="font-sans font-black text-slate-900 dark:text-white text-base">
                    Publier un avis client
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewFormOpen(false)}
                  className="p-1 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 text-sm font-bold rounded-lg cursor-pointer transition-all"
                >
                  &times;
                </button>
              </div>

              {/* Form body */}
              <div className="space-y-4">
                
                {reviewNotif && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    reviewNotif.includes("Succès") || reviewNotif.includes("Merci")
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100/30"
                      : "bg-rose-50 dark:bg-rose-955/20 text-rose-800 dark:text-rose-400 border border-rose-100/30"
                  }`}>
                    {reviewNotif}
                  </div>
                )}

                {/* Rating selection stars */}
                <div className="space-y-1.5 text-center py-2 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Évaluation ({reviewRating} / 5)</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star className={`w-6 h-6 ${s <= reviewRating ? "text-amber-500 fill-amber-400" : "text-slate-200 fill-slate-100 dark:text-slate-800 dark:fill-slate-850"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Votre Nom d'affichage</label>
                  <input
                    type="text"
                    placeholder="ex : Alexandre D."
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 dark:bg-slate-955 dark:border-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#2d4a22] focus:bg-white transition-colors"
                  />
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Votre Commentaire</label>
                  <textarea
                    rows={4}
                    placeholder="Partagez vos impressions sur la finition, l'ergonomie, la splendeur du bois d'art..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 dark:bg-slate-955 dark:border-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#2d4a22] focus:bg-white transition-colors resize-none"
                  />
                  <p className="text-[10px] text-slate-400 italic">Minimum 5 caractères.</p>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={reviewSubmitting}
                  onClick={async () => {
                    const trimmedName = reviewName.trim();
                    const trimmedComment = reviewComment.trim();
                    if (!trimmedComment || trimmedComment.length < 5) {
                      setReviewNotif("Le commentaire doit faire au moins 5 caractères.");
                      return;
                    }

                    try {
                      setReviewSubmitting(true);
                      setReviewNotif("");

                      const docId = `rev-${Date.now()}`;
                      await addDoc(collection(db, "reviews"), {
                        id: docId,
                        userName: trimmedName || "Client nexus.",
                        userId: user?.uid || "anonymous",
                        userAvatar: user?.photoURL || "",
                        rating: reviewRating,
                        comment: trimmedComment,
                        createdAt: serverTimestamp(),
                      });

                      setReviewNotif("Succès ! Merci infiniment pour votre avis, il est maintenant publié sur le site.");
                      setReviewComment("");
                      
                      setTimeout(() => {
                        setReviewFormOpen(false);
                      }, 2500);

                    } catch (e: any) {
                      console.error("Failed to commit user review to Firestore:", e);
                      setReviewNotif("Échec de la publication de l'avis.");
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                  className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-[#ffffff] text-xs uppercase font-extrabold tracking-widest py-3.5 rounded-xl cursor-pointer shadow-sm transition-all text-center flex items-center justify-center gap-2"
                >
                  {reviewSubmitting ? "Publication..." : "Publier l'avis"}
                </button>

              </div>
            </motion.div>
          </div>
        )}

        {/* BACK TO TOP SCROLL BUTTON */}
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-40 p-3 bg-[#2d4a22] hover:bg-[#1a2d15] text-[#ffffff] rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer border border-[#84a98c]/30"
            title="Remonter en haut"
            id="back-to-top-btn"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </AnimatePresence>

    </div>
  );
}
