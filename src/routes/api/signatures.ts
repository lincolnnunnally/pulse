import { createFileRoute } from "@tanstack/react-router";
import {
  getPersonBySession,
  insertSignature,
  readSessionToken,
} from "@/lib/pulse/server";
import type { Intensity } from "@/lib/pulse/types";

export const Route = createFileRoute("/api/signatures")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const person = await getPersonBySession(readSessionToken(request));
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const intensity = Number(body.intensity);
        if (![1, 2, 3, 4, 5].includes(intensity)) {
          return Response.json(
            { ok: false, error: "Intensity must be 1–5." },
            { status: 400 },
          );
        }
        const result = await insertSignature({
          petitionId: String(body.petitionId || ""),
          name: String(body.name || person?.name || ""),
          email: String(body.email || person?.email || ""),
          city: String(body.city || person?.city || ""),
          state: String(body.state || person?.state || "GA"),
          zip: body.zip ? String(body.zip) : person?.zip,
          intensity: intensity as Intensity,
          why: body.why ? String(body.why) : undefined,
          person,
        });
        if (!result.ok) {
          const status = result.error.includes("already signed") ? 409 : 400;
          return Response.json(result, { status });
        }
        return Response.json(result);
      },
    },
  },
});
