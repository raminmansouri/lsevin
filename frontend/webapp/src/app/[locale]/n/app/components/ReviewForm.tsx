<<<<<<< HEAD
"use client";

import { useState } from "react";
import { X, Star, Check, AlertCircle, Upload, Plus, MinusCircle } from "lucide-react";

export type ReviewEligibilityState = "unknown" | "checking" | "allowed" | "blocked";
export type ReviewEligibilityReason = "not_signed_in" | "not_booked" | "already_reviewed" | "invalid_target" | null;
export type ReviewTargetType = "provider" | "service" | "specialist";

export type ReviewFormSubmitValue = {
  rating: number;
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  images: File[];
};
=======
"use client"

import { useState } from 'react';
import { X, Star, Check, AlertCircle, Upload } from 'lucide-react';
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

interface ReviewFormProps {
  providerName: string;
  treatmentName?: string;
  onClose: () => void;
<<<<<<< HEAD
  onSubmit?: (review: ReviewFormSubmitValue) => Promise<void> | void;
  locale?: string | null;
  eligibilityState?: ReviewEligibilityState;
  eligibilityMessage?: string | null;
}

const REVIEW_FORM_TEXT = {
  en: {
    checking: "Checking whether this booking can be reviewed...",
    submit: "Submit Review",
    submitting: "Submitting...",
    prosTitle: "Pros",
    consTitle: "Cons",
    prosPlaceholder: "Add a positive point, then press Enter",
    consPlaceholder: "Add a negative point, then press Enter",
    addPros: "Add pro",
    addCons: "Add con",
    prosHelp: "Optional, but helps other customers decide faster.",
  },
  fa: {
    checking: "در حال بررسی امکان ثبت نظر برای این رزرو...",
    submit: "ثبت نظر",
    submitting: "در حال ثبت...",
    prosTitle: "نقاط قوت",
    consTitle: "نقاط ضعف",
    prosPlaceholder: "یک نقطه قوت بنویسید و Enter بزنید",
    consPlaceholder: "یک نقطه ضعف بنویسید و Enter بزنید",
    addPros: "افزودن نقطه قوت",
    addCons: "افزودن نقطه ضعف",
    prosHelp: "اختیاری است، اما به تصمیم‌گیری سریع‌تر کاربران کمک می‌کند.",
  },
  ar: { checking: "جارٍ التحقق من إمكانية تقييم هذا الحجز...", submit: "إرسال التقييم", submitting: "جارٍ الإرسال...", prosTitle: "الإيجابيات", consTitle: "السلبيات", prosPlaceholder: "أضف نقطة إيجابية ثم اضغط Enter", consPlaceholder: "أضف نقطة سلبية ثم اضغط Enter", addPros: "إضافة إيجابية", addCons: "إضافة سلبية", prosHelp: "اختياري، لكنه يساعد العملاء الآخرين." },
  tr: { checking: "Bu rezervasyon için yorum yapılıp yapılamayacağı kontrol ediliyor...", submit: "Yorumu gönder", submitting: "Gönderiliyor...", prosTitle: "Artılar", consTitle: "Eksiler", prosPlaceholder: "Olumlu bir nokta ekleyin ve Enter'a basın", consPlaceholder: "Olumsuz bir nokta ekleyin ve Enter'a basın", addPros: "Artı ekle", addCons: "Eksi ekle", prosHelp: "İsteğe bağlıdır, ama diğer müşterilere yardımcı olur." },
  es: { checking: "Comprobando si esta reserva puede recibir una reseña...", submit: "Enviar reseña", submitting: "Enviando...", prosTitle: "Pros", consTitle: "Contras", prosPlaceholder: "Añade un punto positivo y pulsa Enter", consPlaceholder: "Añade un punto negativo y pulsa Enter", addPros: "Añadir pro", addCons: "Añadir contra", prosHelp: "Opcional, pero ayuda a otros clientes." },
  ku: { checking: "پشکنینی ئەوە دەکرێت کە ئایا ئەم حجزە دەتوانرێت هەڵسەنگاندنی بۆ بنووسرێت...", submit: "ناردنی هەڵسەنگاندن", submitting: "دەنێردرێت...", prosTitle: "خاڵە باشەکان", consTitle: "خاڵە لاوازەکان", prosPlaceholder: "خاڵێکی باش بنووسە و Enter دابگرە", consPlaceholder: "خاڵێکی لاواز بنووسە و Enter دابگرە", addPros: "زیادکردنی خاڵی باش", addCons: "زیادکردنی خاڵی لاواز", prosHelp: "ئارەزوومەندانەیە، بەڵام یارمەتی بەکارهێنەران دەدات." },
  de: { checking: "Es wird geprüft, ob diese Buchung bewertet werden kann...", submit: "Bewertung senden", submitting: "Wird gesendet...", prosTitle: "Vorteile", consTitle: "Nachteile", prosPlaceholder: "Positiven Punkt hinzufügen und Enter drücken", consPlaceholder: "Negativen Punkt hinzufügen und Enter drücken", addPros: "Vorteil hinzufügen", addCons: "Nachteil hinzufügen", prosHelp: "Optional, hilft aber anderen Kunden." },
  fr: { checking: "Vérification de l’éligibilité de cette réservation à un avis...", submit: "Envoyer l’avis", submitting: "Envoi...", prosTitle: "Points forts", consTitle: "Points faibles", prosPlaceholder: "Ajoutez un point fort puis appuyez sur Entrée", consPlaceholder: "Ajoutez un point faible puis appuyez sur Entrée", addPros: "Ajouter un point fort", addCons: "Ajouter un point faible", prosHelp: "Facultatif, mais utile pour les autres clients." },
} as const;

