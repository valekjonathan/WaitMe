import React from 'react';
import { Star, ThumbsUp, Award, TrendingUp } from 'lucide-react';

export default function RatingBadge({ rating, count, role }) {
  if (!rating || count === 0) return null;

  const numRating = parseFloat(rating);
  
  // Determinar el estilo según la calificación
  let bgColor = 'bg-gray-700/50 border-gray-600';
  let textColor = 'text-gray-400';
  let icon = <Star className="w-3 h-3" />;
  let label = 'Sin valorar';

  if (numRating >= 4.5) {
    bgColor = 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    textColor = 'text-yellow-400';
    icon = <Award className="w-3 h-3 fill-yellow-400" />;
    label = 'Excelente';
  } else if (numRating >= 4.0) {
    bgColor = 'bg-green-500/20 border-green-500/50';
    textColor = 'text-green-400';
    icon = <ThumbsUp className="w-3 h-3" />;
    label = 'Muy bueno';
  } else if (numRating >= 3.0) {
    bgColor = 'bg-blue-500/20 border-blue-500/50';
    textColor = 'text-blue-400';
    icon = <TrendingUp className="w-3 h-3" />;
    label = 'Bueno';
  } else if (numRating > 0) {
    bgColor = 'bg-orange-500/20 border-orange-500/50';
    textColor = 'text-orange-400';
    icon = <Star className="w-3 h-3" />;
    label = 'Regular';
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${bgColor} ${textColor}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
      <span className="text-[9px] opacity-70">({count})</span>
    </div>
  );
}