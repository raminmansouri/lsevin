"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { X, Star, Check, AlertCircle, Upload, Plus, MinusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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

interface ReviewFormProps {
  providerName: string;
  treatmentName?: string;
  onClose: () => void;
  onSubmit?: (review: ReviewFormSubmitValue) => Promise<void> | void;
  locale?: string | null;
  eligibilityState?: ReviewEligibilityState;
  eligibilityMessage?: string | null;
}

export default function ReviewForm({
  providerName,
  treatmentName,
  onClose,
  onSubmit,
  eligibilityState = "unknown",
  eligibilityMessage,
}: ReviewFormProps) {
  const t = useTranslations("components.reviewForm");
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
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validate = () => {
    const newErrors: { rating?: string; comment?: string } = {};
    if (rating === 0) newErrors.rating = t("validation.ratingRequired");
    if (comment.trim().length < 10) newErrors.comment = t("validation.reviewMinLength", { min: 10 });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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
      setSubmitError(error instanceof Error ? error.message : t("submitError"));
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

  const handleHighlightKeyDown = (event: KeyboardEvent<HTMLInputElement>, type: "pros" | "cons") => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addHighlight(type);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith("image/") && file.size < 5 * 1024 * 1024);
    setImages([...images, ...validFiles].slice(0, 4));
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  const ratingLabels = {
    1: t("ratingLabels.1"),
    2: t("ratingLabels.2"),
    3: t("ratingLabels.3"),
    4: t("ratingLabels.4"),
    5: t("ratingLabels.5"),
  } as const;
  const ratingLabel = rating > 0 ? ratingLabels[rating as keyof typeof ratingLabels] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white animate-slide-up sm:rounded-3xl">
        {submitStatus === "success" ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600">
              <Check size={40} className="text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">{t("successTitle")}</h2>
            <p className="text-gray-600">{t("successDescription")}</p>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-gray-200 bg-white p-6 sm:rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-gray-900">{t("title")}</h2>
                  <p className="text-sm text-gray-600">{providerName}{treatmentName && ` • ${treatmentName}`}</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                  type="button"
                  aria-label={t("close")}
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {eligibilityState === "checking" ? (
                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{t("checking")}</span>
                </div>
              ) : null}
              {eligibilityState === "blocked" && eligibilityMessage ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{eligibilityMessage}</span>
                </div>
              ) : null}
              {submitError ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-900">
                  {t("overallRating")} <span className="text-red-500">*</span>
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
                      aria-label={t("selectRating", { rating: star })}
                    >
                      <Star size={40} className={`${star <= (hoverRating || rating) ? "fill-[#eacb7f] text-[#eacb7f]" : "text-gray-300"} transition-colors`} />
                    </button>
                  ))}
                  {ratingLabel ? <span className="ml-3 text-lg font-bold text-gray-900">{ratingLabel}</span> : null}
                </div>
                {errors.rating ? <p className="mt-2 flex items-center gap-1 text-sm text-red-600"><AlertCircle size={14} />{errors.rating}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">{t("treatmentTitleLabel")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("treatmentTitlePlaceholder")}
                  maxLength={100}
                  className="h-12 w-full rounded-xl border-2 border-gray-300 px-4 transition-colors focus:border-[#083f30] focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">{t("characters", { current: title.length, max: 100 })}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  {t("reviewLabel")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("reviewPlaceholder")}
                  rows={6}
                  maxLength={1000}
                  className={`w-full resize-none rounded-xl border-2 px-4 py-3 transition-colors focus:outline-none ${errors.comment ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#083f30]"}`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{t("characters", { current: comment.length, max: 1000 })}</p>
                  {errors.comment ? <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} />{errors.comment}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="mb-2 block text-sm font-semibold text-emerald-900">{t("prosTitle")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prosInput}
                      onChange={(e) => setProsInput(e.target.value)}
                      onKeyDown={(event) => handleHighlightKeyDown(event, "pros")}
                      placeholder={t("prosPlaceholder")}
                      maxLength={80}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => addHighlight("pros")}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white transition-colors hover:bg-emerald-800"
                      aria-label={t("addPros")}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {pros.length ? <div className="mt-3 flex flex-wrap gap-2">{pros.map((item) => <button key={item} type="button" onClick={() => removeHighlight("pros", item)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">+ {item} <MinusCircle size={13} /></button>)}</div> : null}
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <label className="mb-2 block text-sm font-semibold text-rose-900">{t("consTitle")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={consInput}
                      onChange={(e) => setConsInput(e.target.value)}
                      onKeyDown={(event) => handleHighlightKeyDown(event, "cons")}
                      placeholder={t("consPlaceholder")}
                      maxLength={80}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-rose-200 bg-white px-3 text-sm outline-none focus:border-rose-600"
                    />
                    <button
                      type="button"
                      onClick={() => addHighlight("cons")}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rose-700 text-white transition-colors hover:bg-rose-800"
                      aria-label={t("addCons")}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {cons.length ? <div className="mt-3 flex flex-wrap gap-2">{cons.map((item) => <button key={item} type="button" onClick={() => removeHighlight("cons", item)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-800 shadow-sm">- {item} <MinusCircle size={13} /></button>)}</div> : null}
                </div>
                <p className="text-muted-foreground md:col-span-2 -mt-2 text-xs">{t("prosHelp")}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">{t("addPhotosLabel")}</label>
                {images.length > 0 ? (
                  <div className="mb-3 grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <div key={`${image.name}-${index}`} className="relative aspect-square">
                        <img src={URL.createObjectURL(image)} alt={t("uploadedImageAlt", { index: index + 1 })} className="h-full w-full rounded-xl object-cover" />
                        <button onClick={() => removeImage(index)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700" type="button" aria-label={t("removePhoto")}> <X size={14} /></button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {images.length < 4 ? (
                  <div className="relative">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="review-images" />
                    <label htmlFor="review-images" className="flex h-24 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 transition-all hover:border-[#083f30] hover:bg-gray-50">
                      <Upload size={24} className="text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">{t("attachPhotos")}</p>
                        <p className="text-xs text-gray-500">{t("photoPreviewHint")}</p>
                      </div>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-blue-900">{t("guidelinesTitle")}</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>{t("guidelines.honest")}</li>
                  <li>{t("guidelines.personalExperience")}</li>
                  <li>{t("guidelines.noOffensiveLanguage")}</li>
                  <li>{t("guidelines.specificDetails")}</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 rounded-b-3xl border-t border-gray-200 bg-gray-50 p-6 sm:rounded-b-3xl">
              <div className="flex gap-3">
                <button onClick={onClose} className="h-14 flex-1 rounded-xl border-2 border-gray-300 font-bold text-gray-900 transition-all hover:bg-white active:scale-95" type="button">{t("cancel")}</button>
                <button onClick={handleSubmit} disabled={submitStatus === "submitting" || eligibilityState === "checking" || eligibilityState === "blocked"} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#083f30] font-bold text-white transition-all hover:bg-[#0a5a44] active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300" type="button">
                  {submitStatus === "submitting" ? <><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>{t("submitting")}</span></> : t("submit")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
