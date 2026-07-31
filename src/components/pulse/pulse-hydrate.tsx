import { useEffect } from "react";
import { rehydratePulse } from "@/lib/pulse/store";

/** Client-only: rehydrate zustand persist without SSR snapshot thrash */
export function PulseHydrate() {
  useEffect(() => {
    rehydratePulse();
  }, []);
  return null;
}
