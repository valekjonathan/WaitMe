import { useCallback, useMemo } from "react";
import { normalizeProfile, isProfileComplete } from "@/lib/profile";

export function useProfileGuard(profileOrFormData) {
  const normalized = useMemo(
    () => normalizeProfile(profileOrFormData),
    [profileOrFormData]
  );
  const complete = useMemo(
    () => isProfileComplete(normalized),
    [normalized]
  );

  const guard = useCallback(
    (fn) => {
      if (!complete) {
        alert("Debes rellenar todos los campos");
        return false;
      }
      fn();
      return true;
    },
    [complete]
  );

  return { guard, complete, normalized };
}
