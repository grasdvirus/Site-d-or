import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Plus, Trash2, Edit2, Check, X, Tag, Layers, Coins, ChevronDown, ChevronUp, Image as ImageIcon, Sliders, CheckCircle2, AlertTriangle, Hammer, ShieldCheck, Box, UserCheck, Settings, HelpCircle, FileText, Globe, Mail, Send, Inbox, RefreshCw, BarChart3, TrendingUp } from "lucide-react";
import { Product, PromoCode } from "../types";
import { generateAffiliateCode } from "../data";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { formatPrice, formatOrderTotal, formatBespokePrice } from "../translations";
import AnalyticsD3Dashboard from "./AnalyticsD3Dashboard";

interface AdminPortalProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  categories: string[];
  onCategoriesChange: (cats: string[]) => void;
  orders?: any[];
  onDeleteOrder?: (orderId: string) => void;
  customOptions?: Record<string, { label: string; values: string[] }[]>;
  onSaveCustomOptions?: (newMap: Record<string, { label: string; values: string[] }[]>) => void;
  onSaveSiteConfig?: (newConfig: any) => void;
  promoCodes?: PromoCode[];
  onAddPromoCode: (promo: PromoCode) => Promise<void>;
  onDeletePromoCode: (code: string) => Promise<void>;
}

