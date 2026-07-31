import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          ok: true,
          app: "Pulse",
          product:
            "Two-way alignment signals between people and leaders (petitions with intensity + leader response)",
          home: "https://pulse.unitedundergod.org",
          persistence: "browser local (seed + signatures); LPL shared DB next",
          featured: [
            "ga-unsold-cooked-food-to-local-farms",
            "modernize-us-tax-with-broad-consumption-tax",
          ],
        });
      },
    },
  },
});
