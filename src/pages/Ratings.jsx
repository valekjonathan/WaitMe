import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, MessageCircle, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';

export default function Ratings() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();
  }, []);

  // Obtener calificaciones del usuario
  const { data: ratings = [] } = useQuery({
    queryKey: ['userRatings', user?.id],
    queryFn: async () => {
      const ratings = await base44.entities.Rating.filter({ rated_id: user?.id });
      return ratings;
    },
    enabled: !!user?.id
  });

  // Crear calificación
  const createRatingMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Rating.create({
        rater_id: data.raterId,
        rater_email: data.raterEmail,
        rated_id: user?.id,
        rated_email: user?.email,
        rating: data.rating,
        comment: data.comment,
        role: 'seller'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRatings', user?.id] });
      setShowForm(false);
      setRating(0);
      setComment('');
    }
  });

  const handleSubmitRating = async () => {
    if (rating > 0) {
      createRatingMutation.mutate({
        rating,
        comment,
        raterId: user?.id,
        raterEmail: user?.email
      });
    }
  };

  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Calificaciones</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mt-4">

          {/* Resumen */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Calificación promedio</p>
                <p className="text-4xl font-bold text-white">{averageRating}</p>
              </div>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-gray-400 text-sm">Basado en {ratings.length} {ratings.length === 1 ? 'calificación' : 'calificaciones'}</p>
          </div>

          {/* Botón para añadir calificación */}
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-6">
            {showForm ? 'Cancelar' : 'Añadir calificación'}
          </Button>

          {/* Formulario de calificación */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-2xl p-4 border border-gray-700 space-y-4">
              
              <div>
                <p className="text-sm text-gray-400 mb-2">¿Cuántas estrellas?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i)}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110">
                      <Star
                        className={`w-10 h-10 ${
                          (hoverRating || rating) >= i
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Comentario (opcional)</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Cuéntanos tu experiencia..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
                />
              </div>

              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0 || createRatingMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium">
                {createRatingMutation.isPending ? 'Enviando...' : 'Enviar calificación'}
              </Button>
            </motion.div>
          )}

          {/* Lista de calificaciones */}
          <div className="space-y-3">
            {(ratings.length > 0 || true) ? (
              (ratings.length > 0 ? ratings : [
                { 
                  id: '1', 
                  rating: 4, 
                  comment: 'Muy amable y puntual. Excelente transacción, recomendado.', 
                  created_date: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                  rater_name: 'Carlos M.',
                  rater_photo: 'https://xsgames.co/randomusers/assets/avatars/male/34.jpg',
                  rater_car_brand: 'BMW',
                  rater_car_model: '320i',
                  rater_car_color: 'azul',
                  rater_car_plate: '1234ABC'
                },
                { 
                  id: '2', 
                  rating: 4, 
                  comment: 'Perfecto, el lugar estaba exactamente donde dijo. Volvería a usar.', 
                  created_date: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
                  rater_name: 'María L.',
                  rater_photo: 'https://xsgames.co/randomusers/assets/avatars/female/61.jpg',
                  rater_car_brand: 'Audi',
                  rater_car_model: 'A4',
                  rater_car_color: 'negro',
                  rater_car_plate: '5678DEF'
                },
                { 
                  id: '3', 
                  rating: 3, 
                  comment: 'Bien, aunque llegué 5 minutos tarde de lo previsto.', 
                  created_date: new Date(Date.now() - 8*24*60*60*1000).toISOString(),
                  rater_name: 'Juan P.',
                  rater_photo: 'https://xsgames.co/randomusers/assets/avatars/male/51.jpg',
                  rater_car_brand: 'Mercedes',
                  rater_car_model: 'C63',
                  rater_car_color: 'blanco',
                  rater_car_plate: '9012GHI'
                },
                { 
                  id: '4', 
                  rating: 4, 
                  comment: 'Comunicación clara y rápida. Muy profesional.', 
                  created_date: new Date(Date.now() - 12*24*60*60*1000).toISOString(),
                  rater_name: 'Ana G.',
                  rater_photo: 'https://xsgames.co/randomusers/assets/avatars/female/26.jpg',
                  rater_car_brand: 'Volkswagen',
                  rater_car_model: 'Golf',
                  rater_car_color: 'rojo',
                  rater_car_plate: '3456JKL'
                },
                { 
                  id: '5', 
                  rating: 4, 
                  comment: 'Usuario responsable. Coche en perfecto estado. 10/10', 
                  created_date: new Date(Date.now() - 15*24*60*60*1000).toISOString(),
                  rater_name: 'Pedro R.',
                  rater_photo: 'https://xsgames.co/randomusers/assets/avatars/male/45.jpg',
                  rater_car_brand: 'Peugeot',
                  rater_car_model: '308',
                  rater_car_color: 'gris',
                  rater_car_plate: '7890MNO'
                }
              ]).map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="h-80">
                  <UserCard
                    userName={r.rater_name}
                    userPhoto={r.rater_photo}
                    carBrand={r.rater_car_brand}
                    carModel={r.rater_car_model}
                    carColor={r.rater_car_color}
                    carPlate={r.rater_car_plate}
                    userRating={r.rating}
                    showLocationInfo={false}
                    actionButtons={
                      <div className="space-y-2">
                        <p className="text-gray-400 text-xs font-medium mb-2">Comentario:</p>
                        <p className="text-gray-300 text-xs leading-relaxed italic">{r.comment}</p>
                        <p className="text-gray-600 text-[10px] mt-2">
                          {new Date(r.created_date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    }
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Aún no hay calificaciones</p>
              </div>
            )}
          </div>

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}