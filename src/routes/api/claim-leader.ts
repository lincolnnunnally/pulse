import { createFileRoute } from "@tanstack/react-router";
import {
  claimLeaderSeat,
  getPersonBySession,
  readSessionToken,
} from "@/lib/pulse/server";

export const Route = createFileRoute("/api/claim-leader")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const person = await getPersonBySession(readSessionToken(request));
        if (!person) {
          return Response.json(
            { ok: false, error: "Sign in before claiming a leader seat." },
            { status: 401 },
          );
        }
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const result = await claimLeaderSeat({
          personId: person.id,
          leaderId: String(body.leaderId || ""),
          note: body.note ? String(body.note) : undefined,
        });
        if (!result.ok) {
          return Response.json(result, { status: 400 });
        }
        return Response.json(result);
      },
    },
  },
});
