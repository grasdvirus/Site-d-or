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
  Star,
  Truck,
  Award,
  Phone,
  PhoneCall,
  MessageSquare,
  CreditCard,
  Clipboard,
  Loader2
} from "lucide-react";

import InteractiveModel from "./components/InteractiveModel";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import AdminPortal from "./components/AdminPortal";
import ReviewsCarousel from "./components/ReviewsCarousel";
import AssistiveTouchWidget from "./components/AssistiveTouchWidget";
import { SmartMedia } from "./components/SmartMedia";
import { ProductMediaGallery } from "./components/ProductMediaGallery";
import { INITIAL_PRODUCTS, generateAffiliateCode } from "./data";
import { Product, CartItem, PromoCode } from "./types";
import { db, auth, googleProvider, signInWithPopup, signOut, handleFirestoreError, GoogleAuthProvider, OperationType } from "./firebase";
import { collection, query, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp, where, addDoc, onSnapshot } from "firebase/firestore";
import { TRANSLATIONS, Language, Theme, Currency, formatPrice, formatOrderTotal, formatBespokePrice, CURRENCIES } from "./translations";
import { triggerOrderCelebration } from "./utils/confetti";


export default function App() {
  const [activeTab, setActiveTab] = useState<"store" | "admin" | "collection" | "search">("store");
  
  const [siteConfig, setSiteConfig] = useState<{
    id?: string;
    footerAbout?: string;
    footerContact?: string;
    footerWarranty?: string;
    heroTitle?: string;
    heroSub?: string;
    heroDesc?: string;
    faqs?: { question: string; answer: string }[];
    faq?: { question: string; answer: string }[];
    waveNumbers?: string;
    orangeNumber?: string;
    mtnNumber?: string;
    visaWhatsAppNumber?: string;
    btnCta1Text?: string;
    btnCta1TextEn?: string;
    btnCta1Target?: string;
    btnCta1Style?: string;
    btnCta1Active?: boolean;
    btnCta2Text?: string;
    btnCta2TextEn?: string;
    btnCta2Target?: string;
    btnCta2Style?: string;
    btnCta2Active?: boolean;
    btnCta3Text?: string;
    btnCta3TextEn?: string;
    btnCta3Active?: boolean;
    btnCta4Text?: string;
    btnCta4TextEn?: string;
    btnCta4Active?: boolean;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("site_config_general");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {}
    return null;
  });
  
  // Auth & UI States
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myBespokeRequests, setMyBespokeRequests] = useState<any[]>([]);
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
  const [categories, setCategories] = useState<string[]>([]);
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

  // Products state - initialized strictly empty or from local storage cache excluding sample items
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("sitedor_products_cache");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((p: any) => p && p.id && !["orris-chair", "elvo-chair", "sienna-lounge", "mollis-accent", "kivi-cozy", "pohb-sacs-rangement"].includes(p.id));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {
      console.warn("Error loading cached products:", e);
    }
    return [];
  });

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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

  // Animated Cart Toast & Icon Bump States
  const [cartToast, setCartToast] = useState<{
    id: string;
    productName: string;
    productImage?: string;
    price?: number;
    colorName?: string;
    quantity: number;
  } | null>(null);
  const [cartBump, setCartBump] = useState(false);

  const triggerCartToast = (
    productName: string,
    productImage?: string,
    price?: number,
    colorName?: string,
    quantity: number = 1
  ) => {
    setCartToast({
      id: Date.now().toString(),
      productName,
      productImage,
      price,
      colorName,
      quantity
    });
    setCartBump(true);
    setTimeout(() => setCartBump(false), 800);
  };

  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => {
      setCartToast(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [cartToast]);

  // Affiliate Code Search & Special Product View states
  const [isCodeSearchModalOpen, setIsCodeSearchModalOpen] = useState(false);
  const [affiliateSearchCode, setAffiliateSearchCode] = useState("");
  const [searchCodeError, setSearchCodeError] = useState("");
  const [selectedAffiliateProduct, setSelectedAffiliateProduct] = useState<Product | null>(null);
  const [isSpecializedSearchPage, setIsSpecializedSearchPage] = useState(false);
  const [affiliateProductQty, setAffiliateProductQty] = useState(1);
  const [affiliateSelectedColor, setAffiliateSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [affiliateSelectedVariant, setAffiliateSelectedVariant] = useState<string>("");
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [isPasteLoading, setIsPasteLoading] = useState(false);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [activeDiscount, setActiveDiscount] = useState(0); // overall percentage discount
  const [appliedCodeName, setAppliedCodeName] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoDropdownOpen, setPromoDropdownOpen] = useState(false);
  const [ratingsDropdownOpen, setRatingsDropdownOpen] = useState(false);
  const [ecologyDropdownOpen, setEcologyDropdownOpen] = useState(false);
  const [warrantyDropdownOpen, setWarrantyDropdownOpen] = useState(false);
  const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false);

  // Dynamic promo codes list from Firestore (with local storage)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    try {
      const saved = localStorage.getItem("sitedor_promo_codes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((c: any) => c && c.code && !["WELCOME10", "SUMMER20", "WINTER15"].includes(c.code));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {
      console.warn("Failed to load local promo codes:", e);
    }
    return [];
  });

  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "form" | "payment" | "confirm">("idle");
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

  // Manual payment states
  const [selectedPaymentOp, setSelectedPaymentOp] = useState<"wave" | "orange" | "mtn">("wave");
  const [depositConfirmed, setDepositConfirmed] = useState(false);
  const [isValidatingTransfer, setIsValidatingTransfer] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationSecondsLeft, setValidationSecondsLeft] = useState(60);
  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);
  const [copiedNumberToast, setCopiedNumberToast] = useState<string | null>(null);

  // Favorites spotlight demo item state
  const [spotlightQty, setSpotlightQty] = useState(1);
  const [spotlightColorIdx, setSpotlightColorIdx] = useState(0);
  const [spotlightAdded, setSpotlightAdded] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

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

  // Resilient timeout helper to prevent long Firestore network stalls
  const fetchWithTimeout = async <T,>(promise: Promise<T>, timeoutMs = 6000): Promise<T> => {
    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Firestore timeout")), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  };

  // Sync products dynamically & in real-time from Firestore products collection
  useEffect(() => {
    setIsDbLoading(true);
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setIsDbLoading(false);
        const LEGACY_SAMPLE_IDS = new Set(["orris-chair", "elvo-chair", "sienna-lounge", "mollis-accent", "kivi-cozy", "pohb-sacs-rangement"]);

        if (querySnapshot.empty) {
          setProducts([]);
          try {
            localStorage.setItem("sitedor_products_cache", JSON.stringify([]));
          } catch (e) {}
        } else {
          const uniqueMap = new Map<string, Product>();
          querySnapshot.forEach((docSnapshot) => {
            const p = docSnapshot.data() as Product;
            const pid = p.id || docSnapshot.id;
            
            // Delete legacy sample items if present in Firestore
            if (LEGACY_SAMPLE_IDS.has(pid)) {
              deleteDoc(doc(db, "products", pid)).catch(() => {});
              return;
            }

            p.id = pid;
            if (!p.affiliateCode) {
              p.affiliateCode = generateAffiliateCode(pid || p.name);
            }
            if (!uniqueMap.has(pid)) {
              uniqueMap.set(pid, p);
            }
          });

          const fetchedList = Array.from(uniqueMap.values());
          setProducts(fetchedList);
          try {
            localStorage.setItem("sitedor_products_cache", JSON.stringify(fetchedList));
          } catch (e) {}
        }
      },
      (err: any) => {
        console.warn("Firestore offline or listener timeout - loaded products from local fallback:", err);
        try {
          const saved = localStorage.getItem("sitedor_products_cache");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((p: any) => p && p.id && !["orris-chair", "elvo-chair", "sienna-lounge", "mollis-accent", "kivi-cozy", "pohb-sacs-rangement"].includes(p.id));
              setProducts(filtered);
              setIsDbLoading(false);
              return;
            }
          }
        } catch (e) {}
        setProducts([]);
        setIsDbLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sync site dynamic configuration in real-time from Firestore & LocalStorage
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_config", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const fullConfig = { id: docSnap.id, ...docSnap.data() };
        setSiteConfig(fullConfig as any);
        try {
          localStorage.setItem("site_config_general", JSON.stringify(fullConfig));
        } catch (e) {}
      } else {
        getDocs(collection(db, "site_config")).then((snapshot) => {
          if (!snapshot.empty) {
            const matched = snapshot.docs.find(d => d.id === "general") || 
                            snapshot.docs.find(d => d.id === "main_config") ||
                            snapshot.docs.find(d => d.id !== "categories_config");
            if (matched) {
              const fullConfig = { id: matched.id, ...matched.data() };
              setSiteConfig(fullConfig as any);
              try {
                localStorage.setItem("site_config_general", JSON.stringify(fullConfig));
              } catch (e) {}
            }
          }
        }).catch(() => {});
      }
    }, (err) => {
      console.warn("Firestore site_config snapshot listener fallback:", err);
    });

    return () => unsub();
  }, [activeTab]);

  // Sync promo codes dynamically from Firestore promo_codes collection
  useEffect(() => {
    const fetchPromoCodes = async () => {
      try {
        const q = query(collection(db, "promo_codes"));
        const querySnapshot = await getDocs(q);
        const DEFAULT_PROMO_CODES = new Set(["WELCOME10", "SUMMER20", "WINTER15"]);
        
        if (!querySnapshot.empty) {
          const loaded: PromoCode[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data() as PromoCode;
            if (DEFAULT_PROMO_CODES.has(data.code)) {
              deleteDoc(doc(db, "promo_codes", docSnapshot.id)).catch(() => {});
            } else {
              loaded.push(data);
            }
          });
          setPromoCodes(loaded);
          localStorage.setItem("sitedor_promo_codes", JSON.stringify(loaded));
        } else {
          setPromoCodes([]);
          localStorage.setItem("sitedor_promo_codes", JSON.stringify([]));
        }
      } catch (err: any) {
        console.warn("Firestore promo codes error or offline:", err);
        setPromoCodes([]);
      }
    };
    fetchPromoCodes();
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

  // Sync user custom requests (sur-mesure) history from Firestore
  useEffect(() => {
    if (!user) {
      setMyBespokeRequests([]);
      return;
    }
    const fetchMyBespokeRequests = async () => {
      let fetched: any[] = [];
      try {
        const q = query(collection(db, "product_requests"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          fetched.push(docSnap.data());
        });
      } catch (err: any) {
        console.warn("Firestore offline - user bespoke requests history using local backup:", err);
      }

      // Check local storage backup & deleted blacklist
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("nexus_deleted_product_request_ids") || "[]");
        const localReqs = JSON.parse(localStorage.getItem("nexus_local_product_requests") || "[]");
        const userLocal = localReqs.filter((r: any) => r.userId === user.uid || r.userId === "anonymous");
        userLocal.forEach((lr: any) => {
          if (!fetched.some((f: any) => f.id === lr.id)) {
            fetched.push(lr);
          }
        });
        fetched = fetched.filter((f: any) => !deletedIds.includes(f.id));
      } catch (e) {
        console.warn("Error reading local bespoke requests:", e);
      }

      setMyBespokeRequests(fetched);
    };
    fetchMyBespokeRequests();
  }, [user, userDropdownOpen]);

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
        console.warn("Firestore offline or timeout - loading categories from local fallback:", err);
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
        console.warn("Delayed background update of categories config failed:", err);
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
        console.warn("Firestore offline or timeout - custom options from local fallback:", err);
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

  // Open Product Details view directly for a given product
  const handleOpenProductDetails = (product: Product) => {
    setSelectedAffiliateProduct(product);
    setAffiliateSelectedColor(product.colors?.[0] || null);
    setAffiliateSelectedVariant(product.variants?.[0] || "");
    setAffiliateProductQty(1);
    setIsCodeSearchModalOpen(false);
    setSearchCodeError("");
  };

  // Helper for accent and diacritic insensitive normalization
  const normalizeSearchToken = (str: any = "") => {
    if (!str) return "";
    if (typeof str !== "string") str = String(str);
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  // Comprehensive helper function to check if a product matches a search query
  const matchesProductSearch = (p: any, queryStr: string) => {
    const q = normalizeSearchToken(queryStr);
    if (!q) return true;

    if (p.affiliateCode && normalizeSearchToken(p.affiliateCode).includes(q)) return true;
    if (p.id && normalizeSearchToken(p.id).includes(q)) return true;
    if (p.name && normalizeSearchToken(p.name).includes(q)) return true;
    if (p.category && normalizeSearchToken(p.category).includes(q)) return true;
    if (p.tagline && normalizeSearchToken(p.tagline).includes(q)) return true;
    if (p.description && normalizeSearchToken(p.description).includes(q)) return true;

    if (Array.isArray(p.features) && p.features.some((f: string) => normalizeSearchToken(f).includes(q))) return true;
    if (Array.isArray(p.colors) && p.colors.some((c: any) => normalizeSearchToken(c.name).includes(q) || normalizeSearchToken(c.hex).includes(q))) return true;
    if (Array.isArray(p.variants) && p.variants.some((v: string) => normalizeSearchToken(v).includes(q))) return true;

    return false;
  };

  // Handle Search Product by Affiliate Code or Keyword
  const handleSearchByAffiliateCode = (codeToTest?: string) => {
    const rawCode = codeToTest !== undefined ? codeToTest : affiliateSearchCode;
    const cleanCode = normalizeSearchToken(rawCode);

    if (!cleanCode) {
      setSearchCodeError("Veuillez saisir un terme de recherche ou un code produit.");
      return;
    }

    setSearchCodeError("");

    // Find exact or partial match across products
    const found = products.find(p => 
      (p.affiliateCode && normalizeSearchToken(p.affiliateCode) === cleanCode) || 
      normalizeSearchToken(p.id) === cleanCode ||
      normalizeSearchToken(p.name) === cleanCode
    ) || products.find(p => matchesProductSearch(p, cleanCode));

    if (found) {
      handleOpenProductDetails(found);
    } else {
      setSearchCodeError(`Aucun produit trouvé pour "${rawCode.trim()}". Veuillez vérifier le nom ou le code produit (ex: ${products[0]?.affiliateCode || "NX892A7K"}).`);
    }
  };

  // Paste from Clipboard helper with 2-second spinner and automatic search
  const handlePasteFromClipboard = async () => {
    setSearchCodeError("");
    setCopiedNotice(null);

    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setSearchCodeError(
        "Accès au presse-papier non supporté par votre navigateur. Veuillez coller votre code directement dans le champ de recherche."
      );
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text ? text.trim() : "";

      if (!cleanText) {
        setSearchCodeError(
          "Le presse-papier est actuellement vide. Veuillez d'abord copier un code produit d'affiliation (ex: NX892A7K) puis réessayer."
        );
        return;
      }

      // Valid text retrieved from clipboard
      const formatted = cleanText.toUpperCase();
      setAffiliateSearchCode(formatted);
      setCopiedNotice("Code collé !");
      setIsPasteLoading(true);

      // 2 seconds spinner delay as requested
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Direct search & redirect to product
      handleSearchByAffiliateCode(formatted);
    } catch (e: any) {
      console.warn("Could not read clipboard:", e);
      setSearchCodeError(
        "Impossible d'accéder au presse-papier (accès refusé ou bloqué par le navigateur). Veuillez autoriser le presse-papier ou coller le code manuellement."
      );
    } finally {
      setIsPasteLoading(false);
    }
  };

  // Open Specialized Search Page handler
  const handleOpenSpecializedSearchPage = async () => {
    setIsCodeSearchModalOpen(false);
    setIsSpecializedSearchPage(true);
    setActiveTab("search");
    setSearchCodeError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim() && text.trim().length >= 4) {
          setAffiliateSearchCode(text.trim().toUpperCase());
        }
      }
    } catch (e) {
      // quiet fallback
    }
  };

  const handleAddToCartFromAffiliateView = (product: Product) => {
    const activeColor = affiliateSelectedColor || product.colors?.[0] || { name: "Standard", hex: "#000000" };
    const activeVariant = affiliateSelectedVariant || (product.variants && product.variants[0]) || "";
    
    for (let i = 0; i < affiliateProductQty; i++) {
      handleAddToCart(product, activeColor, activeVariant);
    }
    setCartOpen(true);
  };

  // Google Sign-In helper triggers Google Auth Provider
  const handleGoogleLogin = async () => {
    try {
      setGoogleAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Google authentication failed:", e);
      const errCode = e?.code || "";
      
      // If the user closed or cancelled the popup themselves, we do not show the critical config modal
      if (errCode === "auth/cancelled-popup-request" || errCode === "auth/popup-closed-by-user") {
        return; // Normal cancellation, ignore silently without popping up structural error modal
      }
      
      let errorHelpMsg = "La connexion Google a échoué.";
      if (errCode === "auth/unauthorized-domain") {
        errorHelpMsg = "Ce domaine de déploiement (ex: Vercel) n'est pas encore autorisé dans votre console Firebase. Vous devez l'ajouter dans l'onglet 'Authentication > Paramètres > Domaines autorisés' de Firebase.";
      } else if (errCode === "auth/popup-blocked") {
        errorHelpMsg = "La fenêtre contextuelle de connexion a été bloquée par votre navigateur. Veuillez autoriser les popups pour ce site.";
      } else {
        errorHelpMsg = `Erreur de connexion : ${e?.message || String(e)}. Assurez-vous d'avoir autorisé ce domaine sur la Console Firebase.`;
      }
      setGoogleAuthError(errorHelpMsg);
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

  // Admin add, update and remove connected to firestore and local storage
  const handleAddNewProduct = async (newProduct: Product) => {
    // Optimistic UI update
    const previousProducts = [...products];
    const updated = [newProduct, ...products];
    setProducts(updated);
    try {
      localStorage.setItem("sitedor_products_cache", JSON.stringify(updated));
    } catch (e) {}

    // Persist backup to filesystem for GitHub export synchronization
    try {
      await fetch('/api/products/save-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
    } catch (backupErr) {
      console.warn("Product backup save error:", backupErr);
    }

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
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    try {
      localStorage.setItem("sitedor_products_cache", JSON.stringify(updated));
    } catch (e) {}

    // Persist backup to filesystem for GitHub export synchronization
    try {
      await fetch('/api/products/save-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
    } catch (backupErr) {
      console.warn("Product backup save error:", backupErr);
    }

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
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    try {
      localStorage.setItem("sitedor_products_cache", JSON.stringify(updated));
    } catch (e) {}
    setCart(cart.filter(item => item.product.id !== productId));

    // Persist backup to filesystem for GitHub export synchronization
    try {
      await fetch('/api/products/save-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updated })
      });
    } catch (backupErr) {
      console.warn("Product backup save error:", backupErr);
    }

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

    // Trigger toast & cart bump animation
    triggerCartToast(
      finalProduct.name,
      finalProduct.image || color.hex,
      finalProduct.price,
      color.name,
      1
    );

    // Auto-open side drawer to verify the action
    setCartOpen(true);
  };

  const handleSpotlightAddToCart = () => {
    const spotlightItem = products.find(p => p.isFeatured) || products.find(p => p.id === "sienna-lounge") || products[0];
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

    triggerCartToast(
      spotlightItem.name,
      spotlightItem.image || selectedColor.hex,
      spotlightItem.price,
      selectedColor.name,
      spotlightQty
    );

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
  const handleApplyPromo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const typed = promoCodeInput.trim().toUpperCase();
    if (!typed) return;

    const found = promoCodes.find(p => p.code.trim().toUpperCase() === typed);
    if (found) {
      if (found.status === "active") {
        setActiveDiscount(found.discount);
        setAppliedCodeName(`${found.code} (-${found.discount}%)`);
        setPromoError("");
        setPromoCodeInput("");
      } else {
        setPromoError(lang === "en" ? "This coupon code is not active yet." : "Ce code promo n'est pas encore activé.");
      }
    } else {
      if (typed === "WELCOME10" || typed === "SITEDOR10") {
        setActiveDiscount(10);
        setAppliedCodeName(`${typed} (-10%)`);
        setPromoError("");
        setPromoCodeInput("");
      } else if (typed === "SUMMER20" || typed === "OFFRE20") {
        setActiveDiscount(20);
        setAppliedCodeName(`${typed} (-20%)`);
        setPromoError("");
        setPromoCodeInput("");
      } else if (typed === "PROMO15" || typed === "WINTER15") {
        setActiveDiscount(15);
        setAppliedCodeName(`${typed} (-15%)`);
        setPromoError("");
        setPromoCodeInput("");
      } else {
        setPromoError(lang === "en" ? "Invalid discount code." : "Code de réduction invalide ou expiré.");
      }
    }
  };

  const handleApplyPromoDirect = (promo: PromoCode) => {
    if (promo.status === "active") {
      if (appliedCodeName.includes(promo.code)) {
        setActiveDiscount(0);
        setAppliedCodeName("");
        setPromoError("");
      } else {
        setActiveDiscount(promo.discount);
        setAppliedCodeName(`${promo.code} (-${promo.discount}%)`);
        setPromoError("");
      }
    } else {
      alert(lang === "en" ? "This coupon is planned and not yet active." : "Ce code est prévu et n'est pas encore actif.");
    }
  };

  const handleRemovePromo = () => {
    setActiveDiscount(0);
    setAppliedCodeName("");
    setPromoError("");
  };

  const handleAddPromoCode = async (newPromo: PromoCode) => {
    const cleanCode = newPromo.code.trim().toUpperCase();
    const promoObj = { ...newPromo, code: cleanCode };
    const exists = promoCodes.some(p => p.code === cleanCode);
    
    let updatedPromos: PromoCode[];
    if (exists) {
      updatedPromos = promoCodes.map(p => p.code === cleanCode ? promoObj : p);
    } else {
      updatedPromos = [promoObj, ...promoCodes];
    }
    setPromoCodes(updatedPromos);
    try {
      localStorage.setItem("sitedor_promo_codes", JSON.stringify(updatedPromos));
    } catch(e){}

    try {
      await setDoc(doc(db, "promo_codes", cleanCode), promoObj);
    } catch (err) {
      console.warn("Firestore promo code background save error (saved locally):", err);
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const updatedPromos = promoCodes.filter(p => p.code !== cleanCode);
    setPromoCodes(updatedPromos);
    try {
      localStorage.setItem("sitedor_promo_codes", JSON.stringify(updatedPromos));
    } catch(e){}

    try {
      await deleteDoc(doc(db, "promo_codes", cleanCode));
    } catch (err) {
      console.warn("Firestore promo code background delete error (deleted locally):", err);
    }
  };

  // Checkout values calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = Math.round((subtotal * activeDiscount) / 100);
  const BASE_CFA_RATE = 655.957;
  const shippingCharge = subtotal === 0 ? 0 : (2000 / BASE_CFA_RATE);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCharge);

  // Timer effect for 1-minute transfer validation progress
  useEffect(() => {
    let timer: any = null;
    if (isValidatingTransfer) {
      setValidationProgress(0);
      setValidationSecondsLeft(60);
      const startTime = Date.now();
      const totalDuration = 60 * 1000; // 60 seconds (1 minute)

      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / totalDuration) * 100);
        const secsLeft = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));

        setValidationProgress(pct);
        setValidationSecondsLeft(secsLeft);

        if (pct >= 100) {
          clearInterval(timer);
          setIsValidatingTransfer(false);
          // Complete final submission & explode confetti!
          executeFinalOrderSubmission(`Mobile Money (${selectedPaymentOp.toUpperCase()})`);
        }
      }, 250);
    } else {
      setValidationProgress(0);
      setValidationSecondsLeft(60);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isValidatingTransfer, selectedPaymentOp]);

  const handleCopyNumber = (numStr: string) => {
    navigator.clipboard.writeText(numStr);
    setCopiedNumberToast(numStr);
    setTimeout(() => setCopiedNumberToast(null), 2500);
  };

  const handleLaunchCheckout = () => {
    setCheckoutStep("form");
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      alert(lang === "en" ? "Please fill required fields" : "Veuillez renseigner les champs requis.");
      return;
    }

    if (!user) {
      alert(lang === "en" ? "Kindly authenticate before checkout." : "Veuillez vous connecter pour valider votre commande.");
      return;
    }

    setCheckoutStep("payment");
  };

  const executeFinalOrderSubmission = async (paymentMethodName: string = "Mobile Money"): Promise<string | null> => {
    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      alert("Veuillez remplir les informations de livraison.");
      return null;
    }

    const userId = user?.uid || `guest-${Math.random().toString(36).substr(2, 8)}`;
    const orderId = `NX-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const orderDoc = {
        id: orderId,
        userId: userId,
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        zip: shippingAddress.zip || "",
        phone: shippingAddress.phone || "",
        email: shippingAddress.email || user?.email || "",
        paymentMethod: paymentMethodName,
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
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "orders", orderId), orderDoc);
      setOrderTracking(orderId);
      setCart([]);
      setCheckoutStep("confirm");
      triggerOrderCelebration();
      return orderId;
    } catch (err: any) {
      console.error("Failed to place order in Firestore:", err);
      // Resilient fallback for client state
      setOrderTracking(orderId);
      setCart([]);
      setCheckoutStep("confirm");
      triggerOrderCelebration();
      return orderId;
    }
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    handleProceedToPayment(e);
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

  // Spotlight Product selection reference (prioritizes admin-selected featured product)
  const spotlightProduct = products.find(p => p.isFeatured) || products.find(p => p.id === "sienna-lounge") || products[0];

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
          
          {/* Logo with Sitedor & Favicon coin */}
          <div 
            onClick={() => handleScrollToId("store-hero")} 
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <img 
              src="/favicon_coin_1781258932861.jpg" 
              alt="sitedor favicon" 
              referrerPolicy="no-referrer"
              className="w-5.5 h-5.5 rounded-full object-cover border border-[#2d4a22]/20 dark:border-amber-500/10 shadow-3xs"
            />
            <span className={`font-sans font-black text-xl tracking-tight ${theme === 'black' ? 'text-white' : 'text-slate-900'}`}>
              sitedor<span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2d4a22] ml-0.5 animate-pulse"></span>
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
              onClick={() => {
                setActiveTab("search");
                setSearchCodeError("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} 
              className={`hover:text-[#2d4a22] hover:dark:text-emerald-400 transition-colors cursor-pointer text-[10px] flex items-center gap-1 ${
                activeTab === "search" ? "text-[#2d4a22] dark:text-emerald-400 font-extrabold" : ""
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#2d4a22] dark:text-emerald-400" />
              <span>{lang === "en" ? "Search" : lang === "es" ? "Buscar" : "Recherche"}</span>
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

            {/* Shopping Cart button handle with dynamic bounce animation */}
            <motion.button 
              onClick={() => setCartOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              animate={cartBump ? { scale: [1, 1.25, 0.92, 1.12, 1], rotate: [0, -8, 8, -4, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`relative p-2.5 bg-[#f4f8f3] dark:bg-slate-800 border border-[#e2eae0] dark:border-slate-700 rounded-xl hover:bg-[#eef5eb] dark:hover:bg-slate-750 cursor-pointer text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs select-none ${
                cartBump ? "ring-2 ring-emerald-500/50 bg-emerald-50 dark:bg-slate-750" : ""
              }`}
              id="cart-hand-btn"
            >
              <ShoppingBag className={`w-4 h-4 text-[#2d4a22] transition-transform ${cartBump ? "scale-110" : ""}`} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline text-slate-705 dark:text-slate-200">{t.cart}</span>
              {cart.length > 0 && (
                <motion.span
                  key={cart.reduce((sum, item) => sum + item.quantity, 0)}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 bg-[#2d4a22] text-white font-mono text-[10px] font-bold rounded-full items-center justify-center shadow-md border-2 border-white"
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </motion.span>
              )}
            </motion.button>

            {/* Admin toggle padlock button - visible only to the administrator when logged in */}
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
              promoCodes={promoCodes}
              onAddPromoCode={handleAddPromoCode}
              onDeletePromoCode={handleDeletePromoCode}
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
              onOpenDetails={handleOpenProductDetails}
              lang={lang} 
              currency={currency} 
              layoutMode="collection" 
              categories={categories}
            />
          </motion.div>
        ) : activeTab === "search" ? (
          /* DEDICATED FULL-PAGE PRODUCT SEARCH VIEW WITH PINTEREST-STYLE SEARCH DESIGN */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 py-4 text-left max-w-4xl mx-auto"
          >
            {/* Header and Back navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 text-left">
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
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#2d4a22]/10 dark:bg-emerald-950 text-[#2d4a22] dark:text-emerald-400 rounded-2xl border border-[#2d4a22]/20">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-sans text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Recherche
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Collez un code d'affiliation (ex: NX892A7K) ou recherchez par nom de produit.
                    </p>
                  </div>
                </div>
              </div>

              <span className="self-start md:self-auto text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-[#2d4a22] dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                Espace Recherche & Exploration
              </span>
            </div>

            {/* PINTEREST-STYLE ROUNDED SEARCH BAR CONTAINER */}
            <div className="space-y-4">
              <div className="relative flex items-center w-full">
                {/* Search Pill Input Outer Wrapper */}
                <div className="relative w-full flex items-center bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 focus-within:border-[#2d4a22] dark:focus-within:border-emerald-500 rounded-full shadow-sm transition-all overflow-hidden group/searchpill">
                  <Search className="w-5 h-5 absolute left-5 text-slate-400 pointer-events-none group-focus-within/searchpill:text-[#2d4a22] dark:group-focus-within/searchpill:text-emerald-400 transition-colors" />
                  
                  <input
                    type="text"
                    value={affiliateSearchCode}
                    onChange={(e) => {
                      setAffiliateSearchCode(e.target.value);
                      setSearchCodeError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchByAffiliateCode();
                      }
                    }}
                    placeholder="Rechercher par nom, essence de bois, couleur ou code..."
                    className="w-full bg-transparent pl-14 pr-44 py-4 md:py-4.5 text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  />

                  <div className="absolute right-2 flex items-center gap-1">
                    {affiliateSearchCode && !isPasteLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          setAffiliateSearchCode("");
                          setSearchCodeError("");
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-full"
                        title="Effacer la recherche"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Primary Action Button inside search bar */}
                    {affiliateSearchCode.trim() ? (
                      <button
                        type="button"
                        onClick={() => handleSearchByAffiliateCode()}
                        className="bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5 select-none"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Rechercher</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPasteLoading}
                        onClick={handlePasteFromClipboard}
                        className="bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed select-none"
                      >
                        {isPasteLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Collage...</span>
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-3.5 h-3.5" />
                            <span>{copiedNotice || "Coller le code"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Loading Status Alert */}
              {isPasteLoading && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-[#2d4a22] dark:text-emerald-300 font-extrabold flex items-center justify-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2d4a22] dark:text-emerald-400 flex-shrink-0" />
                  <span>Code collé avec succès ! Recherche et ouverture du produit en cours (2s)...</span>
                </div>
              )}

              {/* Error Alert */}
              {searchCodeError && !isPasteLoading && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                  <span>{searchCodeError}</span>
                </div>
              )}

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 shrink-0 tracking-wider">
                  Catégories :
                </span>
                {categories.map((cat, idx) => {
                  const count = products.filter(p => p.category === cat).length;
                  const sampleProduct = products.find(p => p.category === cat);
                  return (
                    <button
                      key={`search-cat-chip-${cat}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (sampleProduct) {
                          handleOpenProductDetails(sampleProduct);
                        } else {
                          handleSearchByAffiliateCode(cat);
                        }
                      }}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#2d4a22] hover:text-white dark:hover:bg-emerald-600"
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Sample Quick Code Pills */}
              {products.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 shrink-0 tracking-wider">
                    Codes rapides :
                  </span>
                  {products.map((p, idx) => (
                    <button
                      key={`search-sample-${p.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        handleOpenProductDetails(p);
                      }}
                      className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-[#2d4a22] hover:text-white dark:hover:bg-emerald-600 text-[#2d4a22] dark:text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/80 transition-all shrink-0 cursor-pointer"
                    >
                      {p.affiliateCode || p.id} ({p.name})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* "DES IDÉES POUR VOUS" SECTION */}
            {categories.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Des idées pour vous</span>
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{categories.length} Catégories</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {categories.slice(0, 5).map((cat, idx) => {
                    const sampleProduct = products.find(p => p.category === cat) || (products.length > 0 ? products[idx % products.length] : undefined);
                    return (
                      <div
                        key={`idea-cat-${cat}-${idx}`}
                        onClick={() => {
                          if (sampleProduct) {
                            handleOpenProductDetails(sampleProduct);
                          }
                        }}
                        className="relative aspect-[16/7] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all border border-slate-200/80 dark:border-slate-800 active:scale-[0.98]"
                      >
                        <img
                          src={sampleProduct?.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800"}
                          alt={cat}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent group-hover:from-slate-950/95 transition-opacity" />
                        <div className="absolute inset-0 flex items-end p-2.5 text-left">
                          <span className="text-white font-extrabold text-xs leading-tight tracking-wide drop-shadow-sm line-clamp-1">
                            {cat}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* "POPULAIRE SUR SITEDOR" SECTION */}
            <div className="space-y-4 pt-2">
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Populaire sur Sitedor
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {products.slice(0, 4).map((p, idx) => (
                  <div
                    key={`pop-prod-${p.id}-${idx}`}
                    onClick={() => handleOpenProductDetails(p)}
                    className="relative aspect-21/9 rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all border border-slate-200/80 dark:border-slate-800 active:scale-[0.99]"
                  >
                    <ProductMediaGallery
                      image={p.image}
                      image2={p.image2}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 group-hover:from-black/95 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col justify-end p-3.5 md:p-4 text-left">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                        Code: {p.affiliateCode || p.id}
                      </span>
                      <h3 className="text-white font-black text-sm md:text-base tracking-wide drop-shadow-md">
                        {p.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

                {/* Headline priority: Admin siteConfig > First Admin product name > Default */}
                <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
                  {siteConfig?.heroTitle || (products[0] ? products[0].name.split(",")[0] : t.heroTitle)}<br />
                  <span className="font-serif italic font-normal text-[#2d4a22] dark:text-emerald-450">
                    {siteConfig?.heroSub || (products[0]?.tagline ? products[0].tagline : t.heroSub)}
                  </span>
                </h1>

                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                  {siteConfig?.heroDesc || (products[0]?.description ? products[0].description.slice(0, 160) : t.heroDesc)}
                </p>

                {/* Button: recherche produit pas code (Positioned directly above Découvrir la Collection) */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setAffiliateSearchCode("");
                      setSearchCodeError("");
                      setActiveTab("search");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#2d4a22] via-emerald-850 to-emerald-950 hover:from-[#1a2d15] hover:to-[#2d4a22] text-white font-extrabold text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 border border-emerald-500/30 group/affbtn"
                  >
                    <Search className="w-3.5 h-3.5 text-emerald-300 group-hover/affbtn:scale-110 transition-transform" />
                    <span>recherche produit pas code</span>
                    <span className="bg-emerald-400/20 text-emerald-200 text-[9px] font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Code
                    </span>
                  </button>
                </div>

                {/* Main Action CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  {siteConfig?.btnCta1Active !== false && (
                    <button 
                      type="button"
                      onClick={() => handleScrollToId(siteConfig?.btnCta1Target || "pricing-plans")}
                      className={`font-extrabold text-[10px] uppercase tracking-widest px-7 py-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 select-none ${
                        siteConfig?.btnCta1Style === 'outline'
                          ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          : siteConfig?.btnCta1Style === 'secondary'
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 shadow-sm"
                          : "bg-[#2d4a22] hover:bg-[#1a2d15] text-white shadow-md"
                      }`}
                    >
                      {lang === 'en' 
                        ? (siteConfig?.btnCta1TextEn || "Discover the Collection") 
                        : (siteConfig?.btnCta1Text || t.heroViewCollection)}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {siteConfig?.btnCta2Active !== false && (
                    <button 
                      type="button"
                      onClick={() => handleScrollToId(siteConfig?.btnCta2Target || "interactive-model-sandbox")}
                      className={`font-extrabold text-[10px] uppercase tracking-widest px-7 py-4 rounded-xl transition-all cursor-pointer text-center select-none ${
                        siteConfig?.btnCta2Style === 'primary'
                          ? "bg-[#2d4a22] hover:bg-[#1a2d15] text-white shadow-md"
                          : siteConfig?.btnCta2Style === 'secondary'
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 shadow-sm"
                          : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {lang === 'en' 
                        ? (siteConfig?.btnCta2TextEn || "Start Customizing") 
                        : (siteConfig?.btnCta2Text || t.heroStartAtelier)}
                    </button>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x py-1.5 px-0.5">
                  
                  {/* Single Codes Promos action button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPromoDropdownOpen(true);
                      setRatingsDropdownOpen(false);
                      setEcologyDropdownOpen(false);
                      setWarrantyDropdownOpen(false);
                      setDeliveryDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#2d4a22] to-[#1a2d15] dark:from-emerald-900/60 dark:to-slate-900 border border-[#2d4a22]/30 dark:border-emerald-500/40 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-98 transition-all duration-200 cursor-pointer text-left select-none group"
                  >
                    <div className="p-2 bg-white/10 dark:bg-emerald-500/10 rounded-xl text-white dark:text-emerald-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-black text-white dark:text-emerald-300 flex items-center gap-2 leading-none">
                        <span>{promoCodes.filter(p => p.status === 'active').slice(0, 1).map(p => p.code).join(' • ') || "PROMO"}</span>
                        {appliedCodeName ? (
                          <span className="bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-sans font-extrabold uppercase">
                            - {activeDiscount}% Appliqué
                          </span>
                        ) : (
                          <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-sans font-extrabold uppercase">
                            {promoCodes.filter(p => p.status === 'active').length} Code(s) Dispo
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-200/80 dark:text-emerald-400/80 mt-1">
                        Codes Promos & Offres
                      </div>
                    </div>
                  </button>

                </div>

                {/* Pop-up Modals with details */}

                {/* Modal 1: Notes d'Ateliers */}
                <AnimatePresence>
                  {ratingsDropdownOpen && (
                    <div key="ratings-modal-root" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Dark backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setRatingsDropdownOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                      />
                      
                      {/* Modal Box */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md relative font-sans z-10"
                      >
                        <button
                          type="button"
                          onClick={() => setRatingsDropdownOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <span className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] leading-tight">
                              {lang === 'en' ? "Atelier Ratings" : "Statistiques des Évaluations"}
                            </h4>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-mono font-black">
                              {lang === 'en' ? "Verified Client Reviews" : "Avis Clients Authentiques"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-3xl font-black text-slate-900 dark:text-white">4.9/5</span>
                            <div>
                              <div className="flex text-amber-450 text-sm">
                                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">(142 {lang === 'en' ? "verified reviews" : "avis vérifiés"})</span>
                            </div>
                          </div>

                          <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                            <div className="space-y-1.5">
                              {/* Star bars */}
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="w-10">5 {lang === 'en' ? "stars" : "étoiles"}</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-450 rounded-full" style={{ width: "92%" }}></div>
                                </div>
                                <span className="w-8 text-right text-slate-400">92%</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="w-10">4 {lang === 'en' ? "stars" : "étoiles"}</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-450 rounded-full" style={{ width: "7%" }}></div>
                                </div>
                                <span className="w-8 text-right text-slate-400">7%</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="w-10">3 {lang === 'en' ? "stars" : "étoiles"}</span>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-450 rounded-full" style={{ width: "1%" }}></div>
                                </div>
                                <span className="w-8 text-right text-slate-400">1%</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {lang === 'en' 
                              ? "Our clients emphasize our structural sturdiness, precision of assembly, and premium wood Selection. Each item is hand-finished in our atelier." 
                              : "Nos clients soulignent la solidité structurelle exceptionnelle, la précision de nos assemblages et l'élégance intemporelle de nos bois. Chaque création est façonnée individuellement à la main."}
                          </p>

                          <div className="flex gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => setRatingsDropdownOpen(false)}
                              className="flex-1 text-center py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
                            >
                              {lang === 'en' ? "Close" : "Fermer"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRatingsDropdownOpen(false);
                                handleScrollToId("reviews-carousel");
                              }}
                              className="flex-1 text-center py-2.5 bg-[#2d4a22] hover:bg-[#3d5e30] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white dark:text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                            >
                              {lang === 'en' ? "Read Reviews" : "Lire les avis"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Modal 2: Ébénisterie FSC */}
                <AnimatePresence>
                  {ecologyDropdownOpen && (
                    <div key="ecology-modal-root" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Dark backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEcologyDropdownOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                      />
                      
                      {/* Modal Box */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md relative font-sans z-10"
                      >
                        <button
                          type="button"
                          onClick={() => setEcologyDropdownOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <span className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] leading-tight">
                              {lang === 'en' ? "Eco-Commitment" : "Engagement Éco-Responsable"}
                            </h4>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-mono font-black">
                              {lang === 'en' ? "100% FSC wood certified" : "Bois certifié FSC à 100%"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {lang === 'en'
                              ? "100% of our wood stems from European and local sustainable forests. Every trunk is selected with care, honoring forest biodiversity and renewal cycles."
                              : "Tous nos bois proviennent de forêts européennes et locales éco-gérées. Chaque tronc est sélectionné avec soin, respectant la biodiversité et les cycles naturels de renouvellement."}
                          </p>

                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5 text-xs">
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Noble Wood Essences" : "Essences nobles de bois"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "French Oak, Ash, and Walnut sourced sustainably" : "Chêne de Bourgogne, Frêne blanc et Noyer d'exception"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Zero chemical solvent" : "Zéro solvant chimique"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "Natural organic oils, beeswaxes, and plant-based finishes" : "Huiles et cires d'abeille biologiques 100% naturelles"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Local Circular Workshop" : "Fabrication Locale Circulaire"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "Handmade locally, significantly reducing our carbon footprint" : "Fabrication artisanale réduisant drastiquement l'empreinte carbone"}</p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEcologyDropdownOpen(false)}
                            className="w-full text-center py-2.5 bg-[#2d4a22] hover:bg-[#3d5e30] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white dark:text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            {lang === 'en' ? "Understood" : "Compris"}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Modal 3: Promo Codes */}
                <AnimatePresence>
                  {promoDropdownOpen && (
                    <div key="promo-modal-root" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Dark backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPromoDropdownOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                      />
                      
                      {/* Modal Box */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md relative font-sans z-10"
                      >
                        <button
                          type="button"
                          onClick={() => setPromoDropdownOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <span className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                            <Tag className="w-5 h-5 text-[#2d4a22] dark:text-emerald-450" />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] leading-tight">
                              {lang === 'en' ? "Promo Codes" : "Codes de réduction"}
                            </h4>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-mono font-black">
                              {lang === 'en' ? "Select a code to apply" : "Sélectionnez un code à appliquer"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {promoCodes.map((p, idx) => {
                              const isApplied = appliedCodeName.includes(p.code);
                              return (
                                <button
                                  key={`promo-${p.code}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    if (p.status === 'active') {
                                      handleApplyPromoDirect(p);
                                      setPromoDropdownOpen(false);
                                    } else {
                                      alert("Ce code est réservé/prévu pour plus tard.");
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                    isApplied
                                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-400"
                                      : p.status === 'active'
                                        ? "bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border-slate-100 dark:border-slate-800"
                                        : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-100/50 dark:border-slate-800/50 opacity-60"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1 text-left">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-black text-slate-800 dark:text-slate-100 text-xs">{p.code}</span>
                                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                                        p.status === 'active'
                                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-450"
                                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-450"
                                      }`}>
                                        {p.status === 'active' ? `-${p.discount}%` : 'PRÉVU'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{p.description}</p>
                                  </div>
                                  {isApplied && (
                                    <span className="text-emerald-600 dark:text-emerald-450 shrink-0">
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {appliedCodeName && (
                            <div className="text-center pt-2.5 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDiscount(0);
                                  setAppliedCodeName("");
                                  setPromoDropdownOpen(false);
                                }}
                                className="text-[10px] font-mono font-bold text-rose-500 hover:underline cursor-pointer"
                              >
                                Retirer le code appliqué
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setPromoDropdownOpen(false)}
                            className="w-full text-center py-2.5 bg-[#2d4a22] hover:bg-[#3d5e30] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white dark:text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            {lang === 'en' ? "Close" : "Fermer"}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Modal 4: Garantie Atelier */}
                <AnimatePresence>
                  {warrantyDropdownOpen && (
                    <div key="warranty-modal-root" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Dark backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setWarrantyDropdownOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                      />
                      
                      {/* Modal Box */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md relative font-sans z-10"
                      >
                        <button
                          type="button"
                          onClick={() => setWarrantyDropdownOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <span className="p-2 bg-[#2d4a22]/10 rounded-xl">
                            <Award className="w-5 h-5 text-[#2d4a22] dark:text-emerald-450" />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] leading-tight">
                              {lang === 'en' ? "Workshop Guarantee" : "Garantie de l'Atelier"}
                            </h4>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-mono font-black">
                              {lang === 'en' ? "10-Year Structural Coverage" : "Couverture structurelle de 10 ans"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {lang === 'en'
                              ? "Our premium, solid-wood and jointed pieces are designed to become family heirlooms. We stand behind our traditional craftsmanship."
                              : "Nos pièces d'ébénisterie en bois massif sont conçues pour durer des générations. Nous garantissons notre savoir-faire artisanal traditionnel de haute précision."}
                          </p>

                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5 text-xs">
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "10-Year Sturdiness" : "Garantie 10 Ans Robustesse"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "Structural framework, wood splits, joinery and integrity" : "Châssis, assemblages traditionnels, fentes de bois et intégrité"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Lifelong Maintenance" : "Entretien à Vie"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "Repairs and re-oiling service available at cost price" : "Service de ponçage, huilage et réparation professionnelle au prix coûtant"}</p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setWarrantyDropdownOpen(false)}
                            className="w-full text-center py-2.5 bg-[#2d4a22] hover:bg-[#3d5e30] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white dark:text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            {lang === 'en' ? "Understood" : "Compris"}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Modal 5: Livraison Premium */}
                <AnimatePresence>
                  {deliveryDropdownOpen && (
                    <div key="delivery-modal-root" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Dark backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDeliveryDropdownOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                      />
                      
                      {/* Modal Box */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md relative font-sans z-10"
                      >
                        <button
                          type="button"
                          onClick={() => setDeliveryDropdownOpen(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <span className="p-2 bg-[#2d4a22]/10 rounded-xl">
                            <Truck className="w-5 h-5 text-[#2d4a22] dark:text-emerald-450" />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] leading-tight">
                              {lang === 'en' ? "Premium Delivery" : "Livraison d'Exception"}
                            </h4>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-mono font-black">
                              {lang === 'en' ? "White-Glove In-Home Service" : "Service à domicile gants blancs"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {lang === 'en'
                              ? "We don't just drop off packages. Our white-glove transport team delivers to your room of choice, completely unpacks, and sets up your furniture."
                              : "Vos meubles de créateurs méritent un transport irréprochable. Notre équipe livre dans la pièce de votre choix, déballe, et assemble soigneusement chaque meuble."}
                          </p>

                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5 text-xs">
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Room of Choice" : "Pièce de Destination"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "Direct placement in living room, office, or dining room" : "Installation à l'emplacement exact de votre choix (étage inclus)"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✔</span>
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200">{lang === 'en' ? "Eco Waste Removal" : "Retrait des emballages"}</strong>
                                <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'en' ? "Complete packaging removal and immediate recycling" : "Nettoyage de l'espace et recyclage intégral des cartons et palettes de transport"}</p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeliveryDropdownOpen(false)}
                            className="w-full text-center py-2.5 bg-[#2d4a22] hover:bg-[#3d5e30] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white dark:text-slate-950 rounded-xl transition-all cursor-pointer shadow-md"
                          >
                            {lang === 'en' ? "Understood" : "Compris"}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

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
                      <ProductMediaGallery 
                        image={spotlightProduct.image} 
                        image2={spotlightProduct.image2}
                        youtubeUrl={spotlightProduct.youtubeUrl}
                        alt={spotlightProduct.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/hero:scale-105" 
                        containerClassName="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/50 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-3 text-xs text-white font-mono font-semibold bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                        {spotlightProduct.tagline || spotlightProduct.category || "Produit d'Atelier"}
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
                              key={`spotlight-col-${col.hex || idx}-${idx}`}
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

                      <motion.button
                        type="button"
                        onClick={handleSpotlightAddToCart}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.92 }}
                        className={`flex-1 py-3 px-6 rounded-xl text-xs uppercase tracking-widest font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          spotlightAdded
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40"
                            : "bg-[#2d4a22] hover:bg-[#1a2d15] text-white shadow-sm"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {spotlightAdded ? (
                            <motion.span
                              key="spot-check"
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              className="flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4 font-extrabold stroke-[3]" />
                              <span>{t.addedTitle || "Ajouté !"}</span>
                            </motion.span>
                          ) : (
                            <motion.span
                              key="spot-bag"
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1.5"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? "Instant Buy" : lang === 'es' ? "Comprar Ahora" : lang === 'ar' ? "شراء فوري" : "Acheter"}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
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
                products={products} 
                onAddToCart={handleAddToCart} 
                onOpenDetails={handleOpenProductDetails}
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
            <section id="interactive-model-sandbox" className="space-y-6 pt-6 scroll-mt-24">
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
                siteConfig={siteConfig}
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
              <img 
                src="/favicon_coin_1781258932861.jpg" 
                alt="sitedor favicon" 
                referrerPolicy="no-referrer"
                className="w-4.5 h-4.5 rounded-full object-cover border border-[#2d4a22]/20 shadow-4xs"
              />
              sitedor<span className="w-1.5 h-1.5 rounded-full bg-[#2d4a22] inline-block"></span>
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
              {lang === 'en' ? "Support & Contact Direct" : lang === 'es' ? "Soporte y Contacto Directo" : lang === 'ar' ? "الدعم الفني والاتصال المباشر" : "Support & Contact Direct"}
            </h4>
            <p className="leading-relaxed font-medium">
              {siteConfig?.footerContact || (lang === 'en' ? "Secure delivery and responsive customer support. Click below to reach us via phone call or WhatsApp." : "Livraison nationale sécurisée et service client réactif. Cliquez ci-dessous pour nous joindre directement par appel téléphonique ou message WhatsApp.")}
            </p>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">E-mail :</span>
                <a 
                  href="mailto:devcristan3@gmail.com" 
                  className="text-[#2d4a22] dark:text-[#84a98c] font-extrabold hover:underline transition-all flex items-center gap-1.5"
                  title="Envoyer un e-mail à devcristan3@gmail.com"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  devcristan3@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Contact :</span>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[#2d4a22] dark:text-emerald-400 font-black hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer underline decoration-dotted underline-offset-4 bg-[#2d4a22]/5 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-[#2d4a22]/10 dark:border-emerald-800/30"
                  title="Cliquer pour choisir entre Appel direct ou WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  +225 07 04 54 29 09
                </button>
              </div>
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
              &copy; {new Date().getFullYear()} sitedor. All Rights Reserved.
            </div>
          </div>

        </div>
      </footer>

      {/* PHONE & WHATSAPP CONTACT CHOICE MODAL */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div key="contact-choice-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm relative z-10 p-6 shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-[#2d4a22]/10 dark:bg-emerald-950/80 text-[#2d4a22] dark:text-emerald-400 rounded-2xl">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Contact Atelier sitedor
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      +225 07 04 54 29 09
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                Comment souhaitez-vous contacter notre service client et atelier ?
              </p>

              <div className="space-y-3 pt-1">
                <a
                  href="tel:+2250704542909"
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-full py-3 px-4 bg-[#2d4a22] hover:bg-[#1e3217] text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md shadow-[#2d4a22]/20 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Appeler directement (+225 0704542909)
                </a>

                <a
                  href="https://wa.me/2250704542909?text=Bonjour%20sitedor,%20je%20souhaite%20des%20informations%20sur%20vos%20cr%C3%A9ations."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Envoyer un message WhatsApp
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHOPPING CART FULL-WIDTH PAGE MODAL */}
      <AnimatePresence>
        {cartOpen && (
          <div key="cart-full-page-root" className="fixed inset-0 z-50 overflow-y-auto font-sans bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 cursor-pointer"
            />

            {/* Main Full-Width Cart Container Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-w-5xl lg:max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-left my-auto"
            >
              {/* Header Bar with Stepper */}
              <div className="p-4 sm:p-6 border-b border-[#e6eee3] dark:border-slate-800 bg-[#f4f8f3] dark:bg-slate-950 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#2d4a22]/10 dark:bg-emerald-950/50 text-[#2d4a22] dark:text-emerald-400 rounded-2xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                      {t.cartTitle} • Atelier Sitedor
                    </h2>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} {t.itemsLabel} sélectionné(s)
                    </span>
                  </div>
                </div>

                {/* Stepper Navigation Indicator */}
                <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => cart.length > 0 && setCheckoutStep("idle")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${checkoutStep === 'idle' ? 'bg-[#2d4a22] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    1. Panier & Offres
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&rarr;</span>
                  <button
                    type="button"
                    onClick={() => cart.length > 0 && setCheckoutStep("form")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${checkoutStep === 'form' ? 'bg-[#2d4a22] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    2. Coordonnées
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&rarr;</span>
                  <button
                    type="button"
                    onClick={() => cart.length > 0 && shippingAddress.fullName && setCheckoutStep("payment")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${checkoutStep === 'payment' ? 'bg-[#2d4a22] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    3. Règlement
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&rarr;</span>
                  <span className={`px-3 py-1.5 rounded-xl transition-all ${checkoutStep === 'confirm' ? 'bg-[#2d4a22] text-white shadow-xs' : 'text-slate-400'}`}>
                    4. Confirmation
                  </span>
                </div>

                {/* Right Close & Action button */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer hidden sm:flex items-center gap-1.5"
                  >
                    <span>Continuer vos achats</span>
                  </button>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Body - Conditional view per step */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {checkoutStep === "confirm" ? (
                  /* Order Completed Success Screen */
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-xl mx-auto text-center py-8 space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-900/60">
                      <Check className="w-10 h-10 stroke-[2.5]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-[#2d4a22] dark:text-emerald-450 uppercase tracking-wider font-sans">{t.orderCompleted}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t.orderConfirmedMsg}</p>
                    </div>

                    <div className="bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 p-6 rounded-2xl text-left space-y-3.5 shadow-xs">
                      <div className="flex justify-between items-center border-b border-[#e2eae0] dark:border-slate-800 pb-3 text-xs font-mono">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">{t.trackingNumber} :</span>
                        <span className="text-[#2d4a22] dark:text-emerald-400 font-black text-sm underline">{orderTracking}</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350 font-medium font-sans">
                        <p>&bull; Destinataire : <strong className="text-slate-900 dark:text-white">{shippingAddress.fullName}</strong></p>
                        <p>&bull; Adresse de livraison : <strong className="text-slate-800 dark:text-slate-200">{shippingAddress.address}, {shippingAddress.city}</strong></p>
                        <p>&bull; Option Logistique : <strong className="text-slate-800 dark:text-slate-200">Transporteur Spécialisé Mobilier Sitedor</strong></p>
                      </div>
                    </div>

                    <button
                      onClick={handleFinishCheckout}
                      className="w-full max-w-sm mx-auto bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl cursor-pointer shadow-md transition-all active:scale-98"
                    >
                      {t.continueShoppingBtn}
                    </button>
                  </motion.div>

                ) : cart.length === 0 ? (
                  /* Empty Cart View */
                  <div className="text-center py-20 space-y-5 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t.emptyCart}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Votre panier ne contient aucun article pour le moment. Explorez notre catalogue pour découvrir nos créations.
                      </p>
                    </div>
                    <button 
                      onClick={() => setCartOpen(false)}
                      className="px-6 py-3 bg-[#2d4a22] hover:bg-[#1f3517] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{t.continueShoppingBtn}</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                ) : checkoutStep === "idle" ? (
                  /* STEP 1: Full-Width Cart Items & Summary Layout */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Cart Items List & Promo Chips (8 cols) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                      
                      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-sans">
                          Articles dans votre panier ({cart.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCart([])}
                          className="text-[11px] font-mono font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Vider le panier</span>
                        </button>
                      </div>

                      {/* Items Cards */}
                      <div className="space-y-4">
                        {cart.map((item, idx) => (
                          <div 
                            key={`cart-item-${item.product.id}-${idx}`} 
                            className="p-4 rounded-2xl bg-[#fbfdfa] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-2xs hover:border-[#2d4a22]/30 transition-all"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <SmartMedia 
                                src={item.product.image} 
                                alt={item.product.name}
                                containerClassName="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900" 
                              />
                              <div className="space-y-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.product.name}</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full font-mono text-slate-600 dark:text-slate-300 font-medium">
                                    <span className="w-2 h-2 rounded-full inline-block border border-black/10" style={{ backgroundColor: item.selectedColor.hex || '#2d4a22' }}></span>
                                    {item.selectedColor.name}
                                  </span>
                                  {item.selectedVariant && (
                                    <span className="text-[10px] bg-[#2d4a22]/10 dark:bg-emerald-950/40 text-[#2d4a22] dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                                      {item.selectedVariant}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-extrabold font-mono text-[#2d4a22] dark:text-emerald-400">
                                  {formatPrice(item.product.price, currency)} <span className="text-[10px] font-normal text-slate-400">/ unité</span>
                                </p>
                              </div>
                            </div>

                            {/* Quantity controls & Line total */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-850">
                              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                                <button 
                                  type="button"
                                  onClick={() => updateCartQuantity(idx, -1)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-black cursor-pointer transition-colors"
                                  title="Diminuer"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-xs px-3 text-slate-900 dark:text-white min-w-[28px] text-center">{item.quantity}</span>
                                <button 
                                  type="button"
                                  onClick={() => updateCartQuantity(idx, 1)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-black cursor-pointer transition-colors"
                                  title="Augmenter"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                                  {formatPrice(item.product.price * item.quantity, currency)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeCartItem(idx)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                                title="Supprimer cet article"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Available Promo Coupons Section */}
                      <div className="p-5 rounded-2xl bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400" />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                              Offres & Codes Promo Disponibles
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            Cliquez sur un code pour l'appliquer
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {promoCodes.map((p, pIdx) => {
                            const isApplied = activeDiscount === p.discount && appliedCodeName.includes(p.code);
                            return (
                              <button
                                key={`promo-chip-${p.code}-${pIdx}`}
                                type="button"
                                onClick={() => handleApplyPromoDirect(p)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                                  isApplied
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102"
                                    : p.status === 'active'
                                    ? "bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-400"
                                    : "bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                                }`}
                              >
                                <span>{p.code} (-{p.discount}%)</span>
                                {isApplied ? (
                                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-sans font-bold">✓ Appliqué</span>
                                ) : p.status === 'active' ? (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-bold">+ Appliquer</span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-sans">(Bientôt)</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Order Summary Card (4 cols) */}
                    <div className="lg:col-span-5 xl:col-span-4 bg-[#fcfdfb] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 p-6 rounded-3xl space-y-5 shadow-xs sticky top-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans border-b border-slate-150 dark:border-slate-800 pb-3">
                        Récapitulatif de votre commande
                      </h3>

                      {/* Promo Code Input Box */}
                      <form onSubmit={handleApplyPromo} className="space-y-2">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Saisir un code promo
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ex : WELCOME10"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none shadow-2xs"
                          />
                          <button
                            type="submit"
                            className="bg-[#2d4a22] hover:bg-[#1a2d15] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider px-4 rounded-xl cursor-pointer transition-all shadow-xs"
                          >
                            Appliquer
                          </button>
                        </div>

                        {/* Applied Code Badge */}
                        {appliedCodeName && (
                          <motion.div 
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{appliedCodeName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemovePromo}
                              className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer text-xs font-mono font-bold"
                            >
                              Retirer
                            </button>
                          </motion.div>
                        )}

                        {promoError && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{promoError}</p>
                        )}
                      </form>

                      {/* Pricing Breakdown Lines */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-150 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-300 font-medium">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Sous-total des articles :</span>
                          <span className="font-mono text-slate-900 dark:text-white font-bold text-sm">
                            {formatPrice(subtotal, currency)}
                          </span>
                        </div>

                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Réduction Code Promo ({activeDiscount}%) :</span>
                            <span className="font-mono text-sm">- {formatPrice(discountAmount, currency)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Livraison spécialisée mobilier :</span>
                          <span className="font-mono text-slate-900 dark:text-white font-bold text-sm">
                            {formatPrice(shippingCharge, currency)}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 dark:text-slate-400 italic">
                          Transport sécurisé et montage pris en charge par l'Atelier.
                        </p>

                        <div className="h-px bg-slate-200 dark:border-slate-800 my-2"></div>

                        <div className="flex justify-between items-center text-[#2d4a22] dark:text-emerald-400">
                          <span className="text-sm font-black uppercase font-sans">Total Général (TTC) :</span>
                          <span className="font-mono text-xl font-extrabold">{formatPrice(grandTotal, currency)}</span>
                        </div>
                      </div>

                      {/* Launch Checkout Button */}
                      <button
                        type="button"
                        onClick={handleLaunchCheckout}
                        className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2 select-none active:scale-98"
                      >
                        <span>Passer la commande</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ) : checkoutStep === "form" ? (
                  /* STEP 2: Full-Width Shipping Form Layout */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    
                    {/* Left Column: Shipping Details Form (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-800 pb-3">
                        <button 
                          type="button" 
                          onClick={() => setCheckoutStep("idle")} 
                          className="text-xs font-bold text-slate-500 hover:text-[#2d4a22] dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          &larr; Retour au panier
                        </button>
                        <span className="text-xs text-slate-300">/</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t.shippingAddress}</span>
                      </div>

                      <form id="checkout-shipping-form" onSubmit={handleSubmitCheckout} className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase">
                          Coordonnées & Adresse de Livraison
                        </h3>

                        <div className="space-y-3.5">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.fullName} *</label>
                            <input
                              type="text"
                              required
                              placeholder="ex : Alexandre Martin"
                              value={shippingAddress.fullName}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.shippingAddress} *</label>
                            <input
                              type="text"
                              required
                              placeholder="ex : Rue des Jardins, Abidjan Cocody"
                              value={shippingAddress.address}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.zipCode} *</label>
                              <input
                                type="text"
                                required
                                placeholder="00225"
                                value={shippingAddress.zip}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.city} *</label>
                              <input
                                type="text"
                                required
                                placeholder="Abidjan"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#2d4a22] dark:text-emerald-450">Tél de contact (Pour livraison) *</label>
                              <input
                                type="tel"
                                required
                                placeholder="ex : +225 07 00 00 00 00"
                                value={shippingAddress.phone}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
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
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-[#2d4a22] rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                      </form>
                    </div>

                    {/* Right Column: Order Recap & Submit Button (5 cols) */}
                    <div className="lg:col-span-5 bg-[#fcfdfb] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 p-6 rounded-3xl space-y-5 shadow-xs sticky top-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans border-b border-slate-150 dark:border-slate-800 pb-3">
                        Synthèse de la Commande
                      </h3>

                      {/* Items preview list */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {cart.map((item, idx) => (
                          <div key={`form-recap-${idx}`} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-850">
                            <span className="truncate max-w-[180px] font-medium text-slate-700 dark:text-slate-300">
                              {item.product.name} (x{item.quantity})
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatPrice(item.product.price * item.quantity, currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Price breakdown */}
                      <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex justify-between">
                          <span>Sous-total :</span>
                          <span className="font-mono font-bold">{formatPrice(subtotal, currency)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Code Promo (-{activeDiscount}%) :</span>
                            <span className="font-mono">- {formatPrice(discountAmount, currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Livraison :</span>
                          <span className="font-mono font-bold">{formatPrice(shippingCharge, currency)}</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:border-slate-800 my-2"></div>
                        <div className="flex justify-between text-[#2d4a22] dark:text-emerald-400 text-sm font-black uppercase">
                          <span>Total :</span>
                          <span className="font-mono text-lg font-bold">{formatPrice(grandTotal, currency)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        form="checkout-shipping-form"
                        className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2 select-none active:scale-98"
                      >
                        <span>Continuer vers le Règlement ({formatPrice(grandTotal, currency)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ) : (
                  /* STEP 3: Full-Width Manual Payment Section */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    
                    {/* Left Column: Operator selection & verification (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                        <button 
                          type="button" 
                          onClick={() => setCheckoutStep("form")} 
                          className="text-xs font-bold text-slate-500 hover:text-[#2d4a22] dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          &larr; Adresse de livraison
                        </button>
                        <span className="text-[10px] font-mono uppercase bg-[#2d4a22]/10 dark:bg-emerald-950/40 text-[#2d4a22] dark:text-emerald-400 font-extrabold px-3 py-1 rounded-full">
                          Étape 3/3 : Règlement
                        </span>
                      </div>

                      <div className="bg-[#2d4a22]/5 dark:bg-slate-950 border border-[#2d4a22]/15 dark:border-slate-800 p-4 rounded-2xl space-y-1">
                        <p className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Montant total de la commande à régler</p>
                        <p className="text-2xl font-mono font-black text-[#2d4a22] dark:text-emerald-400">
                          {formatOrderTotal(grandTotal, currency)}
                        </p>
                      </div>

                      {/* Payment method selector */}
                      <div className="space-y-2.5">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          1. Choisissez votre opérateur Mobile Money :
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => { setSelectedPaymentOp("wave"); setDepositConfirmed(false); }}
                            className={`p-3.5 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                              selectedPaymentOp === "wave"
                                ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                            <span>Wave</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setSelectedPaymentOp("orange"); setDepositConfirmed(false); }}
                            className={`p-3.5 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                              selectedPaymentOp === "orange"
                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span>Orange</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setSelectedPaymentOp("mtn"); setDepositConfirmed(false); }}
                            className={`p-3.5 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                              selectedPaymentOp === "mtn"
                                ? "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-500 text-yellow-800 dark:text-yellow-300 ring-2 ring-yellow-500/20 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                            <span>MTN</span>
                          </button>
                        </div>
                      </div>

                      {/* Operator Number Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Numéro de Dépôt {selectedPaymentOp.toUpperCase()} :
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyNumber(
                              selectedPaymentOp === "wave"
                                ? (siteConfig?.waveNumbers || "0704542909 / 0503654886")
                                : selectedPaymentOp === "orange"
                                ? (siteConfig?.orangeNumber || "0704542909")
                                : (siteConfig?.mtnNumber || "0503654886")
                            )}
                            className="text-[11px] font-mono font-bold text-[#2d4a22] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedNumberToast ? "✓ Copié !" : "Copier"}
                          </button>
                        </div>
                        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-lg font-extrabold text-[#2d4a22] dark:text-emerald-400 text-center select-all shadow-2xs">
                          {selectedPaymentOp === "wave" && (siteConfig?.waveNumbers || "0704542909 / 0503654886")}
                          {selectedPaymentOp === "orange" && (siteConfig?.orangeNumber || "0704542909")}
                          {selectedPaymentOp === "mtn" && (siteConfig?.mtnNumber || "0503654886")}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                          Effectuez manuellement votre dépôt de {formatPrice(grandTotal, currency)} sur ce numéro depuis votre téléphone portable.
                        </p>
                      </div>

                      {/* Interactive Buttons Section */}
                      <div className="space-y-3 pt-2 border-t border-slate-150 dark:border-slate-800">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          2. Confirmation du dépôt :
                        </label>

                        {/* Checkbox Button */}
                        <button
                          type="button"
                          onClick={() => setDepositConfirmed(!depositConfirmed)}
                          disabled={isValidatingTransfer}
                          className={`w-full p-4 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                            depositConfirmed
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              depositConfirmed ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            }`}>
                              {depositConfirmed && <span className="text-xs font-black">✓</span>}
                            </div>
                            <span className="font-bold text-xs">Avez-vous effectué le dépôt ?</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {depositConfirmed ? "Confirmé ✓" : "Cliquer pour cocher"}
                          </span>
                        </button>

                        {/* Validation Progress Bar */}
                        {isValidatingTransfer && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-emerald-50/80 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2 text-left"
                          >
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#2d4a22] dark:text-emerald-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Vérification du transfert en cours...
                              </span>
                              <span>{Math.round(validationProgress)}%</span>
                            </div>

                            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-emerald-200 dark:border-emerald-900">
                              <motion.div
                                className="h-full bg-gradient-to-r from-[#2d4a22] to-emerald-500 rounded-full"
                                style={{ width: `${validationProgress}%` }}
                                transition={{ ease: "linear" }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              <span>Validation automatique dans :</span>
                              <span className="font-bold text-[#2d4a22] dark:text-emerald-400">{validationSecondsLeft} secondes</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Visa Card Modal Trigger */}
                        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.phone) {
                                setCheckoutStep("form");
                                alert("Veuillez d'abord renseigner vos coordonnées de livraison avant de procéder au paiement par Carte Visa.");
                                return;
                              }
                              setIsVisaModalOpen(true);
                            }}
                            className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-750 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                          >
                            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Paiement alternatif via Carte Visa</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Order Summary & Action (5 cols) */}
                    <div className="lg:col-span-5 bg-[#fcfdfb] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 p-6 rounded-3xl space-y-5 shadow-xs sticky top-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans border-b border-slate-150 dark:border-slate-800 pb-3">
                        Synthèse Finale
                      </h3>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex justify-between">
                          <span>Client :</span>
                          <span className="font-bold text-slate-900 dark:text-white">{shippingAddress.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Livraison :</span>
                          <span className="font-bold text-slate-900 dark:text-white">{shippingAddress.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mode choisi :</span>
                          <span className="font-bold text-[#2d4a22] dark:text-emerald-400 uppercase">{selectedPaymentOp} Mobile Money</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:border-slate-800 my-2"></div>
                        <div className="flex justify-between text-[#2d4a22] dark:text-emerald-400 text-sm font-black uppercase">
                          <span>Montant Total :</span>
                          <span className="font-mono text-xl font-black">{formatPrice(grandTotal, currency)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!depositConfirmed || isValidatingTransfer}
                        onClick={() => {
                          if (!depositConfirmed) {
                            alert("Veuillez d'abord cocher 'Avez-vous effectué le dépôt ?' pour continuer.");
                            return;
                          }
                          setIsValidatingTransfer(true);
                        }}
                        className={`w-full py-4 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 select-none ${
                          !depositConfirmed || isValidatingTransfer
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            : "bg-[#2d4a22] hover:bg-[#1a2d15] text-white cursor-pointer active:scale-98"
                        }`}
                      >
                        <span>Valider le transfert ({formatPrice(grandTotal, currency)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Centered Modal Windows (Minimalist pop-up containing user information & purchases list) */}
      <AnimatePresence>
        {userDropdownOpen && user && (
          <div key="user-profile-modal-root" className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
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
                    {user.displayName || "Client Sitedor"}
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
                
                <div className="max-h-44 overflow-y-auto space-y-2.5 pr-1.5 text-left">
                  {myOrders.map((ord: any, idx: number) => (
                    <div key={`ord-${ord.id || ''}-${idx}`} className="bg-slate-50/50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-[#e6eee3] dark:border-slate-850 text-xs">
                      <div className="flex justify-between font-mono font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{t.orderCode} : {ord.id}</span>
                        <span className="text-[#2d4a22] dark:text-emerald-450 font-black">{formatOrderTotal(ord.total, currency)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 pb-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                        <span>{t.deliveredTo} {ord.city}</span>
                        <span>{ord.items?.length || 1} {t.itemsLabel}</span>
                      </div>
                      {/* Nested ordered items listing */}
                      <div className="mt-2 space-y-1">
                        {ord.items?.map((it: any, k: number) => (
                          <div key={`ord-${ord.id || idx}-item-${k}`} className="flex justify-between text-[10px] text-slate-400 dark:text-slate-400 italic font-medium font-sans">
                            <span>&bull; {it.quantity}x {it.name} ({it.selectedColor?.name || ""})</span>
                            <span className="font-mono">{formatOrderTotal(it.price, currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {myOrders.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-950/10">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-sans">{t.noOrdersYet}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Bespoke Inquiries list (Configuration Intelligente) */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#2d4a22] dark:text-emerald-450" /> 
                    Commandes Sur-Mesure ({myBespokeRequests.length})
                  </h5>
                  <span className="text-[8px] font-mono bg-[#2d4a22]/10 dark:bg-emerald-950/80 text-[#2d4a22] dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-[#2d4a22]/20">
                    Simulateur Orris
                  </span>
                </div>

                {/* Reassurance & Trust message for custom creations */}
                <div className="bg-[#2d4a22]/5 dark:bg-[#2d4a22]/15 p-3 rounded-xl border border-[#2d4a22]/20 dark:border-emerald-500/20 text-left space-y-1">
                  <p className="text-[11px] font-extrabold text-[#2d4a22] dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400 flex-shrink-0" />
                    <span>Engagement & Confiance Atelier</span>
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    Vos demandes personnalisées sont directement prises en charge par nos maîtres d'œuvre. Un devis et une étude de faisabilité vous seront transmis sous 24h.
                  </p>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-left">
                  {myBespokeRequests.map((req: any, idx: number) => (
                    <div key={`req-${req.id || ''}-${idx}`} className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-[#e6eee3] dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-center font-mono font-bold">
                        <span className="text-slate-900 dark:text-slate-100">{req.id}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-extrabold">
                          {req.status || "En traitement"}
                        </span>
                      </div>
                      
                      {/* Essential details only */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-600 dark:text-slate-300 font-sans">
                        <div><strong className="text-slate-500 dark:text-slate-400">Type :</strong> {req.category || "Meuble sur-mesure"}</div>
                        <div><strong className="text-slate-500 dark:text-slate-400">Délai :</strong> {req.desiredDelay || "Immédiat"}</div>
                        {req.estimatedBudget && (
                          <div className="col-span-2 font-mono text-[#2d4a22] dark:text-emerald-400 font-bold">
                            Prix désigné : {formatBespokePrice(req.estimatedBudget, currency)}
                          </div>
                        )}
                        {req.city && (
                          <div className="col-span-2 text-slate-400 dark:text-slate-400 text-[9px]">
                            Destination : {req.city}, {req.country || ""}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {myBespokeRequests.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-950/20 space-y-2">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">Aucune commande sur-mesure enregistrée pour le moment.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleScrollToId("interactive-model-sandbox");
                        }}
                        className="text-[10px] text-[#2d4a22] dark:text-emerald-400 font-bold underline hover:no-underline cursor-pointer"
                      >
                        Créer une configuration au simulateur &rarr;
                      </button>
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
          <div key="settings-modal-root" className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
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
                        key={`lang-opt-${la}`}
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
                        key={`curr-opt-${cur}`}
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
      </AnimatePresence>

        {/* GOOGLE AUTHENTICATION ERROR & VERCEL ACCESS RECOVERY MODAL */}
        {googleAuthError && (
          <div key="auth-error-modal-root" className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setGoogleAuthError(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 border border-rose-105 dark:border-rose-950/30 rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full z-10 text-left space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 dark:bg-rose-955 text-rose-600 dark:text-rose-450 rounded-xl">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-sans font-extrabold text-[#991b1b] dark:text-rose-450 tracking-tight text-sm">
                      Configuration Firebase Requise (Vercel)
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Erreur de Connexion Détectée</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleAuthError(null)}
                  className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 cursor-pointer text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-mono text-slate-700 dark:text-slate-350 select-text leading-relaxed break-words">
                {googleAuthError}
              </div>

              <div className="space-y-3.5 pt-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Comment résoudre ce problème une fois en ligne sur Vercel ?
                </p>
                <ol className="text-xs text-slate-655 dark:text-slate-350 space-y-2.5 list-decimal pl-4">
                  <li>
                    Rendez-vous sur votre <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#2d4a22] hover:underline font-extrabold">Console Firebase</a> et ouvrez votre projet.
                  </li>
                  <li>
                    Allez dans la section <strong>Authentication</strong> (dans le menu latéral gauche), puis cliquez sur l'onglet <strong>Settings</strong> (Paramètres / Configuration).
                  </li>
                  <li>
                    Faites défiler jusqu'à la section <strong>Domaines Autorisés</strong> (Authorized domains) et cliquez sur <strong>"Ajouter un domaine"</strong>.
                  </li>
                  <li>
                    Entrez le nom de domaine complet correspondant à votre site Vercel (par exemple : <code>votre-projet.vercel.app</code>) et validez.
                  </li>
                  <li>
                    <strong>Alternative Immédiate :</strong> Vous pouvez accéder de suite à la console d'administration en saisissant le code d'accès secret à l'Atelier (<strong>1234</strong> ou <strong>nexus-admin-99</strong>) sur l'écran d'administration !
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setGoogleAuthError(null)}
                  className="px-5 py-2.5 bg-[#2d4a22] hover:bg-[#1f3318] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  J'ai compris
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CUSTOM REVIEW WRITING MODAL OVERLAY */}
        {reviewFormOpen && (
          <div key="review-form-modal-root" className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
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
                        key={`star-rating-${s}`}
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
                      const newReviewObj = {
                        id: docId,
                        userName: trimmedName || "Client Sitedor",
                        userId: user?.uid || "anonymous",
                        userAvatar: user?.photoURL || "",
                        rating: reviewRating,
                        comment: trimmedComment,
                        dateStr: "Aujourd'hui",
                      };

                      // Save locally first for instant persistence
                      try {
                        const existing = localStorage.getItem("sitedor_reviews_cache");
                        let list = existing ? JSON.parse(existing) : [];
                        list = [newReviewObj, ...list];
                        localStorage.setItem("sitedor_reviews_cache", JSON.stringify(list));
                        window.dispatchEvent(new Event("sitedor_reviews_updated"));
                      } catch (e) {}

                      await addDoc(collection(db, "reviews"), {
                        id: docId,
                        userName: trimmedName || "Client Sitedor",
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
                      }, 2000);

                    } catch (e: any) {
                      console.error("Failed to commit user review to Firestore:", e);
                      setReviewNotif("Avis enregistré localement et publié !");
                      setTimeout(() => {
                        setReviewFormOpen(false);
                      }, 2000);
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

        {/* Visa Card Payment Modal Window */}
        {isVisaModalOpen && (
          <div key="visa-payment-modal-root" className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVisaModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-6 md:p-8 max-w-md w-full z-10 text-left space-y-5 select-text"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-[#2d4a22] dark:text-emerald-400 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase font-sans">
                      Paiement par Carte Visa
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Règlement direct via le service WhatsApp
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVisaModalOpen(false)}
                  className="p-1 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 text-sm font-bold rounded-lg cursor-pointer transition-all"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                <div className="p-4 bg-[#f8faf7] dark:bg-slate-950 border border-[#2d4a22]/20 dark:border-slate-800 rounded-2xl space-y-2 text-left font-sans shadow-xs">
                  <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                    <span>Sous-total articles :</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-150">{formatPrice(subtotal, currency)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Remise promo ({activeDiscount}%) :</span>
                      <span className="font-mono font-bold">- {formatPrice(discountAmount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                    <span>Frais de livraison :</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-150">{formatPrice(shippingCharge, currency)}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Total à régler (Visa) :</span>
                    <span className="text-lg font-mono font-black text-[#2d4a22] dark:text-emerald-400">
                      {formatPrice(grandTotal, currency)}
                    </span>
                  </div>
                </div>

                <p>
                  Pour terminer votre achat par <strong>Carte Visa</strong>, vous allez être directement mis en relation avec le service d'encaissement de l'Atelier sur WhatsApp au numéro :
                </p>

                <div className="p-3 bg-[#2d4a22]/10 dark:bg-emerald-950/40 border border-[#2d4a22]/20 dark:border-emerald-800/50 rounded-xl font-mono text-center text-sm font-black text-[#2d4a22] dark:text-emerald-300">
                  {siteConfig?.visaWhatsAppNumber || "0704542909"}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Un conseiller validera l'opération Carte Visa et enregistrera votre commande en temps réel.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.phone) {
                      setIsVisaModalOpen(false);
                      setCheckoutStep("form");
                      alert("Veuillez d'abord renseigner vos coordonnées de livraison.");
                      return;
                    }

                    const cartSnapshot = [...cart];
                    const newOrderId = await executeFinalOrderSubmission("Carte Visa (WhatsApp)");
                    
                    if (newOrderId) {
                      const phoneNum = siteConfig?.visaWhatsAppNumber || "0704542909";
                      const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
                      const targetPhone = cleanPhone.startsWith("225") ? cleanPhone : `225${cleanPhone}`;
                      const itemsSummary = cartSnapshot.map(i => `${i.product.name} (x${i.quantity})`).join(", ");
                      
                      const textMsg = `Bonjour Sitedor, je souhaite régler ma commande N° ${newOrderId} d'un montant de ${formatPrice(grandTotal, currency)} par Carte Visa.\n` +
                                      `• Client: ${shippingAddress.fullName}\n` +
                                      `• Téléphone: ${shippingAddress.phone}\n` +
                                      (itemsSummary ? `• Articles: ${itemsSummary}` : "");
                                      
                      const waMsg = encodeURIComponent(textMsg);
                      window.open(`https://wa.me/${targetPhone}?text=${waMsg}`, "_blank");
                    }
                    
                    setIsVisaModalOpen(false);
                  }}
                  className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2 select-none"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Valider l'action & Payer sur WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVisaModalOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Special Product View: Cadre Entier avec Détails & Ajouter au Panier */}
        {selectedAffiliateProduct && (
          <div key="affiliate-product-modal-root" className="fixed inset-0 z-50 overflow-y-auto bg-[#fafcf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8 animate-fadeIn">
            <div className="max-w-5xl mx-auto space-y-6 text-left py-4">
              
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 px-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelectedAffiliateProduct(null)}
                  className="text-xs font-extrabold text-[#2d4a22] dark:text-emerald-400 hover:underline flex items-center gap-2 cursor-pointer"
                >
                  <span>&larr; Retour au catalogue</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-[#2d4a22] dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Page Spéciale Produit Affilié
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAffiliateProduct(null)}
                    className="p-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl cursor-pointer transition-all"
                  >
                    &times; Fermer
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800">
                  <div className="relative rounded-3xl overflow-hidden shadow-md h-80 md:h-[420px] w-full bg-slate-200 dark:bg-slate-900">
                    <ProductMediaGallery
                      image={selectedAffiliateProduct.image}
                      image2={selectedAffiliateProduct.image2}
                      alt={selectedAffiliateProduct.name}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                    
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      {selectedAffiliateProduct.category}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 bg-emerald-600 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      {selectedAffiliateProduct.stock > 0 ? `${selectedAffiliateProduct.stock} en stock` : "Épuisé"}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <ShieldCheck className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400 mx-auto" />
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 block">Garantie 5 ans</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <Truck className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400 mx-auto" />
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 block">Livraison offerte</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <Award className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400 mx-auto" />
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 block">Qualité Premium</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 p-6 md:p-10 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    
                    <div className="inline-flex items-center justify-between w-full bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          Code Produit : <strong className="text-[#2d4a22] dark:text-emerald-400 font-extrabold">{selectedAffiliateProduct.affiliateCode || selectedAffiliateProduct.id}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedAffiliateProduct.affiliateCode || selectedAffiliateProduct.id);
                          setCopiedNotice("Copié !");
                          setTimeout(() => setCopiedNotice(null), 2000);
                        }}
                        className="text-[10px] font-mono font-bold bg-[#2d4a22] text-white hover:bg-[#1a2d15] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        {copiedNotice || "Copier le code"}
                      </button>
                    </div>

                    <div>
                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {selectedAffiliateProduct.name}
                      </h1>
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
                        {selectedAffiliateProduct.tagline}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-extrabold block">Tarif Exclusif</span>
                        <span className="text-2xl font-mono font-black text-[#2d4a22] dark:text-emerald-400">
                          {formatPrice(selectedAffiliateProduct.price, currency)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full">
                        Produit vérifié
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {selectedAffiliateProduct.description}
                    </p>

                    {selectedAffiliateProduct.features && selectedAffiliateProduct.features.length > 0 && (
                      <div className="space-y-2 bg-[#2d4a22]/5 dark:bg-[#2d4a22]/10 p-4 rounded-2xl border border-dashed border-[#2d4a22]/20">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#2d4a22] dark:text-[#84a98c] block">
                          Caractéristiques & Finitions :
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedAffiliateProduct.features.map((feat, idx) => (
                            <div key={`aff-feat-${idx}`} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <span className="text-[#2d4a22] dark:text-[#84a98c] font-bold">•</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAffiliateProduct.colors && selectedAffiliateProduct.colors.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Coloris disponible :
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedAffiliateProduct.colors.map((color, idx) => {
                            const isSelected = affiliateSelectedColor?.hex === color.hex;
                            return (
                              <button
                                key={`aff-col-${color.hex || idx}-${idx}`}
                                type="button"
                                onClick={() => setAffiliateSelectedColor(color)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#2d4a22] text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: color.hex }}></span>
                                <span>{color.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedAffiliateProduct.variants && selectedAffiliateProduct.variants.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {selectedAffiliateProduct.variantsLabel || "Option / Finition"} :
                        </span>
                        <select
                          value={affiliateSelectedVariant}
                          onChange={(e) => setAffiliateSelectedVariant(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 p-3 rounded-xl outline-none focus:border-[#2d4a22]"
                        >
                          {selectedAffiliateProduct.variants.map((v, idx) => (
                            <option key={`aff-var-${v}-${idx}`} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Quantité :</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAffiliateProductQty(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-extrabold text-sm w-6 text-center">{affiliateProductQty}</span>
                        <button
                          type="button"
                          onClick={() => setAffiliateProductQty(prev => Math.min(selectedAffiliateProduct.stock, prev + 1))}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 space-y-3">
                    <motion.button
                      type="button"
                      disabled={selectedAffiliateProduct.stock === 0}
                      onClick={() => handleAddToCartFromAffiliateView(selectedAffiliateProduct)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      className="w-full bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-extrabold text-xs md:text-sm uppercase tracking-widest py-4.5 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all text-center flex items-center justify-center gap-3"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Ajouter au panier ({formatPrice(selectedAffiliateProduct.price * affiliateProductQty, currency)})</span>
                    </motion.button>
                  </div>

                </div>
              </div>
            </div>
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

        {/* ANIMATED CART TOAST POPUP NOTIFICATION BAR */}
        <AnimatePresence>
          {cartToast && (
            <motion.div
              key={cartToast.id}
              initial={{ opacity: 0, y: 60, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] max-w-md w-[92%] sm:w-auto bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white p-3.5 px-5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-4 font-sans select-none overflow-hidden"
            >
              <div className="flex items-center gap-3">
                {/* Visual Icon / Thumbnail with Badge */}
                <div className="relative flex-shrink-0">
                  {cartToast.productImage && cartToast.productImage.length > 7 ? (
                    <img 
                      src={cartToast.productImage} 
                      alt={cartToast.productName} 
                      className="w-10 h-10 object-cover rounded-xl border border-slate-700 bg-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-emerald-500 rounded-full items-center justify-center text-[9px] font-bold text-slate-950 shadow-sm">
                    ✓
                  </span>
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white tracking-tight">
                      {lang === 'en' ? "Added to Cart!" : lang === 'es' ? "¡Añadido al Carrito!" : lang === 'ar' ? "تمت الإضافة إلى السلة!" : "Ajouté au panier !"}
                    </p>
                    {cartToast.quantity > 1 && (
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                        x{cartToast.quantity}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 truncate max-w-[170px] sm:max-w-[210px]">
                    {cartToast.productName} {cartToast.colorName ? `• ${cartToast.colorName}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCartToast(null);
                    setCartOpen(true);
                  }}
                  className="bg-[#2d4a22] hover:bg-[#1f3517] text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? "View" : lang === 'es' ? "Ver" : lang === 'ar' ? "عرض" : "Voir"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCartToast(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Animated linear progress countdown bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3.8, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-[#2d4a22] opacity-80"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assistive Touch Quick-Action Floating Widget (iOS style with vertical drag) */}
        <AssistiveTouchWidget 
          isAdmin={user?.email === "grasdvirus@gmail.com"}
          onOpenAdmin={() => setActiveTab("admin")} 
          onRefreshSite={() => {
            window.location.reload();
          }}
          onApplyPromoCode={(code) => {
            const found = promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase() && p.status === "active");
            if (found) {
              setActiveDiscount(found.discount);
              setAppliedCodeName(found.code);
              return true;
            }
            return false;
          }}
          onSearchProduct={(query) => {
            setActiveTab("catalog");
            setAffiliateSearchCode(query);
          }}
          adminEmail="devcristan3@gmail.com"
          adminPhone="+225 07 04 54 29 09"
          userGoogleEmail="grasdvirus@gmail.com"
        />

    </div>
  );
}
