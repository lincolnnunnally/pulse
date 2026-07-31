import { createFileRoute } from "@tanstack/react-router";
import { insertLeaderResponse } from "@/lib/pulse/server";

export const Route = createFileRoute("/api/responses")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const result = await insertLeaderResponse({
          petitionId: String(body.petitionId || ""),
          leaderId: String(body.leaderId || ""),
          message: String(body.message || ""),
        });
        if (!result.ok) {
          return Response.json(result, { status: 400 });
        }
        return Response.json(result);
      },
    },
  },
});
