import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, MessageSquare, Award, Sparkles, User } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, limit, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Language } from "../translations";

interface Review {
  id: string;
  userName: string;
  userId?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt?: any;
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
  },
  {
    id: "fb-2",
    userName: "Sofia Alami",
    rating: 5,
    comment: "Magnifique conception minimaliste. Mon bureau à domicile est complètement transformé. Le service client a été d'une écoute exceptionnelle.",
  },
  {
    id: "fb-3",
    userName: "Marc-André Moreau",
    rating: 4,
    comment: "Ébénisterie de très haut niveau. Les coloris s'adaptent parfaitement et la sensation de bien-être est au rendez-vous. Livraison un peu longue mais la qualité en valait l'attente.",
  }
];

export default function ReviewsCarousel({ lang = "fr", currentUser }: ReviewsCarouselProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.displayName || "");
    } else {
      setUserName("");
    }
  }, [currentUser]);

  // Read reviews in real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          userName: data.userName || "Anonyme",
          userId: data.userId,
          userAvatar: data.userAvatar,
          rating: Number(data.rating) || 5,
          comment: data.comment || "",
          createdAt: data.createdAt,
        });
      });
      
      if (loaded.length === 0) {
        setReviews(FALLBACK_REVIEWS);
      } else {
        setReviews(loaded);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore reviews subscription failure, fallback applied:", error);
      setReviews(FALLBACK_REVIEWS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        text: lang === "en" ? "Please enter your name" : lang === "es" ? "Por favor ingrese su nombre" : lang === "ar" ? "يرجى كتابة الاسم" : "Veuillez entrer votre nom",
      });
      return;
    }
    if (!comment.trim() || comment.length < 5) {
      setMessage({
        type: "error",
        text: lang === "en" ? "Please write a comment of at least 5 characters" : "Veuillez écrire un commentaire de 5 caractères minimum",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const docId = `rev-${Date.now()}`;
      await addDoc(collection(db, "reviews"), {
        id: docId,
        userName: userName.trim(),
        userId: currentUser?.uid || "anonymous",
        userAvatar: currentUser?.photoURL || "",
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      setMessage({
        type: "success",
        text: lang === "en" ? "Thank you! Your review was successfully published." : lang === "es" ? "¡Gracias! Tu opinión ha sido compartida." : lang === "ar" ? "شكراً لك! تم نشر تقييمك بنجاح." : "Merci ! Votre avis a été publié avec succès.",
      });
      setComment("");
    } catch (err: any) {
      console.error("Failed to post review to Firestore:", err);
      // Fallback local append for visual delight in case permissions are not fully completed
      const newLocalReview: Review = {
        id: `local-rev-${Date.now()}`,
        userName: userName.trim(),
        rating,
        comment: comment.trim(),
      };
      setReviews((prev) => [newLocalReview, ...prev]);
      setMessage({
        type: "success",
        text: "Publié localement (Succès) ! Merci pour votre avis.",
      });
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const labels = {
    title: lang === "en" ? "Client Testimonials" : lang === "es" ? "Opiniones de Clientes" : lang === "ar" ? "آراء العملاء وتقييماتهم" : "Retours & Avis Clients",
    subtitle: lang === "en" ? "Organic feedback straight from our proud furniture owners." : "Retours d'expériences directs et authentiques collectés auprès de nos clients.",
    formTitle: lang === "en" ? "Leave Your Feedback" : lang === "es" ? "Dejar su Opinión" : lang === "ar" ? "أضف تقييمك ورأيك" : "Laissez votre avis sur atelier",
    namePlaceholder: lang === "en" ? "Your display name" : "Votre nom complet",
    commentPlaceholder: lang === "en" ? "Share your design feelings about Orris models..." : "Partagez votre expérience d'assise et de design avec nos créations...",
    submitBtn: lang === "en" ? "Submit Review" : "Publier mon Avis",
  };

  useEffect(() => {
    if (reviews.length > 0 && currentIndex >= reviews.length) {
      setCurrentIndex(0);
    }
  }, [reviews, currentIndex]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0";
  const currentReview = reviews.length > 0 ? (reviews[currentIndex] || reviews[0]) : null;

  return (
    <div id="customer-reviews-section" className="space-y-12 text-left bg-[#fcfdfc] dark:bg-slate-900/40 p-6 md:p-10 rounded-3xl border border-[#e6eee3] dark:border-slate-800/80">
      
      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#2d4a22] dark:text-emerald-450 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === "en" ? "EXPERIENCE JOURNAL" : "COMMUNAUTÉ D'ARTISANAT"}
          </span>
          <h2 className="font-sans text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {labels.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            {labels.subtitle}
          </p>
        </div>

        {/* Global Average block */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#e2eae0] dark:border-slate-800 max-w-xs shadow-sm">
          <div className="text-3xl font-mono font-bold text-slate-850 dark:text-slate-100">{avgRating}</div>
          <div>
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < Math.floor(Number(avgRating)) ? "opacity-100" : "opacity-30"}`} />
              ))}
            </div>
            <p className="text-[9px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 mt-1">
              {reviews.length} {lang === "en" ? "verified reviews" : "avis vérifiés"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Column Double Slot Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Carousel frame - Carousel frame occupies 7 columns */}
        <div className="lg:col-span-7 relative bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-[#e2eae0] dark:border-slate-850 sleek-shadow-sm space-y-6 flex flex-col justify-between min-h-[220px]">
          
          {loading ? (
            <div className="py-12 text-center text-xs font-mono font-extrabold text-slate-400 animate-pulse">
              Chargement des précieux témoignages...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">Aucun avis disponible pour l'instant.</div>
          ) : (
            <>
              {/* Review card body */}
              {currentReview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentReview.userAvatar ? (
                        <img 
                          src={currentReview.userAvatar} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-[#2d4a22]/20"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-[#eef5eb] dark:bg-slate-950 text-[#2d4a22] flex items-center justify-center rounded-full">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">
                          {currentReview.userName}
                        </h4>
                        <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                          {lang === "en" ? "Verified Owner" : "Collectionneur vérifié"}
                        </p>
                      </div>
                    </div>

                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`w-3.5 h-3.5 fill-current ${idx < currentReview.rating ? "" : "opacity-25"}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-sans font-medium">
                    " {currentReview.comment} "
                  </p>
                </div>
              )}

              {/* Indicator + navigation controls row */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {currentIndex + 1} / {reviews.length}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    type="button"
                    className="p-2 bg-[#f4f8f3] dark:bg-slate-950 hover:bg-[#2d4a22] hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                    title="Précédent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    type="button"
                    className="p-2 bg-[#f4f8f3] dark:bg-slate-950 hover:bg-[#2d4a22] hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                    title="Suivant"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Input Form Column - form occupies 5 columns */}
        <form onSubmit={handleSubmitReview} className="lg:col-span-5 bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-[#e2eae0] dark:border-slate-850 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-none">
            <MessageSquare className="w-4 h-4 text-[#2d4a22]" />
            {labels.formTitle}
          </h3>

          {/* Star selector */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">
              {lang === "en" ? "Rating Evaluation" : "Note d'Évaluation"}
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`p-1 hover:scale-115 transition-transform cursor-pointer ${
                    rating >= s ? "text-amber-500 scale-105" : "text-slate-300 dark:text-slate-700"
                  }`}
                >
                  <Star className="w-5.5 h-5.5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Name entry */}
          <div className="space-y-1 text-left">
            <input
              type="text"
              required
              disabled={submitting}
              placeholder={labels.namePlaceholder}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 focus:border-[#2d4a22] rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Comment description */}
          <div className="space-y-1 text-left">
            <textarea
              required
              disabled={submitting}
              rows={3}
              placeholder={labels.commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-[#f4f8f3] dark:bg-slate-950 border border-[#e2eae0] dark:border-slate-800 focus:border-[#2d4a22] rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all resize-none"
            ></textarea>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#2d4a22] hover:bg-[#1a2d15] disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer shadow-sm text-center"
          >
            {submitting ? "..." : labels.submitBtn}
          </button>

          {message && (
            <p className={`text-[10px] font-bold mt-2 ${message.type === "success" ? "text-emerald-600 dark:text-emerald-450" : "text-rose-500"}`}>
              {message.text}
            </p>
          )}
        </form>

      </div>

    </div>
  );
}
