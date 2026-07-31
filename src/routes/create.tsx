import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { HostingNotice } from "@/components/pulse/hosting-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePulseStore } from "@/lib/pulse/store";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  const leaders = usePulseStore((s) => s.leaders);
  const createPetition = usePulseStore((s) => s.createPetition);
  const me = usePulseStore((s) => s.me);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [ask, setAsk] = useState("");
  const [category, setCategory] = useState("Local policy");
  const [leaderId, setLeaderId] = useState(leaders[0]?.id ?? "");
  const [createdByName, setCreatedByName] = useState(me?.name ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !ask.trim() || !body.trim()) {
      toast.error("Title, summary, body, and ask are required.");
      return;
    }
    const petition = createPetition({
      title,
      summary,
      body,
      ask,
      category,
      leaderId,
      createdByName: createdByName || "Neighbor",
    });
    toast.success("Signal published");
    navigate({ to: "/p/$slug", params: { slug: petition.slug } });
  }

  return (
    <div className="page-shell max-w-2xl py-10 sm:py-14">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Start a signal
        </h1>
        <p className="text-sm text-fg-muted sm:text-base">
          Write a clear ask. Leaders need meaning, not just a pile of names.
        </p>
      </div>
      <HostingNotice className="mb-6" />

      <form onSubmit={onSubmit} className="surface-card space-y-5 p-5 sm:p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should change?"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Short summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="2–3 sentences leaders can scan in 10 seconds"
            required
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ask">The concrete ask</Label>
          <Textarea
            id="ask"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="What exact decision or amendment do you want?"
            required
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">Full case</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Context, constraints, and what you are not asking for"
            required
            rows={8}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="by">Your name (public on signal)</Label>
            <Input
              id="by"
              value={createdByName}
              onChange={(e) => setCreatedByName(e.target.value)}
              placeholder="Neighbor"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="leader">Leader this is addressed to</Label>
          <select
            id="leader"
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            className="flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm focus-ring"
          >
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.jurisdiction}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Publish signal
        </Button>
      </form>
    </div>
  );
}