const REVIEW_ELIGIBILITY_TEXT = {
  en: {
    not_signed_in: "Please sign in first. Only booked users can submit a review.",
    not_booked: "Only booked users can submit a review for this item.",
    already_reviewed: "You have already submitted a review for this booked item.",
    invalid_target: "This review target is not available right now.",
  },
  fa: {
    not_signed_in: "لطفاً ابتدا وارد حساب کاربری شوید. فقط کاربرانی که رزرو داشته‌اند می‌توانند نظر ثبت کنند.",
    not_booked: "فقط کاربرانی که این مورد را رزرو کرده‌اند می‌توانند نظر ثبت کنند.",
    already_reviewed: "شما قبلاً برای این مورد رزروشده نظر ثبت کرده‌اید.",
    invalid_target: "امکان ثبت نظر برای این مورد در حال حاضر وجود ندارد.",
  },
  ar: { not_signed_in: "يرجى تسجيل الدخول أولاً. يمكن للمستخدمين الذين لديهم حجز فقط إرسال تقييم.", not_booked: "يمكن للمستخدمين الذين حجزوا هذا العنصر فقط إرسال تقييم.", already_reviewed: "لقد أرسلت تقييماً لهذا العنصر المحجوز من قبل.", invalid_target: "هدف التقييم هذا غير متاح حالياً." },
  tr: { not_signed_in: "Lütfen önce giriş yapın. Yalnızca rezervasyon yapan kullanıcılar yorum gönderebilir.", not_booked: "Yalnızca bu öğeyi rezerve eden kullanıcılar yorum gönderebilir.", already_reviewed: "Bu rezerve edilen öğe için zaten yorum gönderdiniz.", invalid_target: "Bu yorum hedefi şu anda kullanılamıyor." },
  es: { not_signed_in: "Inicia sesión primero. Solo los usuarios con reserva pueden enviar una reseña.", not_booked: "Solo los usuarios que reservaron este elemento pueden enviar una reseña.", already_reviewed: "Ya has enviado una reseña para este elemento reservado.", invalid_target: "Este destino de reseña no está disponible ahora." },
  ku: { not_signed_in: "تکایە سەرەتا بچۆ ژوورەوە. تەنها ئەو بەکارهێنەرانەی حجزبوونیان هەیە دەتوانن هەڵسەنگاندن بنێرن.", not_booked: "تەنها ئەو بەکارهێنەرانەی ئەم بابەتەیان حجز کردووە دەتوانن هەڵسەنگاندن بنێرن.", already_reviewed: "پێشتر هەڵسەنگاندنت بۆ ئەم بابەتەی حجز کراوە ناردووە.", invalid_target: "ئەم ئامانجی هەڵسەنگاندنە ئێستا بەردەست نییە." },
  de: { not_signed_in: "Bitte melden Sie sich zuerst an. Nur Nutzer mit Buchung können eine Bewertung abgeben.", not_booked: "Nur Nutzer, die diesen Eintrag gebucht haben, können eine Bewertung abgeben.", already_reviewed: "Sie haben für diesen gebuchten Eintrag bereits eine Bewertung abgegeben.", invalid_target: "Dieses Bewertungsziel ist derzeit nicht verfügbar." },
  fr: { not_signed_in: "Connectez-vous d’abord. Seuls les utilisateurs ayant réservé peuvent envoyer un avis.", not_booked: "Seuls les utilisateurs ayant réservé cet élément peuvent envoyer un avis.", already_reviewed: "Vous avez déjà envoyé un avis pour cet élément réservé.", invalid_target: "Cette cible d’avis n’est pas disponible pour le moment." },
} as const;

