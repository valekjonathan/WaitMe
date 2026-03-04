import { useCallback, useMemo } from "react";
import { isProfileComplete, getMissingProfileFields } from "@/lib/profile";

export function useProfileGuard(profile) {
  const complete = useMemo(() => isProfileComplete(profile), [profile]);

  const guard = useCallback(
    (callback) => {
      const missing = getMissingProfileFields(profile);
      if (missing.length) {
        const list = missing.map((f) => `• ${f}`).join("\n");
        alert(`Para usar WaitMe debes completar tu perfil.\n\nFaltan estos datos:\n\n${list}`);
        return;
      }
      callback();
    },
    [profile]
  );

  return { guard, complete };
}
