import { useCallback } from "react";
import { isProfileComplete } from "@/lib/profile";

export function useProfileGuard(profile) {
  const guardNavigation = useCallback(
    (callback) => {
      if (!isProfileComplete(profile)) {
        alert("Debes rellenar todos los campos");
        return;
      }
      callback();
    },
    [profile]
  );

  return { guardNavigation };
}
