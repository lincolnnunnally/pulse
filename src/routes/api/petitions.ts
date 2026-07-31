import { createFileRoute } from "@tanstack/react-router";
import { insertPetition } from "@/lib/pulse/server";
import { slugify } from "@/lib/utils";

export const Route = createFileRoute("/api/petitions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const title = String(body.title || "").trim();
        const base = slugify(title) || "signal";
        const slug =
          String(body.slug || "").trim() ||
          `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const result = await insertPetition({
          title,
          summary: String(body.summary || ""),
          body: String(body.body || ""),
          ask: String(body.ask || ""),
          category: String(body.category || "General"),
          leaderId: String(body.leaderId || ""),
          createdByName: String(body.createdByName || "Neighbor"),
          slug,
          parentId: body.parentId ? String(body.parentId) : undefined,
          whyThisSeat: body.whyThisSeat
            ? String(body.whyThisSeat)
            : undefined,
          localeLabel: body.localeLabel
            ? String(body.localeLabel)
            : undefined,
        });
        if (!result.ok) {
          return Response.json(result, { status: 400 });
        }
        return Response.json(result);
      },
    },
  },
});
