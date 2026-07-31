import { createFileRoute } from "@tanstack/react-router";
import { forkPetition } from "@/lib/pulse/server";

export const Route = createFileRoute("/api/fork")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const result = await forkPetition({
          parentId: String(body.parentId || ""),
          leaderId: String(body.leaderId || ""),
          localeLabel: String(body.localeLabel || ""),
          createdByName: String(body.createdByName || "Neighbor"),
        });
        if (!result.ok) {
          return Response.json(result, { status: 400 });
        }
        return Response.json(result);
      },
    },
  },
});
