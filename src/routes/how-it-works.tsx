import { createFileRoute, Link } from "@tanstack/react-router";
import { HostingNotice } from "@/components/pulse/hosting-notice";
import { appJsonLd, faqJsonLd, pageHead, type Faq } from "@/lib/seo";

const TITLE = "How Pulse Works: Petitions Leaders Can Answer | Pulse";
const DESCRIPTION =
  "Start a petition addressed to the leader who can decide, sign with how much it matters, send the leader a notice, copy it for your area, and see public replies.";

/**
 * Each section is one thing the app does today (source noted per section).
 * If the code changes, change the copy.
 */
const SECTIONS: {
  id: string;
  h2: string;
  body: string[];
  cta?: { to: "/create" | "/petitions" | "/leaders"; label: string };
}[] = [
  {
    // src/routes/create.tsx
    id: "start-a-petition",
    h2: "Start a petition addressed to the leader who can decide",
    body: [
      "A Pulse signal is a petition with a clear ask. You write a title, a short summary leaders can scan, the concrete decision you want, and the full case.",
      "Then you pick the seat that can actually make the change, such as a lawmaker, a school board, a store manager or an HOA, and say why that seat. You can add a place label like a county or town.",
    ],
    cta: { to: "/create", label: "Start a signal" },
  },
  {
    // src/routes/p.$slug.tsx (intensity 1-5, optional note)
    id: "sign-with-intensity",
    h2: "Sign and say how much it matters",
    body: [
      "Signing asks for your name, email and place (city, state, ZIP). You also rate how important the ask is to you from 1 (mild support) to 5 (top priority for my community), and can add a note to leaders.",
      "Each signal shows the average importance and how the ratings spread, so a leader sees more than a raw count.",
    ],
    cta: { to: "/petitions", label: "Browse signals" },
  },
  {
    // src/lib/pulse/verify.ts, src/components/pulse/level-counts.tsx
    id: "labeled-counts",
    h2: "Counts labeled by how strongly each signer is verified",
    body: [
      "Pulse never shows one unlabeled total. Signatures are counted by level: L1 Account, L2 Place stated, L3 Address-tier, L4 Strong ID.",
      "Typing a street address does not make a signature L3. Place and ZIP count as L2 until a later verification step.",
    ],
  },
  {
    // src/components/pulse/campaign-actions.tsx, src/lib/pulse/packet.ts
    id: "notify-your-leader",
    h2: "Send the decision-maker a formal notice",
    body: [
      "From any signal you can build a notice packet for the seat it is addressed to. The packet includes the ask and the signature counts by verification level.",
      "Copy it into an email, open it in your email app when the seat has a public email address, or record an in-app notice that leaders who have claimed that seat see in their inbox.",
    ],
  },
  {
    // src/components/pulse/campaign-actions.tsx (forkCampaign), src/routes/api/fork.ts
    id: "fork-for-your-area",
    h2: "Copy a campaign for your own area",
    body: [
      "If a signal elsewhere fits your town too, fork it: choose the leader who can act where you live and add your place. Pulse creates a local campaign linked to the original, ready to share with neighbors.",
    ],
  },
  {
    // src/routes/leaders.tsx, src/routes/api/claim-leader.ts, src/routes/api/responses.ts
    id: "for-leaders",
    h2: "For leaders: an inbox and a public reply",
    body: [
      "Pulse is for anyone who leads a body of people: elected officials, school boards, pastors, HOAs, employers, nonprofit boards.",
      "A leader signs in and claims their seat. In this pilot a claim is a self-claim, not independent verification of the office, and the app says so. The leader inbox lists the signals addressed to that seat with support labeled by verification level, and lets the leader post a public response that signers see on the signal.",
    ],
    cta: { to: "/leaders", label: "Open the leader inbox" },
  },
];

const FAQS: Faq[] = [
  {
    q: "Does hosting a signal mean Pulse endorses it?",
    a: "No. Pulse is a neutral instrument for lawful signals. Featuring a petition means people asked leaders to notice, not that every host organization supports every cause.",
  },
  {
    q: "Who counts as a leader?",
    a: "Anyone who leads a body of people and needs a trustworthy signal from it: representatives, school boards, pastors, HOAs, employers and nonprofit boards.",
  },
  {
    q: "Is a leader's seat claim verified?",
    a: "Not yet. In this pilot a seat claim is a self-claim. Pulse labels it that way rather than presenting it as verified.",
  },
];

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead({
      path: "/how-it-works",
      title: TITLE,
      description: DESCRIPTION,
      jsonLd: [
        appJsonLd({
          path: "/how-it-works",
          name: "Pulse",
          description: DESCRIPTION,
          featureList: SECTIONS.map((s) => s.h2),
        }),
        faqJsonLd(FAQS),
      ],
    }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="page-shell max-w-2xl space-y-10 py-10 sm:py-14">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">How Pulse works</h1>
        <p className="text-base leading-relaxed text-fg-muted">
          Pulse turns petitions into two-way signals: a clear ask addressed to the person who can
          decide, signatures that carry how much it matters, and a place for that leader to answer
          in public.
        </p>
        <nav aria-label="On this page" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-accent">
              {s.h2.split(":")[0]}
            </a>
          ))}
        </nav>
      </header>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3">
          <h2 className="font-display text-xl font-semibold">{s.h2}</h2>
          {s.body.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-fg-muted sm:text-base">
              {p}
            </p>
          ))}
          {s.cta && (
            <Link to={s.cta.to} className="inline-block text-sm font-medium text-accent">
              {s.cta.label} →
            </Link>
          )}
        </section>
      ))}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Questions</h2>
        {FAQS.map((f) => (
          <div key={f.q} className="surface-card space-y-1.5 p-4">
            <h3 className="font-medium text-fg">{f.q}</h3>
            <p className="text-sm leading-relaxed text-fg-muted">{f.a}</p>
          </div>
        ))}
        <HostingNotice />
      </section>
    </div>
  );
}
