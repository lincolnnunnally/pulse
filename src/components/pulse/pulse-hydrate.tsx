import { useEffect } from "react";
import { rehydratePulse, syncSharedPulse } from "@/lib/pulse/store";

/** Client-only: rehydrate local identity, then pull shared LPL tallies. */
export function PulseHydrate() {
  useEffect(() => {
    rehydratePulse();
    void syncSharedPulse();
  }, []);
  return null;
}
