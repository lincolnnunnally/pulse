import { createFileRoute } from "@tanstack/react-router";
import { hasSupabaseConfig, loadSharedPulse } from "@/lib/pulse/server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const snap = await loadSharedPulse();
        return Response.json({
          ok: true,
          app: "Pulse",
          product:
            "Two-way alignment signals between people and leaders (petitions with intensity + leader response)",
          home: "https://pulse.unitedundergod.org",
          persistence: snap.persistence,
          configured: hasSupabaseConfig(),
          signatureCount: snap.signatures.length,
          responseCount: snap.responses.length,
          error: snap.error,
          featured: [
            "ga-unsold-cooked-food-to-local-farms",
            "modernize-us-tax-with-broad-consumption-tax",
          ],
        });
      },
    },
  },
});
