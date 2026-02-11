import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Camera, Car, Phone } from "lucide-react";

export default function Profile() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await base44.from("users").select("*").single();
      return data;
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      <Header title="Mi Perfil" />

      <div className="flex-1 px-4 pt-4 pb-24">

        {/* CARD SUPERIOR PERFIL */}
        <div className="relative rounded-3xl p-[2px] bg-gradient-to-r from-purple-600 to-purple-400 mb-6">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl p-6 flex items-center gap-6">

            {/* FOTO */}
            <div className="relative">
              <img
                src={user.photo || "/default-avatar.png"}
                className="w-32 h-32 object-cover rounded-2xl border-2 border-purple-500"
                alt="Foto perfil"
              />
              <button className="absolute -bottom-3 -right-3 bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                <Camera size={20} className="text-white" />
              </button>
            </div>

            {/* DATOS */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-wide">
                {user.name?.toUpperCase()}
              </h2>

              <p className="text-gray-300 mt-2 text-lg">
                {user.brand} {user.model}
              </p>

              {/* MATRÍCULA ESTILO REAL */}
              <div className="mt-4 inline-flex items-center bg-white rounded-lg overflow-hidden shadow-md">
                <div className="bg-blue-700 text-white px-3 py-2 text-sm font-semibold">
                  E
                </div>
                <div className="px-4 py-2 font-mono text-lg tracking-widest text-black">
                  {user.plate}
                </div>
              </div>
            </div>

            {/* ICONO COCHE */}
            <Car size={60} className="text-gray-300 opacity-70" />

          </div>
        </div>

        {/* CAMPOS */}
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 mb-2">Nombre</p>
              <div className="bg-[#0f172a] rounded-xl px-4 py-3">
                {user.name}
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-2">Teléfono</p>
              <div className="bg-[#0f172a] rounded-xl px-4 py-3">
                {user.phone}
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-purple-400">
              <Phone size={20} />
              <span>Permitir llamadas</span>
            </div>
            <div className="w-12 h-6 bg-red-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 mb-2">Marca</p>
              <div className="bg-[#0f172a] rounded-xl px-4 py-3">
                {user.brand}
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-2">Modelo</p>
              <div className="bg-[#0f172a] rounded-xl px-4 py-3">
                {user.model}
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-400 mb-2">Matrícula</p>
            <div className="bg-[#0f172a] rounded-xl px-4 py-3">
              {user.plate}
            </div>
          </div>

        </div>

      </div>

      <BottomNav active="profile" />
    </div>
  );
}