import React, { useEffect, useState } from "react";
import { Car, Truck, Bus, Bike } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Profile() {
  const [user, setUser] = useState(null);

  // 🔴 ESTE es el estado que manda SIEMPRE
  const [vehicleType, setVehicleType] = useState("car");

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setVehicleType(me?.vehicle_type || "car");
    };
    loadUser();
  }, []);

  const saveProfile = async (field, value) => {
    if (!user) return;
    await base44.entities.User.update(user.id, {
      [field]: value,
    });
  };

  // 🔥 icono basado SOLO en vehicleType
  const renderVehicleIcon = () => {
    switch (vehicleType) {
      case "big":
        return <Truck className="w-6 h-6 text-white" />;
      case "van":
        return <Bus className="w-6 h-6 text-white" />;
      case "bike":
        return <Bike className="w-6 h-6 text-white" />;
      default:
        return <Car className="w-6 h-6 text-white" />;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-6 pb-24">
      {/* TARJETA SUPERIOR — MISMO DISEÑO */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 flex items-center gap-4">
        <img
          src={user.photo_url}
          alt="avatar"
          className="w-20 h-20 rounded-xl object-cover border border-purple-500"
        />

        <div className="flex-1">
          <p className="text-lg font-bold">{user.display_name}</p>
          <p className="text-sm text-gray-400">
            {user.car_brand} {user.car_model}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {/* 🔥 AQUÍ CAMBIA EN TIEMPO REAL */}
            {renderVehicleIcon()}

            <div className="bg-white rounded-md flex items-center overflow-hidden border h-7">
              <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">E</span>
              </div>
              <span className="px-3 font-mono font-bold text-black">
                {user.car_plate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO — MISMA DISPOSICIÓN */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            className="bg-gray-900 rounded-xl p-3"
            value={user.car_brand || ""}
            onChange={(e) =>
              setUser({ ...user, car_brand: e.target.value })
            }
            onBlur={(e) => saveProfile("car_brand", e.target.value)}
            placeholder="Marca"
          />

          <input
            className="bg-gray-900 rounded-xl p-3"
            value={user.car_model || ""}
            onChange={(e) =>
              setUser({ ...user, car_model: e.target.value })
            }
            onBlur={(e) => saveProfile("car_model", e.target.value)}
            placeholder="Modelo"
          />
        </div>

        {/* 🔥 SELECT QUE MANDA */}
        <select
          className="bg-gray-900 rounded-xl p-3 w-full"
          value={vehicleType}
          onChange={(e) => {
            const value = e.target.value;
            setVehicleType(value);           // cambia icono AL INSTANTE
            saveProfile("vehicle_type", value);
          }}
        >
          <option value="car">Coche</option>
          <option value="big">Coche voluminoso</option>
          <option value="van">Furgoneta</option>
          <option value="bike">Moto</option>
        </select>

        <input
          className="bg-gray-900 rounded-xl p-3 w-full"
          value={user.car_plate || ""}
          onChange={(e) =>
            setUser({ ...user, car_plate: e.target.value })
          }
          onBlur={(e) => saveProfile("car_plate", e.target.value)}
          placeholder="Matrícula"
        />
      </div>
    </div>
  );
}