export default function AdminPortal({ 
  products, 
  onAddProduct, 
  onUpdateProduct,
  onDeleteProduct, 
  currentUser, 
  onGoogleLogin,
  categories,
  onCategoriesChange,
  orders = [],
  onDeleteOrder,
  customOptions = {},
  onSaveCustomOptions,
  onSaveSiteConfig,
  promoCodes = [],
  onAddPromoCode,
  onDeletePromoCode
}: AdminPortalProps) {
  // Authentication state
  const [localAuthenticated, setLocalAuthenticated] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState<{to: string, subject: string, body: string} | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // Product requests (bespoke simulator requests)
  const [productRequests, setProductRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<any | null>(null);
  
  // Product edition / creation form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    "Conception artisanale Sitedor exclusive",
    "Garantie constructeur prolongée incluse"
  ]);

  const [notifMessage, setNotifMessage] = useState("");

  const handleStartEditProduct = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setTagline(p.tagline || "");
    setDescription(p.description || "");
    const priceCFA = Math.round(p.price * 655.957);
    setPrice(String(priceCFA));
    setStock(String(p.stock || 5));
    setCategory(p.category);
    setImage(p.image);
    setColorsList(p.colors || []);
    setVariantsLabel(p.variantsLabel || "Taille");
    setVariantsList(p.variants || []);
    setFeaturesList(p.features || []);

    const formEl = document.getElementById("admin-product-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setName("");
    setTagline("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory(categories[0] || "");
    setImage("");
    setColorsList([
      { name: "Vert Signature", hex: "#2d4a22" },
      { name: "Orange Terre Cuite", hex: "#c2410c" }
    ]);
    setVariantsLabel("Taille");
    setVariantsList(["Standard Edition"]);
    setFeaturesList([
      "Conception artisanale Sitedor exclusive",
      "Garantie constructeur prolongée incluse"
    ]);
  };

  // Site dynamic configuration editing states
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "catalog" | "site_config" | "categories" | "orders" | "bespoke" | "custom_options" | "action_buttons">("analytics");
  
  // Custom Options customizer states in AdminPortal
  const [targetCustomProductId, setTargetCustomProductId] = useState<string>("");
  const [customOptionLabel, setCustomOptionLabel] = useState<string>("");
  const [customOptionValuesText, setCustomOptionValuesText] = useState<string>("");
  const [localCustomOptions, setLocalCustomOptions] = useState<Record<string, { label: string; values: string[] }[]>>({});
  const [isSavingCustomOptions, setIsSavingCustomOptions] = useState(false);

  useEffect(() => {
    if (customOptions) {
      setLocalCustomOptions(customOptions);
    }
  }, [customOptions]);

  // Handle default selected target custom product ID
  useEffect(() => {
    if (products && products.length > 0 && !targetCustomProductId) {
      setTargetCustomProductId(products[0].id);
    }
  }, [products, targetCustomProductId]);

  const handleAddCustomOption = () => {
    if (!customOptionLabel.trim()) {
      alert("Veuillez indiquer le nom de la caractéristique (ex : Taille).");
      return;
    }
    const rawValues = customOptionValuesText
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    // Auto-append the manual override option if not already present
    if (!rawValues.some(v => v.includes("Saisir manuellement"))) {
      rawValues.push("Autre (Saisir manuellement)...");
    }

    const newOption = {
      label: customOptionLabel.trim(),
      values: rawValues,
    };

    const targetKey = targetCustomProductId || "custom_special_atelier";
    const currentOptions = localCustomOptions[targetKey] || [];

    setLocalCustomOptions((prev) => ({
      ...prev,
      [targetKey]: [...currentOptions, newOption],
    }));

    setCustomOptionLabel("");
    setCustomOptionValuesText("");
    setNotifMessage(`Caractéristique "${newOption.label}" ajoutée au brouillon.`);
    setTimeout(() => setNotifMessage(""), 3000);
  };

  const handleRemoveCustomOption = (prodId: string, idxToRemove: number) => {
    const currentOptions = localCustomOptions[prodId] || [];
    const updated = currentOptions.filter((_, idx) => idx !== idxToRemove);
    setLocalCustomOptions((prev) => ({
      ...prev,
      [prodId]: updated,
    }));
  };

  const handleSaveProductCustomOptions = async () => {
    if (!onSaveCustomOptions) return;
    try {
      setIsSavingCustomOptions(true);
      await onSaveCustomOptions(localCustomOptions);
      setNotifMessage("Finitons et options de personnalisation sauvegardées avec succès !");
      setTimeout(() => setNotifMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save custom product options in Firestore:", err);
      alert("Erreur lors de l'enregistrement des options en base.");
    } finally {
      setIsSavingCustomOptions(false);
    }
  };

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [footerAbout, setFooterAbout] = useState("");
  const [footerContact, setFooterContact] = useState("");
  const [footerWarranty, setFooterWarranty] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [heroDesc, setHeroDesc] = useState("");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  // Payment Numbers configuration states
  const [waveNumbers, setWaveNumbers] = useState("0704542909 / 0503654886");
  const [orangeNumber, setOrangeNumber] = useState("0704542909");
  const [mtnNumber, setMtnNumber] = useState("0503654886");
  const [visaWhatsAppNumber, setVisaWhatsAppNumber] = useState("0704542909");

  // Action Buttons states
  const [btnCta1Text, setBtnCta1Text] = useState("Découvrir la Collection");
  const [btnCta1TextEn, setBtnCta1TextEn] = useState("Discover the Collection");
  const [btnCta1Target, setBtnCta1Target] = useState("pricing-plans");
  const [btnCta1Style, setBtnCta1Style] = useState("primary");
  const [btnCta1Active, setBtnCta1Active] = useState(true);

  const [btnCta2Text, setBtnCta2Text] = useState("Configurer à l'Atelier");
  const [btnCta2TextEn, setBtnCta2TextEn] = useState("Start Customizing");
  const [btnCta2Target, setBtnCta2Target] = useState("interactive-model-sandbox");
  const [btnCta2Style, setBtnCta2Style] = useState("outline");
  const [btnCta2Active, setBtnCta2Active] = useState(true);

  const [btnCta3Text, setBtnCta3Text] = useState("Envoyer ma demande");
  const [btnCta3TextEn, setBtnCta3TextEn] = useState("Submit Custom Request");
  const [btnCta3Active, setBtnCta3Active] = useState(true);

  const [btnCta4Text, setBtnCta4Text] = useState("Demander une création");
  const [btnCta4TextEn, setBtnCta4TextEn] = useState("Request Free Bespoke");
  const [btnCta4Active, setBtnCta4Active] = useState(true);

  // FAQ input state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // New Category creator state
  const [newCategoryName, setNewCategoryName] = useState("");

  // New Promo Code creator state
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");
  const [newPromoDescription, setNewPromoDescription] = useState("");
  const [newPromoStatus, setNewPromoStatus] = useState<"active" | "planned">("active");
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [deletingPromoCode, setDeletingPromoCode] = useState<string | null>(null);
  const [confirmDeletePromoCode, setConfirmDeletePromoCode] = useState<string | null>(null);

  // Local image upload dragging state
  const [imageDragging, setImageDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Saving and deleting spinner states
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState<string>("");
  const [isSavingConfigs, setIsSavingConfigs] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);

  // Auto-init active category to the first available category if none is set
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Read config state on mount with hybrid localStorage fallback
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Hydrate from localStorage first for instant rendering feedback
        const localCopy = localStorage.getItem("site_config_general");
        if (localCopy) {
          try {
            const data = JSON.parse(localCopy);
            setFooterAbout(data.footerAbout || "");
            setFooterContact(data.footerContact || "");
            setFooterWarranty(data.footerWarranty || "");
            setHeroTitle(data.heroTitle || "");
            setHeroSub(data.heroSub || "");
            setHeroDesc(data.heroDesc || "");
            if (data.faqs) setFaqs(data.faqs);

            setWaveNumbers(data.waveNumbers || "0704542909 / 0503654886");
            setOrangeNumber(data.orangeNumber || "0704542909");
            setMtnNumber(data.mtnNumber || "0503654886");
            setVisaWhatsAppNumber(data.visaWhatsAppNumber || "0704542909");

            setBtnCta1Text(data.btnCta1Text ?? "Découvrir la Collection");
            setBtnCta1TextEn(data.btnCta1TextEn ?? "Discover the Collection");
            setBtnCta1Target(data.btnCta1Target ?? "pricing-plans");
            setBtnCta1Style(data.btnCta1Style ?? "primary");
            setBtnCta1Active(data.btnCta1Active ?? true);

            setBtnCta2Text(data.btnCta2Text ?? "Configurer à l'Atelier");
            setBtnCta2TextEn(data.btnCta2TextEn ?? "Start Customizing");
            setBtnCta2Target(data.btnCta2Target ?? "interactive-model-sandbox");
            setBtnCta2Style(data.btnCta2Style ?? "outline");
            setBtnCta2Active(data.btnCta2Active ?? true);

            setBtnCta3Text(data.btnCta3Text ?? "Envoyer ma demande");
            setBtnCta3TextEn(data.btnCta3TextEn ?? "Submit Custom Request");
            setBtnCta3Active(data.btnCta3Active ?? true);

            setBtnCta4Text(data.btnCta4Text ?? "Demander une création");
            setBtnCta4TextEn(data.btnCta4TextEn ?? "Request Free Bespoke");
            setBtnCta4Active(data.btnCta4Active ?? true);
          } catch (e) {
            console.warn("Stale config in local storage:", e);
          }
        }

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
          } else if (data.faq) {
            setFaqs(data.faq);
          }

          setWaveNumbers(data.waveNumbers || "0704542909 / 0503654886");
          setOrangeNumber(data.orangeNumber || "0704542909");
          setMtnNumber(data.mtnNumber || "0503654886");
          setVisaWhatsAppNumber(data.visaWhatsAppNumber || "0704542909");

          setBtnCta1Text(data.btnCta1Text ?? "Découvrir la Collection");
          setBtnCta1TextEn(data.btnCta1TextEn ?? "Discover the Collection");
          setBtnCta1Target(data.btnCta1Target ?? "pricing-plans");
          setBtnCta1Style(data.btnCta1Style ?? "primary");
          setBtnCta1Active(data.btnCta1Active ?? true);

          setBtnCta2Text(data.btnCta2Text ?? "Configurer à l'Atelier");
          setBtnCta2TextEn(data.btnCta2TextEn ?? "Start Customizing");
          setBtnCta2Target(data.btnCta2Target ?? "interactive-model-sandbox");
          setBtnCta2Style(data.btnCta2Style ?? "outline");
          setBtnCta2Active(data.btnCta2Active ?? true);

          setBtnCta3Text(data.btnCta3Text ?? "Envoyer ma demande");
          setBtnCta3TextEn(data.btnCta3TextEn ?? "Submit Custom Request");
          setBtnCta3Active(data.btnCta3Active ?? true);

          setBtnCta4Text(data.btnCta4Text ?? "Demander une création");
          setBtnCta4TextEn(data.btnCta4TextEn ?? "Request Free Bespoke");
          setBtnCta4Active(data.btnCta4Active ?? true);

          // Sync back to localStorage
          localStorage.setItem("site_config_general", JSON.stringify(data));
        } else if (!localCopy) {
          // Default fallbacks matching beautiful design values of the atelier
          setFooterAbout("Sitedor est un atelier artisanal d'exception engagé dans la création de mobilier haut de gamme éco-responsable. Chaque pièce allie lignes sculpturées et confort absolu.");
          setFooterContact("Atelier Central : Rue des Artisans d'Art, Zone Éco-Sitedor • Écrivez-nous : contact@sitedor.com • Service Client : +225 07 48 59 10 20");
          setFooterWarranty("Garantie Constructeur Prolongée de 5 Ans • Service de Livraison & d'Installation Offert partout à Abidjan.");
          setHeroTitle("L'Atelier d'Artisanat d'Art d'Exception.");
          setHeroSub("DESIGN RAFFINÉ & ACCENTS NATURELS");
          setHeroDesc("Découvrez des pièces uniques façonnées à la main par nos maîtres ébénistes. Une harmonie parfaite entre design contemporain épuré, matériaux durables nobles et confort d'assise incomparable.");
          setFaqs([
            { question: "Où sont fabriquées vos créations ?", answer: "Toutes nos pièces de mobilier sont dessinées et fabriquées à la main avec passion dans nos ateliers par des artisans d'art hautement qualifiés." },
            { question: "Quels sont vos délais moyens de livraison ?", answer: "Chaque commande étant personnalisée, comptez un délai moyen de fabrication et de livraison de 5 à 10 jours ouvrés pour Abidjan et 2000 F CFA fixes." }
          ]);
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || err || "").toLowerCase();
        if (errorMsg.includes("offline") || errorMsg.includes("failed to get document") || errorMsg.includes("network")) {
          console.warn("Firestore offline - global Admin configuration fallback applied:", err);
        } else {
          console.error("Firestore loading error:", err);
        }
      }
    };
    fetchConfig();
  }, []);

  // Synchroniser les demandes sur-mesure (product_requests)
  useEffect(() => {
    const isAdminUser = currentUser?.email === "grasdvirus@gmail.com" || localAuthenticated;
    if (!isAdminUser || (activeSubTab !== "bespoke" && activeSubTab !== "analytics")) {
      return;
    }
    const fetchRequests = async () => {
      try {
        setIsLoadingRequests(true);
        const { getDocs, collection, query } = await import("firebase/firestore");
        const q = query(collection(db, "product_requests"));
        const snap = await getDocs(q);
        const fetched: any[] = [];
        snap.forEach((docSnap) => {
          fetched.push({ ...docSnap.data(), id: docSnap.id });
        });
        
        // Merge local backup requests if present
        try {
          const localReqs = JSON.parse(localStorage.getItem("nexus_local_product_requests") || "[]");
          localReqs.forEach((lr: any) => {
            if (!fetched.some((f: any) => f.id === lr.id)) {
              fetched.push(lr);
            }
          });
        } catch (e) {
          console.warn("Error reading local backup in admin:", e);
        }

        // Exclude blacklisted deleted IDs
        const deletedIds: string[] = JSON.parse(localStorage.getItem("nexus_deleted_product_request_ids") || "[]");
        const filtered = fetched.filter((item: any) => !deletedIds.includes(item.id));

        // Trier par date décroissante (les plus récents en premier)
        filtered.sort((a, b) => {
          const timeA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const timeB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return timeB - timeA;
        });
        setProductRequests(filtered);
      } catch (err) {
        console.error("Failed to fetch product_requests:", err);
      } finally {
        setIsLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [currentUser, localAuthenticated, activeSubTab]);

  const handleToggleRequestViewed = async (req: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const nextViewed = !req.viewed;
      const nextStatus = nextViewed ? "Vue" : "En attente d'attribution";
      await updateDoc(doc(db, "product_requests", req.id), {
        viewed: nextViewed,
        status: nextStatus
      });
      setProductRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, viewed: nextViewed, status: nextStatus }
            : r
        )
      );
      if (selectedRequest?.id === req.id) {
        setSelectedRequest((prev: any) => prev ? { ...prev, viewed: nextViewed, status: nextStatus } : null);
      }
    } catch (err) {
      console.error("Failed to toggle viewed status:", err);
    }
  };

  const handleOpenRequest = async (req: any) => {
    setSelectedRequest(req);
    // Auto-mark as viewed if not already marked
    if (!req.viewed) {
      try {
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "product_requests", req.id), {
          viewed: true,
          status: "Vue"
        });
        setProductRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? { ...r, viewed: true, status: "Vue" }
              : r
          )
        );
      } catch (err) {
        console.error("Failed to auto-mark as viewed:", err);
      }
    }
  };

  const triggerDeleteRequest = (req: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRequestToDelete(req);
  };

  const confirmDeleteRequest = async (req: any) => {
    if (!req || !req.id) return;
    const reqId = req.id;
    try {
      setDeletingRequestId(reqId);

      // 1. Save to deleted IDs blacklist in local storage
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("nexus_deleted_product_request_ids") || "[]");
        if (!deletedIds.includes(reqId)) {
          deletedIds.push(reqId);
          localStorage.setItem("nexus_deleted_product_request_ids", JSON.stringify(deletedIds));
        }
      } catch (err) {
        console.warn("Failed to update deleted_product_request_ids blacklist:", err);
      }

      // 2. Remove from local storage backup
      try {
        const localReqs = JSON.parse(localStorage.getItem("nexus_local_product_requests") || "[]");
        const updatedLocal = localReqs.filter((r: any) => r.id !== reqId && r.requestId !== reqId);
        localStorage.setItem("nexus_local_product_requests", JSON.stringify(updatedLocal));
      } catch (localErr) {
        console.warn("Local storage cleanup error:", localErr);
      }

      // 3. Attempt Firestore deletion
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "product_requests", reqId));
      } catch (firestoreErr) {
        console.warn("Firestore delete warning (handled via local blacklist):", firestoreErr);
      }

      // 4. Update UI states
      setProductRequests((prev) => prev.filter((r) => r.id !== reqId));
      if (selectedRequest?.id === reqId) {
        setSelectedRequest(null);
      }
      setRequestToDelete(null);
      setNotifMessage("Demande sur-mesure supprimée avec succès.");
      setTimeout(() => setNotifMessage(""), 4000);
    } catch (err) {
      console.error("Failed to delete product_request:", err);
      setProductRequests((prev) => prev.filter((r) => r.id !== reqId));
      if (selectedRequest?.id === reqId) {
        setSelectedRequest(null);
      }
      setRequestToDelete(null);
    } finally {
      setDeletingRequestId(null);
    }
  };

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

  // Local image handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 2 Mo pour un stockage optimal.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          setIsUploadingImage(true);
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                base64: reader.result,
                filename: file.name
              })
            });
            const data = await res.json();
            if (data.url) {
              setImage(data.url);
            } else {
              alert("Erreur de téléversement : " + (data.error || "Inconnu"));
            }
          } catch (err: any) {
            console.error("Upload error:", err);
            alert("Erreur de connexion au serveur de téléversement d'images.");
          } finally {
            setIsUploadingImage(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragging(true);
  };

  const handleDragLeave = () => {
    setImageDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Seuls les fichiers d'image sont acceptés.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 2 Mo pour un stockage optimal.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          setIsUploadingImage(true);
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                base64: reader.result,
                filename: file.name
              })
            });
            const data = await res.json();
            if (data.url) {
              setImage(data.url);
            } else {
              alert("Erreur de téléversement : " + (data.error || "Inconnu"));
            }
          } catch (err: any) {
            console.error("Upload error:", err);
            alert("Erreur de connexion au serveur de téléversement d'images.");
          } finally {
            setIsUploadingImage(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit, create or update product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !stock) {
      alert("Veuillez remplir au moins le nom, le tarif et le stock !");
      return;
    }

    try {
      setIsSavingProduct(true);
      const priceInCFA = parseFloat(price);
      const priceNum = isNaN(priceInCFA) ? 100000 / 655.957 : priceInCFA / 655.957;
      const stockNum = parseInt(stock);

      const defaultImages = [
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"
      ];

      const finalImage = image.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];

      if (editingProduct) {
        // Edit mode
        const updatedProduct: Product = {
          ...editingProduct,
          name: name.trim(),
          tagline: tagline.trim() || "Une création Sitedor élégante.",
          description: description.trim() || "Aucune description fournie.",
          price: priceNum,
          image: finalImage,
          category: category,
          colors: colorsList.length > 0 ? colorsList : [{ name: "Noir mat", hex: "#000000" }],
          variantsLabel: variantsLabel.trim() || undefined,
          variants: variantsList.length > 0 ? variantsList : undefined,
          features: featuresList.length > 0 ? featuresList : ["Matériaux recyclés eco-conçus", "Emballage carton bio-dégradable"],
          stock: isNaN(stockNum) ? 10 : stockNum,
          affiliateCode: editingProduct.affiliateCode || generateAffiliateCode(editingProduct.id || name.trim())
        };

        if (onUpdateProduct) {
          await onUpdateProduct(updatedProduct);
        } else {
          // Direct fallback if prop isn't fully bound yet
          await setDoc(doc(db, "products", editingProduct.id), updatedProduct, { merge: true });
        }

        setEditingProduct(null);
        setNotifMessage(`Le produit "${updatedProduct.name}" a été modifié avec succès !`);
      } else {
        // Create mode
        const newId = `sitedor-${Date.now()}`;
        const newProduct: Product = {
          id: newId,
          name: name.trim(),
          tagline: tagline.trim() || "Une création Sitedor élégante.",
          description: description.trim() || "Aucune description fournie.",
          price: priceNum,
          image: finalImage,
          category: category,
          colors: colorsList.length > 0 ? colorsList : [{ name: "Noir mat", hex: "#000000" }],
          variantsLabel: variantsLabel.trim() || undefined,
          variants: variantsList.length > 0 ? variantsList : undefined,
          features: featuresList.length > 0 ? featuresList : ["Matériaux recyclés eco-conçus", "Emballage carton bio-dégradable"],
          stock: isNaN(stockNum) ? 10 : stockNum,
          affiliateCode: generateAffiliateCode(newId)
        };

        await onAddProduct(newProduct);
        setNotifMessage("Félicitations ! Le produit de luxe a bien été ajouté au catalogue en ligne.");
      }

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
        "Conception artisanale Sitedor exclusive",
        "Garantie constructeur prolongée incluse"
      ]);

      setTimeout(() => setNotifMessage(""), 5000);
    } catch (err) {
      console.error("Save product failed:", err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = {
      footerAbout: footerAbout.trim(),
      footerContact: footerContact.trim(),
      footerWarranty: footerWarranty.trim(),
      heroTitle: heroTitle.trim(),
      heroSub: heroSub.trim(),
      heroDesc: heroDesc.trim(),
      faqs: faqs,
      waveNumbers: waveNumbers.trim(),
      orangeNumber: orangeNumber.trim(),
      mtnNumber: mtnNumber.trim(),
      visaWhatsAppNumber: visaWhatsAppNumber.trim(),
      btnCta1Text: btnCta1Text.trim(),
      btnCta1TextEn: btnCta1TextEn.trim(),
      btnCta1Target: btnCta1Target.trim(),
      btnCta1Style: btnCta1Style,
      btnCta1Active: btnCta1Active,
      btnCta2Text: btnCta2Text.trim(),
      btnCta2TextEn: btnCta2TextEn.trim(),
      btnCta2Target: btnCta2Target.trim(),
      btnCta2Style: btnCta2Style,
      btnCta2Active: btnCta2Active,
      btnCta3Text: btnCta3Text.trim(),
      btnCta3TextEn: btnCta3TextEn.trim(),
      btnCta3Active: btnCta3Active,
      btnCta4Text: btnCta4Text.trim(),
      btnCta4TextEn: btnCta4TextEn.trim(),
      btnCta4Active: btnCta4Active
    };

    // 1. Optimistic instant local updates
    localStorage.setItem("site_config_general", JSON.stringify(newConfig));
    if (onSaveSiteConfig) {
      onSaveSiteConfig(newConfig);
    }
    setNotifMessage("Configuration enregistrée instantanément ! (Synchronisation cloud asynchrone)");
    setTimeout(() => setNotifMessage(""), 4500);

    try {
      setIsSavingConfigs(true);
      const configRef = doc(db, "site_config", "general");
      
      // 2. Fire-and-forget background Firestore write for high speed response (0ms await delay)
      setDoc(configRef, newConfig, { merge: true }).then(() => {
        console.log("Background cloud Firestore config sync complete.");
      }).catch((err) => {
        console.warn("Background cloud sync fallback, kept local cache:", err);
      });
    } catch (err) {
      console.error("Save config failure:", err);
    } finally {
      setIsSavingConfigs(false);
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCat = newCategoryName.trim();
    if (!cleanCat) return;
    if (categories.some(c => c.toLowerCase() === cleanCat.toLowerCase())) {
      alert("Cette catégorie de meuble existe déjà !");
      return;
    }
    try {
      setIsSavingCategory(true);
      const updated = [...categories, cleanCat];
      await onCategoriesChange(updated);
      setNewCategoryName("");
      setNotifMessage(`La catégorie "${cleanCat}" a été ajoutée avec succès !`);
      setTimeout(() => setNotifMessage(""), 4000);
    } catch (err) {
      console.error("Failed to add category:", err);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catToDelete: string, force = false) => {
    if (categories.length <= 1) {
      alert("Impossible de supprimer la dernière catégorie du site !");
      return;
    }
    const linkedCount = products.filter(p => p.category === catToDelete).length;
    if (linkedCount > 0 && !force) {
      if (!window.confirm(`Attention ! ${linkedCount} produit(s) sont liés à la catégorie "${catToDelete}". Souhaitez-vous quand même la supprimer ?`)) {
        return;
      }
    } else if (!force) {
      if (!window.confirm(`Confirmez-vous la suppression de la catégorie "${catToDelete}" ?`)) {
        return;
      }
    }
    try {
      setDeletingCategory(catToDelete);
      const updated = categories.filter(c => c !== catToDelete);
      // Calls our optimistic asynchronous handler
      await onCategoriesChange(updated);
      setNotifMessage(`La catégorie "${catToDelete}" a été retirée.`);
      setTimeout(() => setNotifMessage(""), 4000);
    } catch (err) {
      console.error("Failed to delete category:", err);
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleUpdateCategory = async (oldCatName: string, newCatName: string) => {
    const cleanNew = newCatName.trim();
    if (!cleanNew) {
      alert("Le nom de la catégorie ne peut pas être vide !");
      return;
    }
    if (cleanNew.toLowerCase() === oldCatName.toLowerCase()) {
      setEditingCategory(null);
      return;
    }
    if (categories.some(c => c.toLowerCase() === cleanNew.toLowerCase())) {
      alert("Cette catégorie de meuble existe déjà !");
      return;
    }

    try {
      setIsSavingCategory(true);
      
      // 1. Optimistic categories update
      const updatedCategories = categories.map(c => c === oldCatName ? cleanNew : c);
      await onCategoriesChange(updatedCategories);

      // 2. Parallelized background cloud product category transition with zero UI blocks
      const affectedProducts = products.filter(p => p.category === oldCatName);
      
      // Run updates concurrently through Promise.all
      const updatePromises = affectedProducts.map(async (prod) => {
        const updatedProd = { ...prod, category: cleanNew };
        if (onUpdateProduct) {
          onUpdateProduct(updatedProd); // optimistically update local products state 
        }
        const prodRef = doc(db, "products", prod.id);
        return setDoc(prodRef, updatedProd);
      });
      
      // Dispatch concurrent promises without holding user interface hostage
      Promise.all(updatePromises).then(() => {
        console.log(`Successfully migrated ${affectedProducts.length} products to category ${cleanNew}`);
      }).catch((prodErr) => {
        console.error("Delayed background products migration failed:", prodErr);
      });

      setNotifMessage(`La catégorie "${oldCatName}" a été renommée en "${cleanNew}" avec succès !`);
      setTimeout(() => setNotifMessage(""), 4000);
      setEditingCategory(null);
    } catch (err) {
      console.error("Failed to update category:", err);
      alert("Erreur lors de la modification de la catégorie : " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newPromoCode.trim().toUpperCase();
    const discountNum = Number(newPromoDiscount);
    if (!cleanCode) {
      alert("Le code promo ne peut pas être vide.");
      return;
    }
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      alert("Le pourcentage de réduction doit être compris entre 1 et 100.");
      return;
    }
    
    try {
      setIsSavingPromo(true);
      await onAddPromoCode({
        code: cleanCode,
        discount: discountNum,
        description: newPromoDescription.trim() || `${discountNum}% de réduction`,
        status: newPromoStatus
      });
      setNewPromoCode("");
      setNewPromoDiscount("");
      setNewPromoDescription("");
      setNewPromoStatus("active");
      setNotifMessage(`Le code promo "${cleanCode}" a été enregistré avec succès !`);
      setTimeout(() => setNotifMessage(""), 4000);
    } catch (err) {
      console.error("Failed to add promo code:", err);
      alert("Une erreur s'est produite lors de l'enregistrement du code promo.");
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    try {
      setDeletingPromoCode(code);
      await onDeletePromoCode(code);
      setNotifMessage(`Le code promo "${code}" a été supprimé.`);
      setTimeout(() => setNotifMessage(""), 4000);
    } catch (err) {
      console.error("Failed to delete promo code:", err);
      alert("Une erreur s'est produite lors de la suppression du code promo.");
    } finally {
      setDeletingPromoCode(null);
    }
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

  // Separate standard purchases from custom handcrafted requests
  const regularOrders = orders.filter((o : any) => o.isCustomSpecial !== true);
  const bespokeOrders = orders.filter((o : any) => o.isCustomSpecial === true);

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

      {/* Google Authentication Alert for Firestore Connection */}
      {(!currentUser || currentUser.email !== "grasdvirus@gmail.com") && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Authentification Google requise pour sauvegarder</span>
            </div>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-300 leading-relaxed max-w-2xl">
              Vous êtes actuellement authentifié localement par code d'accès. Afin de pouvoir ajouter, modifier, supprimer des articles ou enregistrer les configurations en base de données, vous devez également être connecté sur Firebase avec votre compte Google Administrateur officiel (<strong className="underline">grasdvirus@gmail.com</strong>).
            </p>
          </div>
          {onGoogleLogin && (
            <button
              type="button"
              onClick={onGoogleLogin}
              className="px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 active:translate-y-px text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              S'authentifier Google
            </button>
          )}
        </div>
      )}

      {/* Admin Panel Multi Sub Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-100 justify-start gap-x-5 gap-y-2 select-none font-sans font-bold text-xs tracking-tight">
        <button
          onClick={() => setActiveSubTab("analytics")}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeSubTab === "analytics" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytiques & Performance (D3.js)
        </button>
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
          Catégories ({categories.length})
        </button>
        <button
          onClick={() => setActiveSubTab("orders")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "orders" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Commandes Clients ({regularOrders.length})
        </button>
        <button
          onClick={() => setActiveSubTab("bespoke")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "bespoke" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Demandes Sur-Mesure ({bespokeOrders.length})
        </button>
        <button
          onClick={() => setActiveSubTab("custom_options")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "custom_options" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Finitons & Options Produit
        </button>
        <button
          onClick={() => setActiveSubTab("site_config")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "site_config" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Configurations & FAQ
        </button>
        <button
          onClick={() => setActiveSubTab("action_buttons")}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${activeSubTab === "action_buttons" ? "border-[#2d4a22] text-[#2d4a22]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Boutons d'Action (CTA)
        </button>
      </div>

      {activeSubTab === "analytics" ? (
        <AnalyticsD3Dashboard 
          products={products} 
          orders={orders} 
          productRequests={productRequests} 
        />
      ) : activeSubTab === "catalog" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form to add item */}
          <form 
            id="admin-product-form"
            onSubmit={handleCreateProduct}
            className={`lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border p-6 md:p-8 space-y-5 text-left sleek-shadow-md transition-all ${editingProduct ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-800'}`}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
                  {editingProduct ? (
                    <>
                      <Edit2 className="w-5 h-5 text-amber-500" />
                      Modifier la Création d'Artisanat
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-[#2d4a22]" />
                      Façonner un Nouveau Modèle Virtuel
                    </>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {editingProduct 
                    ? `Modification de l'article : ${editingProduct.name}`
                    : "Saisissez les informations techniques de la création artisanale à exposer en ligne."}
                </p>
              </div>

              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEditProduct}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Annuler
                </button>
              )}
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
                  {categories.map((cat, idx) => (
                    <option key={`adm-cat-opt-${cat}-${idx}`} value={cat}>{cat}</option>
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

              {/* Local Image Drag & Drop Frame */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Ou téléverser une photo locale</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative min-h-[140px] ${
                    imageDragging
                      ? "border-[#2d4a22] bg-[#2d4a22]/5"
                      : image
                      ? "border-slate-300 bg-slate-50/55"
                      : "border-slate-200 bg-slate-50/20 hover:bg-slate-50/80 hover:border-[#2d4a22]"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="local-image-file-picker"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center space-y-2 pointer-events-none">
                      <div className="w-8 h-8 rounded-full border-2 border-[#2d4a22]/80 border-t-transparent animate-spin" />
                      <p className="text-[10px] font-bold text-[#2d4a22] font-mono animate-pulse">Téléchargement et stockage de l'image...</p>
                    </div>
                  ) : image ? (
                    <div className="flex flex-col items-center space-y-2 pointer-events-none">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                        <img 
                          src={image} 
                          alt="Prévisualisation" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-[#2d4a22] font-mono">
                        {image.startsWith("/uploads/") ? "Photo stockée avec succès sur le serveur" : "Image chargée avec succès"}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setImage("");
                        }}
                        className="pointer-events-auto bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-100 rounded-lg px-2.5 py-1 text-[9px] font-mono uppercase font-black transition-all"
                      >
                        Retirer la photo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-500 pointer-events-none">
                      <div className="mx-auto w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#2d4a22]">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[#2d4a22]">Glissez-déposez ici</span> ou cliquez pour parcourir vos fichiers
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium">Format recommandé: JPG, PNG ou WebP. Limite 2 Mo.</p>
                    </div>
                  )}
                </div>
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
                {colorsList.map((c, idx) => (
                  <span 
                    key={`adm-col-${c.hex || idx}-${idx}`}
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
                {variantsList.map((v, idx) => (
                  <span 
                    key={`adm-var-${v}-${idx}`}
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
                  <div key={`feat-bullet-${i}`} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-100">
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
              disabled={isSavingProduct}
              className={`w-full py-4.5 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed ${editingProduct ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#2d4a22] hover:bg-[#1a2d15]'}`}
            >
              {isSavingProduct ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{editingProduct ? "Mise à jour en cours..." : "Publication en cours..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingProduct ? "Enregistrer les modifications du meuble" : "Exposer et publier dans l'Atelier en ligne"}</span>
                </>
              )}
            </button>
          </form>

          {/* List of current store products */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-101 dark:border-slate-800 p-6 md:p-8 space-y-6 text-left sleek-shadow-md lg:col-span-1">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
              <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#2d4a22]" />
                Catalogue Actif
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Vous pouvez à tout moment retirer de la vente certaines créations.</p>
            </div>

            <div className="space-y-3.5 max-h-[800px] overflow-y-auto pr-1">
              {products.map((p, idx) => (
                <div 
                  key={`adm-prod-${p.id}-${idx}`} 
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
                      {p.affiliateCode && (
                        <p className="text-[9px] font-mono font-bold text-[#2d4a22]">Code d'affiliation : {p.affiliateCode}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {confirmDeleteProductId === p.id ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn p-1.5 bg-rose-50/50 dark:bg-rose-950/15 rounded-xl border border-rose-150/70 dark:border-rose-900/40">
                        <span className="text-[9px] font-bold text-rose-750 dark:text-rose-400 font-mono px-1.5 block select-none">
                          Effacer ?
                        </span>
                        <button
                          type="button"
                          disabled={deletingProductId === p.id}
                          onClick={async () => {
                            try {
                              setDeletingProductId(p.id);
                              await onDeleteProduct(p.id);
                            } catch (err) {
                              console.error("Deletion failed:", err);
                            } finally {
                              setDeletingProductId(null);
                              setConfirmDeleteProductId(null);
                            }
                          }}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all flex items-center justify-center min-w-[28px] h-[28px] cursor-pointer shadow-sm"
                          title="Confirmer la suppression"
                        >
                          {deletingProductId === p.id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProductId(null)}
                          className="p-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all flex items-center justify-center min-w-[28px] h-[28px] cursor-pointer"
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEditProduct(p)}
                          className="p-2.5 bg-slate-100 hover:bg-[#2d4a22] text-slate-600 hover:text-white dark:bg-slate-800 dark:hover:bg-[#2d4a22] rounded-xl transition-all flex items-center justify-center min-w-[40px] h-[40px] cursor-pointer"
                          title="Modifier cet article"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProductId(p.id)}
                          className="p-2.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white dark:bg-rose-950/20 rounded-xl transition-all flex items-center justify-center min-w-[40px] h-[40px] cursor-pointer shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSubTab === "categories" ? (
        
        /* CATEGORIES AND PROMO CODES MANAGEMENT SECTION */
        <div className="space-y-8 animate-fadeIn text-left">
          
          {/* CATEGORIES CONTAINER */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#2d4a22] dark:text-emerald-400">
                Gestion des Catégories
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <form 
                onSubmit={handleCreateCategory}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4 text-left sleek-shadow-md"
              >
                <div className="border-b border-slate-101 dark:border-slate-800 pb-3 block">
                  <h4 className="font-sans font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#2d4a22]" />
                    Ajouter une Nouvelle Catégorie
                  </h4>
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-805 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="w-full py-3.5 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isSavingCategory ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <span>Enregistrer la catégorie de meuble</span>
                  )}
                </button>
              </form>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4 text-left sleek-shadow-md">
                <div className="border-b border-slate-101 dark:border-slate-800 pb-3 block">
                  <h4 className="font-sans font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#2d4a22]" />
                    Catégories de Meubles en Vigueur
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">Liste des filtres de catégories activés pour l'utilisateur dans l'Atelier.</p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {categories.map((cat, idx) => {
                    const associatedCount = products.filter(p => p.category === cat).length;
                    const isEditing = editingCategory === cat;
                    return (
                      <div 
                        key={`adm-cat-item-${cat}-${idx}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/85 hover:bg-white dark:hover:bg-slate-900 transition-all gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#2d4a22]/5 dark:bg-[#2d4a22]/15 flex items-center justify-center text-[#2d4a22] dark:text-emerald-450 shrink-0 select-none">
                            <Tag className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleUpdateCategory(cat, editingCategoryValue);
                                }}
                                className="flex items-center gap-2 w-full"
                              >
                                <input
                                  type="text"
                                  required
                                  value={editingCategoryValue}
                                  onChange={(e) => setEditingCategoryValue(e.target.value)}
                                  className="text-xs px-2.5 py-1.5 border border-slate-200 focus:border-[#2d4a22] focus:bg-white dark:border-slate-755 rounded-lg w-full font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:ring-1 focus:ring-[#2d4a22]"
                                  placeholder="Nom de la catégorie"
                                  autoFocus
                                  disabled={isSavingCategory}
                                />
                              </form>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">{cat}</span>
                                <span className="text-[9px] font-mono font-bold bg-[#2d4a22]/5 dark:bg-[#2d4a22]/15 text-[#2d4a22] dark:text-emerald-400 px-2 py-0.5 rounded-full select-none">
                                  {associatedCount} meuble{associatedCount > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                            <span className="text-[9px] text-slate-400 block mt-0.5 select-none">
                              {isEditing ? "Appuyez sur Entrée pour valider" : "Filtre actif de l'Atelier"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={isSavingCategory}
                                onClick={() => handleUpdateCategory(cat, editingCategoryValue)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center justify-center min-w-[30px] h-[30px] cursor-pointer disabled:opacity-50"
                                title="Valider"
                              >
                                {isSavingCategory ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={isSavingCategory}
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditingCategoryValue("");
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg transition-all flex items-center justify-center min-w-[30px] h-[30px] cursor-pointer"
                                title="Annuler"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : confirmDeleteCat === cat ? (
                            <div className="flex items-center gap-1.5 animate-fadeIn p-1.5 bg-rose-50/50 dark:bg-rose-950/15 rounded-xl border border-rose-100/70 dark:border-rose-900/40">
                              <span className="text-[10px] font-bold text-rose-650 dark:text-rose-400 font-mono px-2 block select-none">
                                {associatedCount > 0 ? `Effacer (${associatedCount} liés) ?` : "Vraiment supprimer ?"}
                              </span>
                              <button
                                type="button"
                                disabled={deletingCategory === cat}
                                onClick={async () => {
                                  try {
                                    await handleDeleteCategory(cat, true);
                                  } finally {
                                    setConfirmDeleteCat(null);
                                  }
                                }}
                                className="p-1 bg-rose-650 hover:bg-rose-700 text-white rounded-lg transition-all flex items-center justify-center min-w-[28px] h-[28px] cursor-pointer shadow-sm"
                                title="Confirmer la suppression"
                              >
                                {deletingCategory === cat ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCat(null)}
                                className="p-1 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all flex items-center justify-center min-w-[28px] h-[28px] cursor-pointer"
                                title="Annuler"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={deletingCategory !== null}
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setEditingCategoryValue(cat);
                                }}
                                className="p-1.5 bg-slate-100/95 hover:bg-[#2d4a22] text-slate-600 hover:text-white dark:bg-slate-800 dark:hover:bg-[#2d4a22] dark:text-slate-300 rounded-lg transition-all flex items-center justify-center min-w-[32px] h-[32px] cursor-pointer shadow-sm"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={deletingCategory === cat}
                                onClick={() => setConfirmDeleteCat(cat)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white dark:bg-rose-950/20 dark:hover:bg-rose-900 rounded-lg transition-all flex items-center justify-center min-w-[32px] h-[32px] cursor-pointer shadow-sm"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80 my-8" />

          {/* PROMO CODES CONTAINER */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#2d4a22] dark:text-emerald-450">
                Gestion des Codes de Réduction
              </h3>
              <span className="text-[10px] font-mono font-bold bg-[#2d4a22]/5 dark:bg-[#2d4a22]/15 text-[#2d4a22] dark:text-emerald-450 px-2.5 py-1 rounded-full">
                {promoCodes.length} code{promoCodes.length > 1 ? "s" : ""} au total
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <form 
                onSubmit={handleCreatePromoCode}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4 text-left sleek-shadow-md"
              >
                <div className="border-b border-slate-101 dark:border-slate-800 pb-3 block">
                  <h4 className="font-sans font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#2d4a22]" />
                    Ajouter un Code de Réduction
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Configurez un nouveau coupon de réduction utilisable par les clients.
                  </p>
                </div>

                <div className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Code (ex: SPECIAL20) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="NOMDUCODE" 
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-805 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Réduction (%) *</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        max="100"
                        placeholder="ex: 15" 
                        value={newPromoDiscount}
                        onChange={(e) => setNewPromoDiscount(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-805 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Statut *</label>
                      <select 
                        value={newPromoStatus}
                        onChange={(e) => setNewPromoStatus(e.target.value as "active" | "planned")}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-101 dark:border-slate-805 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none transition-colors"
                      >
                        <option value="active">Actif (Utilisable)</option>
                        <option value="planned">Prévu (Bientôt)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Description descriptive (ex: -15% Hiver)</label>
                    <input 
                      type="text" 
                      placeholder="15% de réduction sur tout le catalogue" 
                      value={newPromoDescription}
                      onChange={(e) => setNewPromoDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-805 focus:border-[#2d4a22] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-100 outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingPromo}
                  className="w-full py-3.5 bg-[#2d4a22] hover:bg-[#1a2d15] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 mt-2"
                >
                  {isSavingPromo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sauvegarde en cours...</span>
                    </>
                  ) : (
                    <span>Créer le Code de Réduction</span>
                  )}
                </button>
              </form>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-4 text-left sleek-shadow-md">
                <div className="border-b border-slate-101 dark:border-slate-800 pb-3 block">
                  <h4 className="font-sans font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#2d4a22]" />
                    Codes de Réduction en Vigueur
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Liste des coupons actifs ou prévus programmés sur la boutique.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {promoCodes.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs font-sans">
                      Aucun code promo n'est actuellement disponible.
                    </div>
                  ) : (
                    promoCodes.map((promo, idx) => (
                      <div 
                        key={`adm-promo-item-${promo.code}-${idx}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 select-none ${
                            promo.status === 'active'
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-450" 
                              : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450"
                          }`}>
                            <Tag className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100 truncate">{promo.code}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none ${
                                promo.status === 'active'
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}>
                                {promo.status === 'active' ? 'ACTIF' : 'PRÉVU'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium truncate font-sans">
                              {promo.description} ({promo.discount}% de réduction)
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {confirmDeletePromoCode === promo.code ? (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <button
                                type="button"
                                disabled={deletingPromoCode === promo.code}
                                onClick={() => handleDeletePromoCode(promo.code)}
                                className="p-1 bg-rose-650 hover:bg-rose-700 text-white rounded-lg transition-colors min-w-[28px] h-[28px] flex items-center justify-center cursor-pointer shadow-sm"
                                title="Confirmer"
                              >
                                {deletingPromoCode === promo.code ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePromoCode(null)}
                                className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 rounded-lg transition-colors min-w-[28px] h-[28px] flex items-center justify-center cursor-pointer"
                                title="Annuler"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={deletingPromoCode !== null}
                              onClick={() => setConfirmDeletePromoCode(promo.code)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white dark:bg-rose-950/20 dark:hover:bg-rose-900 rounded-lg transition-all flex items-center justify-center min-w-[32px] h-[32px] cursor-pointer shadow-sm"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2d4a22] dark:text-emerald-450 font-mono border-b pb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2d4a22] dark:bg-emerald-400"></span>
              Numéros de Paiement Manuel Mobile Money & Carte Visa
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Numéros Wave Money (Séparés par /)
                </label>
                <input
                  type="text"
                  value={waveNumbers}
                  onChange={(e) => setWaveNumbers(e.target.value)}
                  placeholder="ex : 0704542909 / 0503654886"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Numéro Orange Money
                </label>
                <input
                  type="text"
                  value={orangeNumber}
                  onChange={(e) => setOrangeNumber(e.target.value)}
                  placeholder="ex : 0704542909"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Numéro MTN Mobile Money
                </label>
                <input
                  type="text"
                  value={mtnNumber}
                  onChange={(e) => setMtnNumber(e.target.value)}
                  placeholder="ex : 0503654886"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Numéro WhatsApp Carte Visa
                </label>
                <input
                  type="text"
                  value={visaWhatsAppNumber}
                  onChange={(e) => setVisaWhatsAppNumber(e.target.value)}
                  placeholder="ex : 0704542909"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22]"
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
                <div key={`admin-faq-${faq.question || i}-${i}`} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 relative text-xs">
                  <p className="font-bold text-slate-800 pr-8">Q : {faq.question}</p>
                  <p className="text-slate-500 mt-1">R : {faq.answer}</p>
                  <button
                    type="button"
                    onClick={() => removeFaqItem(i)}
                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Effacer la question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Double-persistance Cloud & Cache Local activée</span>
            </div>
            
            <button
              type="submit"
              disabled={isSavingConfigs}
              className="w-full sm:w-auto py-3.5 px-8 bg-[#2d4a22] hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-75"
            >
              {isSavingConfigs ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Synchronisation en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Mettre à jour la configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : activeSubTab === "action_buttons" ? (
        /* ACTION BUTTONS & CTA MANAGEMENT ENGINE */
        <form
          onSubmit={handleSaveConfigs}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6 text-left sleek-shadow-lg"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
            <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2d4a22]" />
              Gestion des Boutons d'Action & Appel à l'Action (CTA)
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Personnalisez les libellés, styles, destinations et visibilité des boutons principaux de la boutique.
            </p>
          </div>

          {/* Bouton CTA 1 */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase text-[#2d4a22] dark:text-emerald-450">Bouton Principal 1 (Hero CTA 1)</h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={btnCta1Active}
                  onChange={(e) => setBtnCta1Active(e.target.checked)}
                  className="rounded text-[#2d4a22] focus:ring-[#2d4a22]"
                />
                <span>Afficher ce bouton</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Texte du Bouton (Français)</label>
                <input
                  type="text"
                  value={btnCta1Text}
                  onChange={(e) => setBtnCta1Text(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Texte du Bouton (Anglais)</label>
                <input
                  type="text"
                  value={btnCta1TextEn}
                  onChange={(e) => setBtnCta1TextEn(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Ancrage / Target ID</label>
                <select
                  value={btnCta1Target}
                  onChange={(e) => setBtnCta1Target(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                >
                  <option value="pricing-plans">Catalogue & Produits (#pricing-plans)</option>
                  <option value="interactive-model-sandbox">Simulateur & sur-mesure (#interactive-model-sandbox)</option>
                  <option value="reviews-carousel">Avis & Témoignages (#reviews-carousel)</option>
                  <option value="lead-form-section">Formulaire Devis (#lead-form-section)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Style Visuel</label>
                <select
                  value={btnCta1Style}
                  onChange={(e) => setBtnCta1Style(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                >
                  <option value="primary">Vert Ébénisterie (Principal)</option>
                  <option value="outline">Blanc / Contour Épuré</option>
                  <option value="secondary">Sauge Doux / Vert Pastel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bouton CTA 2 */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase text-[#2d4a22] dark:text-emerald-450">Bouton Secondaire 2 (Hero CTA 2)</h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={btnCta2Active}
                  onChange={(e) => setBtnCta2Active(e.target.checked)}
                  className="rounded text-[#2d4a22] focus:ring-[#2d4a22]"
                />
                <span>Afficher ce bouton</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Texte du Bouton (Français)</label>
                <input
                  type="text"
                  value={btnCta2Text}
                  onChange={(e) => setBtnCta2Text(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Texte du Bouton (Anglais)</label>
                <input
                  type="text"
                  value={btnCta2TextEn}
                  onChange={(e) => setBtnCta2TextEn(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Ancrage / Target ID</label>
                <select
                  value={btnCta2Target}
                  onChange={(e) => setBtnCta2Target(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                >
                  <option value="interactive-model-sandbox">Simulateur & sur-mesure (#interactive-model-sandbox)</option>
                  <option value="pricing-plans">Catalogue & Produits (#pricing-plans)</option>
                  <option value="reviews-carousel">Avis & Témoignages (#reviews-carousel)</option>
                  <option value="lead-form-section">Formulaire Devis (#lead-form-section)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Style Visuel</label>
                <select
                  value={btnCta2Style}
                  onChange={(e) => setBtnCta2Style(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                >
                  <option value="outline">Blanc / Contour Épuré</option>
                  <option value="primary">Vert Ébénisterie (Principal)</option>
                  <option value="secondary">Sauge Doux / Vert Pastel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bouton CTA 3: Submit Request dans le Customizer */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-[#2d4a22] dark:text-emerald-450">Bouton Valider Simulateur (Interactive Model Submit)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Texte FR</label>
                <input
                  type="text"
                  value={btnCta3Text}
                  onChange={(e) => setBtnCta3Text(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Texte EN</label>
                <input
                  type="text"
                  value={btnCta3TextEn}
                  onChange={(e) => setBtnCta3TextEn(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSavingConfigs}
              className="py-3.5 px-8 bg-[#2d4a22] hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              {isSavingConfigs ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer les Boutons CTA</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : activeSubTab === "orders" ? (
        /* CUSTOM CLIENT STANDARD PURCHASE ORDERS LIST */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6 sleek-shadow-md text-left animate-fadeIn">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
            <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#2d4a22]" />
              Suivi et Livraison du Catalogue Standard ({regularOrders.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
              Visualisez le détail de chaque commande de meubles achetés en catalogue standard. Contactez le client directement par téléphone ou mail. Cliquez sur une ligne pour l'étendre.
            </p>
          </div>

          <div className="space-y-4">
            {regularOrders.map((ord: any, idx: number) => {
              const isExpanded = !!expandedOrders[ord.id];
              return (
                <div 
                  key={`adm-ord-${ord.id || ''}-${idx}`} 
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
                          {ord.total ? formatOrderTotal(ord.total, "CFA") : "Contact requis"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {ord.createdAt ? new Date(ord.createdAt.seconds ? ord.createdAt.seconds * 1000 : ord.createdAt).toLocaleString("fr-FR") : "Récente"}
                        </span>
                      </div>

                      {/* Suppression de commande autorisée */}
                      {confirmDeleteOrderId === ord.id ? (
                        <div 
                          className="flex items-center gap-1.5 animate-fadeIn p-1 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-rose-650 dark:text-rose-400 font-mono px-2 block select-none">
                            Supprimer ?
                          </span>
                          <button
                            type="button"
                            disabled={deletingOrderId === ord.id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (onDeleteOrder) {
                                try {
                                  setDeletingOrderId(ord.id);
                                  await onDeleteOrder(ord.id);
                                } catch (err) {
                                  console.error("Order deletion failed:", err);
                                } finally {
                                  setDeletingOrderId(null);
                                  setConfirmDeleteOrderId(null);
                                }
                              }
                            }}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all flex items-center justify-center min-w-[28px] h-[28px] cursor-pointer shadow-sm"
                            title="Confirmer la suppression"
                          >
                            {deletingOrderId === ord.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteOrderId(null);
                            }}
                            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all flex items-center justify-center min-w-[28px] h-[28px] cursor-pointer"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={deletingOrderId !== null}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteOrderId(ord.id);
                          }}
                          className="p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white dark:bg-rose-950/20 dark:hover:bg-rose-900 rounded-xl transition-all cursor-pointer flex items-center justify-center min-w-[40px] h-[40px] shadow-sm hover:shadow"
                          title="Supprimer la commande"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      )}
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
                            {(ord.email || ord.shippingAddress?.email) && (
                              <a
                                href={`mailto:${ord.email || ord.shippingAddress?.email}?subject=Votre commande ${ord.id} - Sitedor&body=Bonjour ${ord.fullName || ord.shippingAddress?.fullName || 'Client d\'exception'},%0D%0A%0D%0ANous vous remercions pour votre commande d'exception ${ord.id} d'un montant de ${ord.total ? ord.total.toLocaleString() : '---'} CFA.%0D%0A%0D%0ANos artisans préparent votre mobilier avec la plus haute exigence.%0D%0A%0D%0ACordialement,%0D%0AL'Atelier Sitedor`}
                                onClick={(e) => e.stopPropagation()}
                                className="ml-2.5 inline-flex items-center gap-1 px-2 py-0.5 bg-[#2d4a22]/10 hover:bg-[#2d4a22]/15 text-[#2d4a22] dark:text-[#a3e635] text-[9px] uppercase font-black rounded cursor-pointer transition-all border border-[#2d4a22]/10"
                                title="Contacter par e-mail"
                              >
                                <Mail className="w-2.5 h-2.5" /> Écrire
                              </a>
                            )}
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
                            <div key={`adm-ord-item-${ord.id || ''}-${index}`} className="flex items-start justify-between border-b border-slate-50 dark:border-slate-800/40 pb-2 text-[11px] gap-2">
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
                                {it.price ? formatOrderTotal(it.price, "CFA") : ""}
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

            {regularOrders.length === 0 && (
              <div className="text-center py-12 space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Box className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">Aucune commande catalogue pour l'instant.</p>
                <p className="text-[10px] text-slate-404">Toutes les nouvelles commandes d'achat standards s'afficheront ici.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeSubTab === "bespoke" ? (
        /* SPECIAL BESPOKE CUSTOM PIECES REQUESTS OUTSIDE OF COMMON STOCK */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-101 dark:border-slate-800 p-6 md:p-8 space-y-6 sleek-shadow-md text-left animate-fadeIn">
          <div className="border-b border-rose-100 dark:border-amber-900/30 pb-4 block flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-sans font-bold text-[#2d4a22] dark:text-emerald-450 text-base tracking-tight flex items-center gap-2">
                <Hammer className="w-5 h-5 text-[#2d4a22] dark:text-emerald-550 animate-pulse" />
                Section Spéciale : Demandes Artisanales Sur-Mesure ({productRequests.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                Retrouvez ici toutes les demandes uniques et configurations personnalisées soumises par vos clients via le simulateur intelligent. Cliquez sur une demande pour ouvrir le dossier complet et fixer le devis.
              </p>
            </div>
            {isLoadingRequests && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2d4a22]" />
                Mise à jour...
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            {productRequests.map((req: any, idx: number) => {
              const dateStr = req.createdAt
                ? new Date(req.createdAt.seconds ? req.createdAt.seconds * 1000 : req.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Récente";

              return (
                <div 
                  key={`adm-req-${req.id || ''}-${idx}`} 
                  onClick={() => handleOpenRequest(req)}
                  className="group/card bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 border border-slate-100 hover:border-[#e2eae0] dark:border-slate-850 dark:hover:border-slate-800 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 relative shadow-3xs"
                >
                  {/* Left: Avatar & Name & Category */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#2d4a22]/10 dark:bg-[#2d4a22]/20 text-[#2d4a22] dark:text-emerald-450 flex items-center justify-center font-bold font-sans text-sm shrink-0">
                      {(req.userDisplayName || req.contactValue || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-black text-slate-850 dark:text-slate-200 truncate">
                          {req.userDisplayName || "Client d'Atelier"}
                        </span>
                        <span className="text-[9px] uppercase font-mono tracking-widest bg-[#2d4a22]/10 dark:bg-[#2d4a22]/30 text-[#2d4a22] dark:text-emerald-455 px-2.5 py-0.5 rounded-full font-black">
                          {req.category || "Général"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        <span>CODE: {req.id}</span>
                        <span>&bull;</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Budget & Viewed Status badge & Action buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-left md:text-right font-sans">
                      <span className="text-xs text-slate-400 uppercase tracking-widest block font-mono text-[9px]">Prix Désigné Client</span>
                      <span className="text-sm font-mono font-extrabold text-[#2d4a22] dark:text-emerald-450 block">
                        {req.estimatedBudget ? formatBespokePrice(req.estimatedBudget, "CFA") : "Devis en attente"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Viewed Status Badge */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleRequestViewed(req, e)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition-all border ${
                          req.viewed
                            ? "bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse"
                        }`}
                        title={req.viewed ? "Marquer comme non vue" : "Marquer comme vue"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${req.viewed ? "bg-slate-400" : "bg-amber-500 animate-ping"}`}></span>
                        {req.viewed ? "Vue" : "Non vue"}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        disabled={deletingRequestId === req.id}
                        onClick={(e) => triggerDeleteRequest(req, e)}
                        className="p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/30 dark:hover:bg-rose-900 rounded-xl transition-all cursor-pointer flex items-center justify-center min-w-[36px] h-[36px] border border-rose-100 dark:border-rose-900/40"
                        title="Supprimer définitivement cette demande"
                      >
                        {deletingRequestId === req.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {productRequests.length === 0 && !isLoadingRequests && (
              <div className="text-center py-16 space-y-3.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Box className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">Aucune demande sur-mesure d'Atelier pour l'instant.</p>
                  <p className="text-[10px] text-slate-400">Toutes les configurations soumises par vos clients s'afficheront ici en temps réel.</p>
                </div>
              </div>
            )}
          </div>

          {/* ANIMA PRESENCE FOR GORGEOUS DETAILS MODAL */}
          <AnimatePresence>
            {selectedRequest && (
              <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedRequest(null)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10 shadow-xl p-6 md:p-8 space-y-6"
                >
                  {/* Modal Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <span className="text-[10px] uppercase font-mono tracking-widest bg-[#2d4a22]/10 dark:bg-[#2d4a22]/30 text-[#2d4a22] dark:text-emerald-450 px-3 py-0.5 rounded-full font-black">
                          {selectedRequest.category}
                        </span>
                        <span className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full font-black border ${
                          selectedRequest.viewed
                            ? "bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-500"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse"
                        }`}>
                          {selectedRequest.viewed ? "Dossier Consulté" : "Nouveau Dossier"}
                        </span>
                      </div>
                      <h4 className="font-sans text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Dossier Client : {selectedRequest.userDisplayName || "Invité d'Atelier"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Identifiant : {selectedRequest.id} &bull; Reçu le : {selectedRequest.createdAt ? new Date(selectedRequest.createdAt.seconds ? selectedRequest.createdAt.seconds * 1000 : selectedRequest.createdAt).toLocaleString("fr-FR") : "Récente"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Content Grid */}
                  <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
                    
                    {/* Customer Contact & Sourcing parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Customer Info Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block border-b border-slate-200/50 dark:border-slate-800/50 pb-1">
                          👤 Coordonnées Client
                        </span>
                        <div className="space-y-1.5 font-sans">
                          <p>
                            <span className="font-bold text-slate-450 uppercase text-[9px] font-mono mr-2">Nom :</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{selectedRequest.userDisplayName || "Invité d'Atelier"}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-455 uppercase text-[9px] font-mono mr-2">Contact :</span>
                            <span className="font-semibold text-slate-900 dark:text-white font-mono">{selectedRequest.contactValue || "Non spécifié"}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-455 uppercase text-[9px] font-mono mr-2">Canal :</span>
                            <span className="font-bold text-emerald-600 uppercase font-sans text-[10px]">{selectedRequest.contactChannel || "Non spécifié"}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-455 uppercase text-[9px] font-mono mr-2">Lieu :</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{selectedRequest.city || "Abidjan"}, {selectedRequest.country || "Côte d'Ivoire"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Project Sourcing Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-855 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block border-b border-slate-200/50 dark:border-slate-800/50 pb-1">
                          📋 Paramètres du Projet
                        </span>
                        <div className="space-y-1.5 font-sans">
                          <p>
                            <span className="font-bold text-slate-455 uppercase text-[9px] font-mono mr-2">Quantité :</span>
                            <span className="font-black text-slate-900 dark:text-white">{selectedRequest.desiredQuantity || 1} unité(s)</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-455 uppercase text-[9px] font-mono mr-2">Délai :</span>
                            <span className="font-black text-amber-600 font-sans">{selectedRequest.desiredDelay || "Cette semaine"}</span>
                          </p>
                          <p>
                            <span className="font-bold text-slate-455 uppercase text-[9px] font-mono mr-2">Prix Désigné Client :</span>
                            <span className="font-black text-[#2d4a22] dark:text-emerald-455 font-mono text-sm">
                              {selectedRequest.estimatedBudget ? formatBespokePrice(selectedRequest.estimatedBudget, "CFA") : "Devis en attente"}
                            </span>
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Characteristics configured */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22] dark:text-emerald-450 block border-b border-[#2d4a22]/10 pb-1">
                        🛠️ Caractéristiques Personnalisées Sélectionnées
                      </span>
                      {selectedRequest.characteristics && Object.keys(selectedRequest.characteristics).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {Object.entries(selectedRequest.characteristics).map(([key, val]: [string, any], cIdx: number) => {
                            if (key === "budget") return null; // Already displayed above
                            return (
                              <div key={`req-char-${selectedRequest.id || ''}-${key}-${cIdx}`} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center gap-4">
                                <span className="font-bold text-slate-500 font-sans text-[11px] truncate">{key}</span>
                                <span className="font-black text-slate-855 dark:text-slate-100 font-sans text-[11px] shrink-0">{String(val)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic font-medium">Aucune caractéristique spécifique n'a été pré-configurée.</p>
                      )}
                    </div>

                    {/* Customer Free Text Description */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block border-b border-slate-200/50 dark:border-slate-800/50 pb-1">
                        📝 Description et Notes du Client
                      </span>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-101 dark:border-slate-850 font-sans leading-relaxed text-slate-800 dark:text-slate-200 font-medium break-words text-left">
                        {selectedRequest.description || "Aucune description complémentaire fournie."}
                      </div>
                    </div>

                    {/* Contact integration and toggle viewed & delete */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex w-full sm:w-auto items-center gap-2">
                        {/* Mark Viewed Action */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleRequestViewed(selectedRequest, e)}
                          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors border ${
                            selectedRequest.viewed
                              ? "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-700"
                              : "bg-amber-600 hover:bg-amber-700 text-white border-transparent"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          {selectedRequest.viewed ? "Marquer non vue" : "Marquer Traitée"}
                        </button>

                        {/* Delete Request from Modal */}
                        <button
                          type="button"
                          disabled={deletingRequestId === selectedRequest.id}
                          onClick={(e) => triggerDeleteRequest(selectedRequest, e)}
                          className="px-3 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/30 dark:hover:bg-rose-900 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-rose-100 dark:border-rose-900/40"
                          title="Supprimer ce dossier"
                        >
                          {deletingRequestId === selectedRequest.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>

                      {/* External actions (WhatsApp, Mail, Phone) */}
                      <div className="flex w-full sm:w-auto gap-2">
                        {selectedRequest.contactValue && selectedRequest.contactChannel === "whatsapp" && (
                          <a
                            href={`https://wa.me/${selectedRequest.contactValue.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none text-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs uppercase font-black tracking-wider transition-all select-none flex items-center justify-center gap-1.5"
                          >
                            WhatsApp Client
                          </a>
                        )}
                        {selectedRequest.contactValue && selectedRequest.contactChannel === "email" && (
                          <a
                            href={`mailto:${selectedRequest.contactValue}?subject=Votre projet sur-mesure d'Atelier ${selectedRequest.id}&body=Bonjour ${selectedRequest.userDisplayName || 'Client d\'exception'},%0D%0A%0D%0ANous faisons suite à votre demande sur-mesure ${selectedRequest.id} dans la catégorie ${selectedRequest.category}.%0D%0A%0D%0ANos maîtres d'art perfectionnent le devis complet et l'étude technique pour la réalisation de vos options souhaitées.%0D%0A%0D%0ACordialement,%0D%0AL'Atelier d'Exception`}
                            className="flex-1 sm:flex-none text-center bg-[#2d4a22] hover:bg-[#1a2d15] text-white px-4 py-2.5 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <Mail className="w-4 h-4" /> Écrire par Email
                          </a>
                        )}
                        {selectedRequest.contactValue && selectedRequest.contactChannel === "phone" && (
                          <a
                            href={`tel:${selectedRequest.contactValue}`}
                            className="flex-1 sm:flex-none text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-800 dark:text-white px-4 py-2.5 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                          >
                            Appeler le Client
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* DOUBLE VERIFICATION DELETE MODAL */}
          <AnimatePresence>
            {requestToDelete && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setRequestToDelete(null)}
                  className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                />

                {/* Confirmation Box */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 md:p-7 space-y-5 text-left"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Double Validation de Suppression
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Dossier : {requestToDelete.id}
                      </p>
                    </div>
                  </div>

                  {/* Request Details Summary Card */}
                  <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-900 dark:text-slate-100 font-mono">
                        {requestToDelete.category || "Meuble Sur-Mesure"}
                      </span>
                      <span className="text-[#2d4a22] dark:text-emerald-400 font-mono font-extrabold">
                        {requestToDelete.estimatedBudget ? formatBespokePrice(requestToDelete.estimatedBudget, "CFA") : "Prix non fixé"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p><strong>Contact :</strong> {requestToDelete.contactValue || "Non renseigné"} ({requestToDelete.contactChannel || "Direct"})</p>
                      <p><strong>Statut :</strong> {requestToDelete.viewed ? "Vue / Traitée" : "En attente"}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    Êtes-vous absolument certain de vouloir supprimer définitivement cette demande sur-mesure ? Cette action retirera la demande du système et mettra à jour vos données analytiques.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={deletingRequestId === requestToDelete.id}
                      onClick={() => setRequestToDelete(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={deletingRequestId === requestToDelete.id}
                      onClick={() => confirmDeleteRequest(requestToDelete)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-2"
                    >
                      {deletingRequestId === requestToDelete.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Confirmer la Suppression
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : activeSubTab === "custom_options" ? (
        /* ADVANCED CONFIGURATOR FOR DYNAMIC PRODUCT CHARACTERISTICS IN MANUFACTURE SUR MESURE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-101 dark:border-slate-800 p-6 md:p-8 space-y-6 sleek-shadow-md text-left animate-fadeIn">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 block">
            <h3 className="font-sans font-bold text-slate-800 dark:text-white text-base tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2d4a22]" />
              Configuration et Finitions Spécifiques de chaque Produit
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
              Modifiez et rajoutez des caractéristiques sur-mesure (ex: tailles, RAM, tissus, bois) pour chacun des produits de votre boutique. Elles seront suggérées en temps réel dans la <strong>Section Manufacture Sur Mesure</strong> sur le site.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-50/70 dark:bg-slate-950 p-5 rounded-2xl border border-[#e2eae0] dark:border-slate-850 space-y-4">
              <h4 className="text-xs font-black uppercase text-[#2d4a22] dark:text-[#a3e635] flex items-center gap-2 font-mono">
                <Plus className="w-4 h-4" /> Ajouter une caractéristique
              </h4>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">1. Choisir le produit cible</label>
                <select
                  value={targetCustomProductId}
                  onChange={(e) => setTargetCustomProductId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white pointer-events-auto"
                >
                  {products.map((p, idx) => (
                    <option key={`adm-opt-select-${p.id}-${idx}`} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom_special_atelier" className="text-amber-600 font-bold">
                    [CRÉATION UNIQUE LIBRE - SUR MESURE]
                  </option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-505 block">2. Nom de la caractéristique</label>
                <input
                  type="text"
                  placeholder="ex : Taille, RAM, Type de Bois..."
                  value={customOptionLabel}
                  onChange={(e) => setCustomOptionLabel(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs outline-none text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550 block">3. Valeurs proposées (séparées par des virgules)</label>
                <input
                  type="text"
                  placeholder="ex : S, M, L, XL   OU   Chêne noble, Noyer..."
                  value={customOptionValuesText}
                  onChange={(e) => setCustomOptionValuesText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs outline-none text-slate-850 dark:text-white"
                />
                <span className="text-[9px] text-slate-400 font-mono italic block leading-relaxed mt-1">
                  Les valeurs de saisie manuelle libre "Autre (Saisir manuellement)..." sont rajoutées automatiquement.
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddCustomOption}
                className="w-full py-2.5 bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer shadow-sm text-center font-black"
              >
                + Insérer cette caractéristique
              </button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-50/30 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">Récapitulatif &amp; Enregistrement en Base</h4>
                  <p className="text-[10px] text-slate-500">Sauvegardez définitivement dans la base de données Firebase Firestore.</p>
                </div>

                <button
                  type="button"
                  disabled={isSavingCustomOptions}
                  onClick={handleSaveProductCustomOptions}
                  className="px-5 py-2.5 bg-[#2d4a22] hover:bg-[#1a2d15] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-75 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingCustomOptions ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {products.map((p, idx) => {
                  const pOptions = localCustomOptions[p.id] || [];
                  return (
                    <div key={`adm-opt-card-${p.id}-${idx}`} className="border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-905">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-xs font-extrabold text-[#2d4a22] dark:text-emerald-450 uppercase">{p.name}</span>
                        <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                          {pOptions.length} caractéristique(s)
                        </span>
                      </div>

                      {pOptions.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Aucune option spécifique. Utilise les suggestions de sa catégorie : <span className="font-bold underline">{p.category}</span></p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {pOptions.map((opt, oIdx) => (
                            <div key={`popt-${p.id}-${oIdx}`} className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-start text-[11px] gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{opt.label}</span>
                                <div className="flex flex-wrap gap-1">
                                  {opt.values.map((val, vIdx) => (
                                    <span key={`poptval-${p.id}-${oIdx}-${vIdx}`} className="text-[8px] bg-white dark:bg-slate-900 border border-slate-205 text-slate-500 px-1 py-0.5 rounded truncate max-w-[120px]">
                                      {val}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomOption(p.id, oIdx)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer la caractéristique"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-3 bg-amber-500/5">
                  <div className="flex items-center justify-between border-b border-amber-200/40 pb-2">
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-450 uppercase">PROJET LIBRE SUR-MESURE (+ Demander une création)</span>
                    <span className="text-[9px] font-mono bg-amber-500/10 px-2 py-0.5 rounded text-amber-700 font-bold">
                      {(localCustomOptions["custom_special_atelier"] || []).length} option(s)
                    </span>
                  </div>
                  {(localCustomOptions["custom_special_atelier"] || []).length === 0 ? (
                    <p className="text-[10px] text-amber-700/60 italic">Aucune option personnalisée configurée. Utilise la caractéristique intelligente par défaut.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(localCustomOptions["custom_special_atelier"] || []).map((opt, oIdx) => (
                        <div key={`specopt-${oIdx}`} className="bg-white/85 dark:bg-slate-950 p-3 rounded-xl border border-amber-500/10 flex justify-between items-start text-[11px] gap-2 animate-fadeIn">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 dark:text-slate-300">{opt.label}</span>
                            <div className="flex flex-wrap gap-1">
                              {opt.values.map((val, vIdx) => (
                                <span key={`specval-${oIdx}-${vIdx}`} className="text-[8px] bg-slate-50 dark:bg-slate-900 border border-slate-150 px-1 py-0.5 rounded text-slate-500">
                                  {val}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomOption("custom_special_atelier", oIdx)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
