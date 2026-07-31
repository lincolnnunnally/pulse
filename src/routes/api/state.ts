import { createFileRoute } from "@tanstack/react-router";
import { hasSupabaseConfig, loadSharedPulse } from "@/lib/pulse/server";

export const Route = createFileRoute("/api/state")({
  server: {
    handlers: {
      GET: async () => {
        const snap = await loadSharedPulse();
        return Response.json({
          ok: snap.persistence === "lpl",
          ...snap,
          configured: hasSupabaseConfig(),
        });
      },
    },
  },
});
