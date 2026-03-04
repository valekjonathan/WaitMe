import { useCallback, useMemo } from "react";
import { isProfileComplete, getMissingProfileFields } from "@/lib/profile";

export function useProfileGuard(profile) {
  const complete = useMemo(() => isProfileComplete(profile), [profile]);

  const guard = useCallback(
    (callback) => {
      const missing = getMissingProfileFields(profile);
      if (missing.length) {
        const labels: Record<string, string> = {
          Nombre: "Nombre",
          Teléfono: "Teléfono",
          Marca: "Marca del coche",
          Modelo: "Modelo",
          Color: "Color",
          Vehículo: "Tipo de vehículo",
          Matrícula: "Matrícula",
        };
        const readable = missing.map((f) => labels[f] ?? f);
        alert(
          `Para usar WaitMe debes completar tu perfil.

Faltan estos datos:

• ${readable.join("\n• ")}`
        );
        return;
      }
      callback();
    },
    [profile]
  );

  return { guard, complete };
}
