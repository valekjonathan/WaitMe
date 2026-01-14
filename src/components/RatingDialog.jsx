import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

export default function RatingDialog({ open, onClose, onSubmit, userName, userRole }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit({ rating, comment });
    setIsSubmitting(false);
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Valorar experiencia</DialogTitle>
          <DialogDescription className="text-gray-400">
            ¿Cómo fue tu experiencia con <span className="text-white font-medium">{userName}</span> como {userRole === 'seller' ? 'vendedor' : 'comprador'}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Deja un comentario (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}