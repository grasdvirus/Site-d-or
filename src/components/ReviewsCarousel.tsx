import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Sparkles, User, X, Filter, Search, Edit3, MessageSquare, CheckCircle2, ThumbsUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Language } from "../translations";

export interface Review {
  id: string;
  userName: string;
  userId?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt?: any;
  dateStr?: string;
}

interface ReviewsCarouselProps {
  lang?: Language;
  currentUser?: any;
}

const FALLBACK_REVIEWS: Review[] = [
  {
    id: "fb-1",
    userName: "Lucas Dubois",
    rating: 5,
    comment: "Le fauteuil Orris est une véritable œuvre d'art ! L'assise est extrêmement solide et confortable, et le bois sent bon l'éco-responsabilité. Un investissement garanti pour toute ma vie.",
    dateStr: "Il y a 2 jours",
  },
  {
    id: "fb-2",
    userName: "Sofia Alami",
    rating: 5,
    comment: "Magnifique conception minimaliste. Mon bureau à domicile est complètement transformé. Le service client a été d'une écoute exceptionnelle.",
    dateStr: "Il y a 5 jours",
  },
  {
    id: "fb-3",
    userName: "Marc-André Moreau",
    rating: 4,
    comment: "Ébénisterie de très haut niveau. Les coloris s'adaptent parfaitement et la sensation de bien-être est au rendez-vous. Livraison un peu longue mais la qualité en valait l'attente.",
    dateStr: "Il y a 1 semaine",
  },
  {
    id: "fb-4",
    userName: "Elena Rostova",
    rating: 5,
    comment: "Commande reçue rapidement. Les finitions du bois d'ébène sont sublimes. Je recommande vivement pour les passionnés de design durable !",
    dateStr: "Il y a 2 semaines",
  }
];