function reviewText(locale?: string | null) {
  const key = String(locale || "en").split("-")[0]?.toLowerCase() as keyof typeof REVIEW_FORM_TEXT;
  return REVIEW_FORM_TEXT[key] || REVIEW_FORM_TEXT.en;
}

export function getLocalizedReviewEligibilityMessage(locale?: string | null, reason?: ReviewEligibilityReason): string | null {
  if (!reason) return null;
  const key = String(locale || "en").split("-")[0]?.toLowerCase() as keyof typeof REVIEW_ELIGIBILITY_TEXT;
  const messages = REVIEW_ELIGIBILITY_TEXT[key] || REVIEW_ELIGIBILITY_TEXT.en;
  return messages[reason] || messages.not_booked;
}

export default function ReviewForm({ providerName, treatmentName, onClose, onSubmit, locale, eligibilityState = "unknown", eligibilityMessage }: ReviewFormProps) {
  const text = reviewText(locale);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [prosInput, setProsInput] = useState("");
  const [consInput, setConsInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
=======
  onSubmit?: (review: { rating: number; title: string; comment: string; images: File[] }) => void;
}

export default function ReviewForm({ providerName, treatmentName, onClose, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validate = () => {
    const newErrors: { rating?: string; comment?: string } = {};
<<<<<<< HEAD
    if (rating === 0) newErrors.rating = "Please select a rating";
    if (comment.trim().length < 10) newErrors.comment = "Review must be at least 10 characters";
=======
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    }

>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
<<<<<<< HEAD
    if (eligibilityState === "checking") return;
    if (eligibilityState === "blocked") {
      setSubmitStatus("error");
      setSubmitError(eligibilityMessage || null);
      return;
    }
    if (!validate()) return;
    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      await onSubmit?.({ rating, title, comment, pros, cons, images });
      setSubmitStatus("success");
      window.setTimeout(() => onClose(), 1200);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Could not submit review. Please try again.");
    }
  };

  const addHighlight = (type: "pros" | "cons") => {
    const value = (type === "pros" ? prosInput : consInput).trim();
    if (!value) return;
    if (type === "pros") {
      setPros((current) => Array.from(new Set([...current, value])).slice(0, 8));
      setProsInput("");
      return;
    }
    setCons((current) => Array.from(new Set([...current, value])).slice(0, 8));
    setConsInput("");
  };

  const removeHighlight = (type: "pros" | "cons", value: string) => {
    if (type === "pros") setPros((current) => current.filter((item) => item !== value));
    else setCons((current) => current.filter((item) => item !== value));
  };

  const handleHighlightKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, type: "pros" | "cons") => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addHighlight(type);
