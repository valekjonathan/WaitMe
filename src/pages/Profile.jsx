import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Camera, Phone } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    display_name: "",
    car_brand: "",
    car_model: "",
    car_plate: "",
    phone: "",
    allow_phone_calls: false,
    photo_url: ""
  });

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setFormData({
        display_name: me.display_name || "JONATHAN",
        car_brand: me.car_brand || "Porsche",
        car_model: me.car_model || "Macan",
        car_plate: me.car_plate || "2026VSR",
        phone: me.phone || "",
        allow_phone_calls: me.allow_phone_calls || false,
        photo_url: me.photo_url || ""
      });
      setLoading(false);
    };
    load();
  }, []);

  const update = async (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    await base44.auth.updateMe(newData);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Mi Perfil" showBackButton backTo="Home" />

      <div className="pt-[70px] px-4 pb-28 max-w-md mx-auto">

        {/* TARJETA EXACTA */}
        <div className="rounded-3xl border border-purple-500/70 bg-gradient-to-br from-[#1b2230] to-[#141922] p-4 shadow-[0_0_25px_rgba(168,85,247,0.2)]">

          <div className="flex gap-4">

            {/* FOTO */}
            <div className="relative">
              <div className="w-24 h-28 rounded-2xl overflow-hidden border-2 border-purple-500">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>

              <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                <Camera size={18} />
                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { file_url } =
                      await base44.integrations.Core.UploadFile({ file });
                    update("photo_url", file_url);
                  }}
                />
              </label>
            </div>

            {/* INFO DERECHA */}
            <div className="flex-1 flex flex-col justify-between">

              <div>
                <h2 className="text-2xl font-bold tracking-wide">
                  {formData.display_name}
                </h2>
                <p className="text-gray-300 mt-1 text-base">
                  {formData.car_brand} {formData.car_model}
                </p>
              </div>

              {/* PLACA */}
              <div className="mt-4 flex items-center">
                <div className="h-9 flex items-center bg-white rounded-md overflow-hidden border-2 border-gray-400">
                  <div className="bg-blue-600 w-7 h-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">E</span>
                  </div>
                  <div className="px-4 text-black font-mono text-base tracking-widest font-bold">
                    {formData.car_plate.slice(0, 4)}{" "}
                    {formData.car_plate.slice(4)}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* FORMULARIO */}

        <div className="mt-6 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 mb-2">Nombre</p>
              <input
                value={formData.display_name}
                onChange={(e) => update("display_name", e.target.value)}
                className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <p className="text-gray-400 mb-2">Teléfono</p>
              <input
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3"
              />
            </div>
          </div>

          {/* SWITCH EXACTO */}
          <div className="bg-[#111827] rounded-2xl px-4 py-4 flex items-center justify-between border border-[#1f2937]">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-purple-400" />
              <span className="text-lg">Permitir llamadas</span>
            </div>

            <button
              onClick={() =>
                update("allow_phone_calls", !formData.allow_phone_calls)
              }
              className={`w-14 h-8 rounded-full relative transition-all ${
                formData.allow_phone_calls
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${
                  formData.allow_phone_calls ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 mb-2">Marca</p>
              <input
                value={formData.car_brand}
                onChange={(e) => update("car_brand", e.target.value)}
                className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <p className="text-gray-400 mb-2">Modelo</p>
              <input
                value={formData.car_model}
                onChange={(e) => update("car_model", e.target.value)}
                className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div>
            <p className="text-gray-400 mb-2">Matrícula</p>
            <input
              value={formData.car_plate}
              onChange={(e) =>
                update("car_plate", e.target.value.toUpperCase())
              }
              className="w-full bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-3 text-center font-mono tracking-widest"
            />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}