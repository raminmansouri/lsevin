"use client";

import { useState } from "react";
import { X, Star, Check, AlertCircle, Upload } from "lucide-react";

interface ReviewFormProps {
  providerName: string;
  treatmentName?: string;
  onClose: () => void;
  onSubmit?: (review: { rating: number; title: string; comment: string; images: File[] }) => Promise<void> | void;
}

export default function ReviewForm({ providerName, treatmentName, onClose, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validate = () => {
    const newErrors: { rating?: string; comment?: string } = {};

    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (comment.trim().length < 10) {
      newErrors.comment = "Review must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitStatus("submitting");
    setSubmitError(null);

    try {
      await onSubmit?.({ rating, title, comment, images });
      setSubmitStatus("success");
      window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Could not submit review. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnder5MB = file.size < 5 * 1024 * 1024;
      return isImage && isUnder5MB;
    });

    setImages([...images, ...validFiles].slice(0, 4));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white animate-slide-up sm:rounded-3xl">
        {submitStatus === "success" ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600">
              <Check size={40} className="text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Review Submitted!</h2>
            <p className="text-gray-600">Thank you for sharing your experience. Your review helps others make informed decisions.</p>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-gray-200 bg-white p-6 sm:rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-gray-900">Write a Review</h2>
                  <p className="text-sm text-gray-600">
                    {providerName}{treatmentName && ` • ${treatmentName}`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                  type="button"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {submitError ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-900">
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
                        className={`${star <= (hoverRating || rating) ? "fill-[#eacb7f] text-[#eacb7f]" : "text-gray-300"} transition-colors`}
                      />
                    </button>
                  ))}
                  {rating > 0 ? (
                    <span className="ml-3 text-lg font-bold text-gray-900">
                      {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                    </span>
                  ) : null}
                </div>
                {errors.rating ? (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.rating}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Treatment / Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Hair transplant, dental care, spa day"
                  maxLength={100}
                  className="h-12 w-full rounded-xl border-2 border-gray-300 px-4 transition-colors focus:border-[#083f30] focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your own experience at this place"
                  rows={6}
                  maxLength={1000}
                  className={`w-full resize-none rounded-xl border-2 px-4 py-3 transition-colors focus:outline-none ${
                    errors.comment ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#083f30]"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{comment.length}/1000 characters</p>
                  {errors.comment ? (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {errors.comment}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Add Photos (Optional)</label>

                {images.length > 0 ? (
                  <div className="mb-3 grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <div key={`${image.name}-${index}`} className="relative aspect-square">
                        <img src={URL.createObjectURL(image)} alt={`Upload ${index + 1}`} className="h-full w-full rounded-xl object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {images.length < 4 ? (
                  <div className="relative">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="review-images" />
                    <label
                      htmlFor="review-images"
                      className="flex h-24 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 transition-all hover:border-[#083f30] hover:bg-gray-50"
                    >
                      <Upload size={24} className="text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">Attach Photos</p>
                        <p className="text-xs text-gray-500">Preview only until your media upload endpoint is connected</p>
                      </div>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-blue-900">Review Guidelines</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>Be honest and fair</li>
                  <li>Share your personal experience</li>
                  <li>Avoid offensive language</li>
                  <li>Include specific details about the service</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 rounded-b-3xl border-t border-gray-200 bg-gray-50 p-6 sm:rounded-b-3xl">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="h-14 flex-1 rounded-xl border-2 border-gray-300 font-bold text-gray-900 transition-all hover:bg-white active:scale-95"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitStatus === "submitting"}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#083f30] font-bold text-white transition-all hover:bg-[#0a5a44] active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
                  type="button"
                >
                  {submitStatus === "submitting" ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
