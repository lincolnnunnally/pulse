/**
 * Per-page head for search and share cards. Keep every line true to what the
 * app does today: no counts, ratings or promises that are not in the code.
 */
export const SITE_URL = "https://pulse.unitedundergod.org";
export const SITE_NAME = "Pulse";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: "Two-way alignment signals between people and the leaders who serve them.",
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  publisher: { "@id": ORGANIZATION_ID },
};

/** Pulse is software people use in the browser. No `offers`: no price is stated. */
export function appJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  featureList: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: opts.name,
    url: `${SITE_URL}${opts.path}`,
    description: opts.description,
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Any modern web browser",
    featureList: opts.featureList,
    provider: { "@id": ORGANIZATION_ID },
  };
}

export type Faq = { q: string; a: string };

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Shorten at a word boundary for titles and descriptions. */
export function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.—-]+$/, "")}…`;
}

type MetaTag = React.JSX.IntrinsicElements["meta"];

/** TanStack renders `{ "script:ld+json": data }` meta entries as a JSON-LD script; its head typing omits it. */
export function ldJson(data: object): MetaTag {
  return { "script:ld+json": data } as unknown as MetaTag;
}

export function pageHead(opts: {
  path: string;
  title: string;
  description: string;
  jsonLd?: object[];
}) {
  const url = `${SITE_URL}${opts.path}`;
  const meta: MetaTag[] = [
    { title: opts.title } as MetaTag,
    { name: "description", content: opts.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    ...(opts.jsonLd ?? []).map(ldJson),
  ];
  return { meta, links: [{ rel: "canonical", href: url }] };
}

/** Signed-in, personal or staff pages: keep them out of search. */
export function privateHead(title: string) {
  return {
    meta: [{ title } as MetaTag, { name: "robots", content: "noindex, nofollow" }],
  };
}
