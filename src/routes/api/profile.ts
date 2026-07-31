import { createFileRoute } from "@tanstack/react-router";
import {
  getPersonBySession,
  readSessionToken,
  updatePersonProfile,
} from "@/lib/pulse/server";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const person = await getPersonBySession(readSessionToken(request));
        if (!person) {
          return Response.json(
            { ok: false, error: "Sign in to update your profile." },
            { status: 401 },
          );
        }
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const result = await updatePersonProfile(person.id, {
          name: body.name != null ? String(body.name) : undefined,
          city: body.city != null ? String(body.city) : undefined,
          state: body.state != null ? String(body.state) : undefined,
          zip: body.zip != null ? String(body.zip) : undefined,
          street: body.street != null ? String(body.street) : undefined,
        });
        if (!result.ok) {
          return Response.json(result, { status: 400 });
        }
        return Response.json(result);
      },
    },
  },
});
