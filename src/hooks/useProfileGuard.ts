import { useCallback, useMemo } from "react";
import { isProfileComplete, getMissingProfileFields } from "@/lib/profile";

export function useProfileGuard(profile) {
  const complete = useMemo(() => isProfileComplete(profile), [profile]);

  const guard = useCallback(
    (callback) => {
      const missing = getMissingProfileFields(profile);
      if (missing.length) {
        alert(`Debes rellenar: ${missing.join(", ")}`);
        return;
      }
      callback();
    },
    [profile]
  );

  return { guard, complete };
}