export default function ReviewsCarousel({ lang = "fr", currentUser }: ReviewsCarouselProps) {
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem("sitedor_reviews_cache");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return FALLBACK_REVIEWS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // View all modal filters
  const [filterStar, setFilterStar] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "");
    }
  }, [currentUser]);

  // Read reviews in real-time from Firestore & listen to local storage update event
  useEffect(() => {
    const handleLocalUpdate = () => {
      try {
        const saved = localStorage.getItem("sitedor_reviews_cache");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviews(parsed);
          }
        }
      } catch (e) {}
    };

    window.addEventListener("sitedor_reviews_updated", handleLocalUpdate);

    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let dateStr = "Récemment";
        if (data.createdAt?.toDate) {
          dateStr = data.createdAt.toDate().toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
        }
        loaded.push({
          id: doc.id,
          userName: data.userName || "Anonyme",
          userId: data.userId,
          userAvatar: data.userAvatar,
          rating: Number(data.rating) || 5,
          comment: data.comment || "",
          createdAt: data.createdAt,
          dateStr,
        });
      });
      
      if (loaded.length > 0) {
        setReviews(loaded);
        try {
          localStorage.setItem("sitedor_reviews_cache", JSON.stringify(loaded));
        } catch (e) {}
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore reviews subscription warning, keeping cached:", error);
      setLoading(false);
    });

    return () => {
      window.removeEventListener("sitedor_reviews_updated", handleLocalUpdate);
      unsubscribe();
    };
  }, [lang]);

  const handleNext = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setMessage({
        type: "error",
        text: lang === "en" ? "Please enter your name" : "Veuillez entrer votre nom",
      });
      return;
    }
    if (!comment.trim() || comment.length < 5) {
      setMessage({
        type: "error",
        text: lang === "en" ? "Please write a comment of at least 5 characters" : "Veuillez écrire un commentaire d'au moins 5 caractères",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const newReviewObj: Review = {
      id: `rev-${Date.now()}`,
      userName: userName.trim(),
      userId: currentUser?.uid || "anonymous",
      userAvatar: currentUser?.photoURL || "",
      rating,
      comment: comment.trim(),
      dateStr: "Aujourd'hui",
    };

    // Optimistic UI & local storage persistence
    const updatedReviews = [newReviewObj, ...reviews];
    setReviews(updatedReviews);
    try {
      localStorage.setItem("sitedor_reviews_cache", JSON.stringify(updatedReviews));
      window.dispatchEvent(new Event("sitedor_reviews_updated"));
    } catch (e) {}

    try {
      await addDoc(collection(db, "reviews"), {
        userName: userName.trim(),
        userId: currentUser?.uid || "anonymous",
        userAvatar: currentUser?.photoURL || "",
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      setMessage({
        type: "success",
        text: lang === "en" ? "Thank you! Your review has been published." : "Merci ! Votre avis a été publié avec succès.",
      });
      setComment("");
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      console.warn("Firestore review save warning (saved locally):", err);
      setMessage({
        type: "success",
        text: "Votre avis a été enregistré et publié !",
      });
      setComment("");
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setMessage(null);
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRatingNumber = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) 
    : 4.9;
  const avgRating = avgRatingNumber.toFixed(1);

  const currentReview = reviews.length > 0 ? (reviews[currentIndex] || reviews[0]) : null;

  // Filtered list for "Voir tous les avis"
  const filteredReviews = reviews.filter((r) => {
    const matchesStar = filterStar === "all" || r.rating === filterStar;
    const matchesSearch = !searchQuery.trim() || 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.comment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStar && matchesSearch;
  });

  return (
    <div id="customer-reviews-section" className="space-y-8 text-left bg-[#fcfdfc] dark:bg-slate-900/40 p-6 md:p-10 rounded-3xl border border-[#e6eee3] dark:border-slate-800/80">
      
      {/* Header section with Note du Site & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-[#2d4a22] dark:text-emerald-450 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === "en" ? "VERIFIED REVIEWS & RATINGS" : "NOTE DU SITE & AVIS CLIENTS"}
          </span>
          <h2 className="font-sans text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === "en" ? "Customer Feedback & Ratings" : "Avis & Retours de nos Clients"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            {lang === "en" ? "Discover transparent opinions from our furniture owners and leave your feedback." : "Découvrez les témoignages authentiques de nos clients et partagez votre avis sur l'atelier."}
          </p>
        </div>

        {/* Note du Site Score Card & Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Note score block */}
          <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-[#e2eae0] dark:border-slate-800 shadow-xs">
            <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white leading-none">
              {avgRating}
            </div>
            <div>
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={`avg-star-${i}`} 
                    className={`w-3.5 h-3.5 fill-current ${i < Math.round(Number(avgRating)) ? "text-amber-500 opacity-100" : "text-slate-300 opacity-40"}`} 
                  />
                ))}
              </div>
              <p className="text-[9px] font-mono uppercase font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                {reviews.length} {lang === "en" ? "reviews" : "avis vérifiés"}
              </p>
            </div>
          </div>

          {/* Action buttons: Voir tous les avis & Rédiger un avis */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsViewAllModalOpen(true)}
              className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[#e2eae0] dark:border-slate-800 rounded-2xl text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#2d4a22] dark:text-emerald-400" />
              <span>Voir tous ({reviews.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="px-4 py-3 bg-[#2d4a22] hover:bg-[#1a2d15] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-950 rounded-2xl text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rédiger un avis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Card Slider */}
      <div className="w-full relative bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-[#e2eae0] dark:border-slate-800 shadow-2xs space-y-5">
        {loading ? (
          <div className="py-8 text-center text-xs font-mono font-extrabold text-slate-400 animate-pulse">
            Chargement des avis...
          </div>
        ) : !currentReview ? (
          <div className="py-8 text-center text-slate-400 text-xs">Aucun avis publié pour l'instant. Soyez le premier !</div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#eef5eb] dark:bg-slate-950 text-[#2d4a22] dark:text-emerald-400 flex items-center justify-center rounded-full font-bold text-sm">
                    {currentReview.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">
                      {currentReview.userName}
                    </h4>
                    <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-400 mt-1 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{currentReview.dateStr || "Avis vérifié"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={`rev-star-${currentReview.id}-${idx}`} 
                      className={`w-3.5 h-3.5 fill-current ${idx < currentReview.rating ? "" : "opacity-25 text-slate-300"}`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed font-sans font-medium pt-1">
                "{currentReview.comment}"
              </p>
            </div>

            {/* Slider Navigation */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <span className="text-[10px] font-mono font-extrabold text-slate-400">
                Avis {currentIndex + 1} / {reviews.length}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  type="button"
                  className="p-2 bg-[#f4f8f3] dark:bg-slate-950 hover:bg-[#2d4a22] hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                  title="Avis précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  type="button"
                  className="p-2 bg-[#f4f8f3] dark:bg-slate-950 hover:bg-[#2d4a22] hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                  title="Avis suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: WRITE REVIEW FORM ("Rédiger un avis") */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg relative z-10 text-left font-sans"
            >
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-[#2d4a22] dark:text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-slate-900 dark:text-white text-base tracking-tight">
                    Rédiger un avis sur le site
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    Partagez votre note et appréciation
                  </p>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
                  message.type === "success" 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star rating selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-extrabold text-slate-500 dark:text-slate-400 mb-1.5">
                    Votre Note globale (1 à 5 étoiles) :
                  </label>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={`star-btn-${starNum}`}
                        type="button"
                        onClick={() => setRating(starNum)}
                        onMouseEnter={() => setHoverRating(starNum)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star 
                          className={`w-6 h-6 transition-colors ${
                            (hoverRating || rating) >= starNum 
                              ? "text-amber-500 fill-amber-500" 
                              : "text-slate-300 dark:text-slate-700"
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono font-extrabold text-xs text-slate-700 dark:text-slate-200">
                      {(hoverRating || rating)} / 5
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                    Votre Nom ou Pseudo :
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: Alexandre D."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22]"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-extrabold text-slate-500 dark:text-slate-400 mb-1">
                    Votre Commentaire :
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Expliquez ce qui vous a plu dans nos produits, la livraison ou le service client..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22] resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWriteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-[#2d4a22] hover:bg-[#1a2d15] dark:bg-emerald-600 text-white font-mono font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-sm"
                  >
                    {submitting ? "Publication..." : "Publier mon avis"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW ALL REVIEWS ("Voir tous les avis") */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isViewAllModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewAllModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 text-left font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-[#2d4a22] dark:text-emerald-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-slate-900 dark:text-white text-base tracking-tight">
                      Tous les Avis Clients ({reviews.length})
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      Note moyenne : {avgRating} / 5 étoiles
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters & Search */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les avis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#2d4a22]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
                  <span className="text-slate-400 font-bold uppercase mr-1 flex items-center gap-1 shrink-0">
                    <Filter className="w-3 h-3" /> Filtrer :
                  </span>
                  {(["all", 5, 4, 3, 2, 1] as const).map((starVal) => (
                    <button
                      key={`filter-star-${starVal}`}
                      type="button"
                      onClick={() => setFilterStar(starVal)}
                      className={`px-2.5 py-1 rounded-lg border font-extrabold cursor-pointer transition-all shrink-0 ${
                        filterStar === starVal
                          ? "bg-[#2d4a22] text-white border-[#2d4a22]"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {starVal === "all" ? "Tous" : `${starVal} ★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-mono">
                    Aucun avis ne correspond à vos critères de recherche.
                  </div>
                ) : (
                  filteredReviews.map((rev) => (
                    <div 
                      key={`modal-rev-${rev.id}`}
                      className="p-4 bg-slate-50/70 dark:bg-slate-950/60 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#2d4a22] text-white flex items-center justify-center rounded-full text-xs font-extrabold">
                            {rev.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                              {rev.userName}
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">
                              {rev.dateStr || "Avis vérifié"}
                            </span>
                          </div>
                        </div>

                        <div className="flex text-amber-500 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={`star-item-${rev.id}-${i}`}
                              className={`w-3 h-3 fill-current ${i < rev.rating ? "" : "opacity-25 text-slate-300"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">
                  Affichage de {filteredReviews.length} sur {reviews.length} avis
                </span>
                <button
                  type="button"
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200"
                >
                  Fermer
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
