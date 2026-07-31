import { createFileRoute } from "@tanstack/react-router";
import {
  getPersonBySession,
  insertNotice,
  readSessionToken,
} from "@/lib/pulse/server";
import type { LeaderNotice } from "@/lib/pulse/types";

export const Route = createFileRoute("/api/notices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const person = await getPersonBySession(readSessionToken(request));
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const channel = String(body.channel || "in_app") as LeaderNotice["channel"];
        if (!["in_app", "copy_email", "mailto"].includes(channel)) {
          return Response.json(
            { ok: false, error: "Invalid notice channel." },
            { status: 400 },
          );
        }
        const result = await insertNotice({
          petitionId: String(body.petitionId || ""),
          leaderId: String(body.leaderId || ""),
          channel,
          subject: String(body.subject || ""),
          body: String(body.body || ""),
          sentByName: String(
            body.sentByName || person?.name || "Neighbor",
          ),
          sentByEmail: String(
            body.sentByEmail || person?.email || "",
          ),
        });
        if (!result.ok) {
          return Response.json(result, { status: 400 });
        }
        return Response.json(result);
      },
    },
  },
});
