import { createFileRoute } from "@tanstack/react-router";
import {
  clearSessionCookieHeader,
  getPersonBySession,
  loginPerson,
  logoutSession,
  readSessionToken,
  registerPerson,
  sessionCookieHeader,
} from "@/lib/pulse/server";

export const Route = createFileRoute("/api/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const person = await getPersonBySession(readSessionToken(request));
        return Response.json({
          ok: true,
          person,
        });
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const action = String(body.action || "login");

        if (action === "logout") {
          const token = readSessionToken(request);
          await logoutSession(token);
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": clearSessionCookieHeader(),
            },
          });
        }

        if (action === "register") {
          const result = await registerPerson({
            email: String(body.email || ""),
            password: String(body.password || ""),
            name: String(body.name || ""),
            city: String(body.city || ""),
            state: String(body.state || "GA"),
            zip: body.zip ? String(body.zip) : undefined,
            street: body.street ? String(body.street) : undefined,
          });
          if (!result.ok) {
            return Response.json(result, { status: 400 });
          }
          return new Response(
            JSON.stringify({ ok: true, person: result.person }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": sessionCookieHeader(result.token),
              },
            },
          );
        }

        // login
        const result = await loginPerson({
          email: String(body.email || ""),
          password: String(body.password || ""),
        });
        if (!result.ok) {
          return Response.json(result, { status: 401 });
        }
        return new Response(
          JSON.stringify({ ok: true, person: result.person }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": sessionCookieHeader(result.token),
            },
          },
        );
      },
    },
  },
});
