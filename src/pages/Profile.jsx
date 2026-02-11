import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Camera, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const carColors = {
  blanco: "#ffffff",
  negro: "#111111",
  azul: "#3b82f6",
  rojo: "#ef4444",
  gris: "#6b7280",
  amarillo: "#facc15"
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setData({
        display_name: me.display_name || "",
        car_brand: me.car_brand || "",
        car_model: me.car_model || "",
        car_color: me.car_color || "gris",
        vehicle_type: me.vehicle_type || "car",
        car_plate: me.car_plate || "",
        photo_url: me.photo_url || "",
        phone: me.phone || "",
        allow_phone_calls: me.allow_phone_calls || false
      });
      setLoading(false);
    };
    load();
  }, []);

  const save = async (field, value) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    await base44.auth.updateMe(updated);
  };

  if (loading) return <div className="bg-black min-h-screen" />;

  const plate =
    data.car_plate && data.car_plate.length >= 7
      ? `${data.car_plate.slice(0, 4)} ${data.car_plate.slice(4)}`
      : "0000 XXX";

  return (
    <div className="bg-black text-white min-h-screen">
      <Header title="Mi Perfil" showBackButton backTo="Home" />

      <main className="pt-[69px] px-4 pb-24 max-w-md mx-auto">

        {/* TARJETA SUPERIOR EXACTA */}
        <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-purple-500 rounded-2xl p-5 shadow-[0_0_25px_rgba(168,85,247,0.25)]">
          <div className="flex gap-5">

            {/* FOTO */}
            <div className="relative">
              <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                {data.photo_url ? (
                  <img
                    src={data.photo_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                    👤
                  </div>
                )}
              </div>

              <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    const { file_url } =
                      await base44.integrations.Core.UploadFile({ file });
                    save("photo_url", file_url);
                  }}
                />
              </label>
            </div>

            {/* INFO DERECHA */}
            <div className="flex-1 flex flex-col justify-between">

              <div>
                <p className="text-2xl font-bold tracking-wide">
                  {data.display_name.toUpperCase()}
                </p>
                <p className="text-gray-300 mt-1 text-sm">
                  {data.car_brand} {data.car_model}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between">

                {/* MATRÍCULA */}
                <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                  <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <span className="px-3 text-black font-mono font-bold tracking-widest">
                    {plate}
                  </span>
                </div>

                {/* ICONO VEHICULO */}
                <svg viewBox="0 0 48 24" className="w-12 h-6" fill="none">
                  <path
                    d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
                    fill={carColors[data.car_color]}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <circle cx="14" cy="18" r="3" fill="#333" stroke="white" />
                  <circle cx="36" cy="18" r="3" fill="#333" stroke="white" />
                </svg>

              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO EXACTO DISTRIBUCIÓN */}
        <div className="mt-6 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 text-sm">Nombre</Label>
              <Input
                value={data.display_name}
                onChange={(e) => save("display_name", e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white h-10"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Teléfono</Label>
              <Input
                value={data.phone}
                onChange={(e) => save("phone", e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white h-10"
              />
            </div>
          </div>

          {/* SWITCH EXACTO */}
          <div className="bg-[#0f172a] rounded-xl p-4 flex justify-between items-center border border-gray-800">
            <div className="flex items-center gap-2 text-purple-400">
              <Phone className="w-4 h-4" />
              <span className="text-white">Permitir llamadas</span>
            </div>
            <Switch
              checked={data.allow_phone_calls}
              onCheckedChange={(v) => save("allow_phone_calls", v)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 text-sm">Marca</Label>
              <Input
                value={data.car_brand}
                onChange={(e) => save("car_brand", e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white h-10"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Modelo</Label>
              <Input
                value={data.car_model}
                onChange={(e) => save("car_model", e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white h-10"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-sm">Matrícula</Label>
            <Input
              value={data.car_plate}
              onChange={(e) =>
                save("car_plate", e.target.value.toUpperCase())
              }
              className="bg-[#0f172a] border-gray-700 text-white h-10 font-mono uppercase text-center"
              maxLength={7}
            />
          </div>

        </div>

      </main>

      <BottomNav />
    </div>
  );
}