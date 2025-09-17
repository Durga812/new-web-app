// src/components/my-purchases/RatingModal.tsx
'use client';

import React, { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { submitRating } from '@/app/actions/my-purchases';
import { toast } from 'sonner';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  onRatingSubmitted?: () => void;
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  courseId, 
  courseName, 
  onRatingSubmitted 
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRating(courseId, rating, feedback);
      toast.success('Thank you for your feedback! 🌟');
      onRatingSubmitted?.();
      onClose();
    } catch (error) {
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setFeedback('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const getRatingText = (ratingValue: number) => {
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[ratingValue] || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-2 border-amber-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            Rate Your Experience
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-gray-600">
            {courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Star Rating with enhanced interaction */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="relative p-1 hover:scale-125 transition-all duration-200"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 transition-all ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-lg'
                          : 'fill-gray-200 text-gray-300'
                      }`}
                    />
                    {star <= (hoverRating || rating) && (
                      <Sparkles className="w-3 h-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {(hoverRating || rating) > 0 && (
              <p className="text-sm font-medium text-amber-600 animate-fadeIn">
                {getRatingText(hoverRating || rating)}
              </p>
            )}
          </div>

          {/* Enhanced Feedback Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your thoughts (optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all hover:border-amber-300"
              placeholder="What did you like about this course?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Your feedback helps us improve
              </p>
              <p className="text-xs text-gray-500">
                {feedback.length}/200
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <span className="animate-pulse">Submitting...</span>
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}