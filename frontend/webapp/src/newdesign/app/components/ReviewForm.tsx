import { useState } from 'react';
import { X, Star, Check, AlertCircle, Upload } from 'lucide-react';

interface ReviewFormProps {
  providerName: string;
  treatmentName?: string;
  onClose: () => void;
  onSubmit?: (review: { rating: number; title: string; comment: string; images: File[] }) => void;
}

export default function ReviewForm({ providerName, treatmentName, onClose, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validate = () => {
    const newErrors: { rating?: string; comment?: string } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