=======
    if (!validate()) return;

    setSubmitStatus('submitting');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (onSubmit) {
      onSubmit({ rating, title, comment, images });
    }

    setSubmitStatus('success');

    // Auto-close after success
    setTimeout(() => {
      onClose();
    }, 2000);
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
<<<<<<< HEAD
    const validFiles = files.filter((file) => file.type.startsWith("image/") && file.size < 5 * 1024 * 1024);
    setImages([...images, ...validFiles].slice(0, 4));
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white animate-slide-up sm:rounded-3xl">
        {submitStatus === "success" ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600"><Check size={40} className="text-white" /></div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Review Submitted!</h2>
            <p className="text-gray-600">Thank you for sharing your experience. Your review is pending admin approval before it becomes public.</p>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-gray-200 bg-white p-6 sm:rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div><h2 className="mb-1 text-xl font-bold text-gray-900">Write a Review</h2><p className="text-sm text-gray-600">{providerName}{treatmentName && ` • ${treatmentName}`}</p></div>
                <button onClick={onClose} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100" type="button"><X size={24} className="text-gray-500" /></button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {eligibilityState === "checking" ? <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"><AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{text.checking}</span></div> : null}
              {eligibilityState === "blocked" && eligibilityMessage ? <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{eligibilityMessage}</span></div> : null}
              {submitError ? <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{submitError}</span></div> : null}

              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-900">Overall Rating <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="transition-transform hover:scale-110 active:scale-95"><Star size={40} className={`${star <= (hoverRating || rating) ? "fill-[#eacb7f] text-[#eacb7f]" : "text-gray-300"} transition-colors`} /></button>
                  ))}
                  {rating > 0 ? <span className="ml-3 text-lg font-bold text-gray-900">{rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}</span> : null}
                </div>
                {errors.rating ? <p className="mt-2 flex items-center gap-1 text-sm text-red-600"><AlertCircle size={14} />{errors.rating}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Treatment / Title (Optional)</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Hair transplant, dental care, spa day" maxLength={100} className="h-12 w-full rounded-xl border-2 border-gray-300 px-4 transition-colors focus:border-[#083f30] focus:outline-none" />
                <p className="mt-1 text-xs text-gray-500">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Your Review <span className="text-red-500">*</span></label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details of your own experience at this place" rows={6} maxLength={1000} className={`w-full resize-none rounded-xl border-2 px-4 py-3 transition-colors focus:outline-none ${errors.comment ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#083f30]"}`} />
                <div className="mt-1 flex items-center justify-between"><p className="text-xs text-gray-500">{comment.length}/1000 characters</p>{errors.comment ? <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} />{errors.comment}</p> : null}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="mb-2 block text-sm font-semibold text-emerald-900">{text.prosTitle}</label>
                  <div className="flex gap-2"><input type="text" value={prosInput} onChange={(e) => setProsInput(e.target.value)} onKeyDown={(event) => handleHighlightKeyDown(event, "pros")} placeholder={text.prosPlaceholder} maxLength={80} className="h-11 min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" /><button type="button" onClick={() => addHighlight("pros")} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white transition-colors hover:bg-emerald-800" aria-label={text.addPros}><Plus size={18} /></button></div>
                  {pros.length ? <div className="mt-3 flex flex-wrap gap-2">{pros.map((item) => <button key={item} type="button" onClick={() => removeHighlight("pros", item)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">+ {item} <MinusCircle size={13} /></button>)}</div> : null}
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <label className="mb-2 block text-sm font-semibold text-rose-900">{text.consTitle}</label>
                  <div className="flex gap-2"><input type="text" value={consInput} onChange={(e) => setConsInput(e.target.value)} onKeyDown={(event) => handleHighlightKeyDown(event, "cons")} placeholder={text.consPlaceholder} maxLength={80} className="h-11 min-w-0 flex-1 rounded-xl border border-rose-200 bg-white px-3 text-sm outline-none focus:border-rose-600" /><button type="button" onClick={() => addHighlight("cons")} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rose-700 text-white transition-colors hover:bg-rose-800" aria-label={text.addCons}><Plus size={18} /></button></div>
                  {cons.length ? <div className="mt-3 flex flex-wrap gap-2">{cons.map((item) => <button key={item} type="button" onClick={() => removeHighlight("cons", item)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-800 shadow-sm">- {item} <MinusCircle size={13} /></button>)}</div> : null}
                </div>
                <p className="text-muted-foreground md:col-span-2 -mt-2 text-xs">{text.prosHelp}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Add Photos (Optional)</label>
                {images.length > 0 ? <div className="mb-3 grid grid-cols-4 gap-3">{images.map((image, index) => <div key={`${image.name}-${index}`} className="relative aspect-square"><img src={URL.createObjectURL(image)} alt={`Upload ${index + 1}`} className="h-full w-full rounded-xl object-cover" /><button onClick={() => removeImage(index)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700" type="button"><X size={14} /></button></div>)}</div> : null}
                {images.length < 4 ? <div className="relative"><input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="review-images" /><label htmlFor="review-images" className="flex h-24 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 transition-all hover:border-[#083f30] hover:bg-gray-50"><Upload size={24} className="text-gray-400" /><div className="text-center"><p className="text-sm font-semibold text-gray-900">Attach Photos</p><p className="text-xs text-gray-500">Preview only until your media upload endpoint is connected</p></div></label></div> : null}
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><h4 className="mb-2 text-sm font-semibold text-blue-900">Review Guidelines</h4><ul className="list-inside list-disc space-y-1 text-sm text-blue-800"><li>Be honest and fair</li><li>Share your personal experience</li><li>Avoid offensive language</li><li>Include specific details about the service</li></ul></div>
            </div>

            <div className="sticky bottom-0 rounded-b-3xl border-t border-gray-200 bg-gray-50 p-6 sm:rounded-b-3xl">
              <div className="flex gap-3"><button onClick={onClose} className="h-14 flex-1 rounded-xl border-2 border-gray-300 font-bold text-gray-900 transition-all hover:bg-white active:scale-95" type="button">Cancel</button><button onClick={handleSubmit} disabled={submitStatus === "submitting" || eligibilityState === "checking" || eligibilityState === "blocked"} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#083f30] font-bold text-white transition-all hover:bg-[#0a5a44] active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300" type="button">{submitStatus === "submitting" ? <><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>{text.submitting}</span></> : text.submit}</button></div>
=======
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size < 5 * 1024 * 1024;
      return isImage && isUnder5MB;
    });

    setImages([...images, ...validFiles].slice(0, 4)); // Max 4 images
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {submitStatus === 'success' ? (
          // Success State
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
            <p className="text-gray-600">
              Thank you for sharing your experience. Your review helps others make informed decisions.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-3xl sm:rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Write a Review</h2>
                  <p className="text-sm text-gray-600">
                    {providerName}{treatmentName && ` • ${treatmentName}`}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={40}
                        className={`${
                          star <= (hoverRating || rating)
                            ? 'fill-[#eacb7f] text-[#eacb7f]'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-lg font-bold text-gray-900">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                    </span>
                  )}
                </div>
                {errors.rating && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.rating}
                  </p>
                )}
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum up your experience"
                  maxLength={100}
                  className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your own experience at this place"
                  rows={6}
                  maxLength={1000}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors resize-none ${
                    errors.comment 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-[#083f30]'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{comment.length}/1000 characters</p>
                  {errors.comment && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.comment}
                    </p>
                  )}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Add Photos (Optional)
                </label>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 4 && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="review-images"
                    />
                    <label
                      htmlFor="review-images"
                      className="flex items-center justify-center gap-3 w-full h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#083f30] hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <Upload size={24} className="text-gray-400" />
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-sm">Upload Photos</p>
                        <p className="text-xs text-gray-500">Max 4 images, up to 5MB each</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Review Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Be honest and fair</li>
                  <li>Share your personal experience</li>
                  <li>Avoid offensive language</li>
                  <li>Include specific details about the service</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 rounded-b-3xl sm:rounded-b-3xl">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-14 rounded-xl border-2 border-gray-300 font-bold text-gray-900 hover:bg-white transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitStatus === 'submitting'}
                  className="flex-1 h-14 rounded-xl bg-[#083f30] text-white font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitStatus === 'submitting' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          </>
        )}
      </div>
    </div>
  );
}
