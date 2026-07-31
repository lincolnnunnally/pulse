import { LEVEL_LABELS, tallyByLevel, type VerificationLevel } from "@/lib/pulse/verify";
import type { Signature } from "@/lib/pulse/types";
import { formatCount } from "@/lib/utils";

/** Labeled verification mix — never one unlabeled total alone. */
export function LevelCounts({ signatures }: { signatures: Signature[] }) {
  const counts = tallyByLevel(
    signatures.map((s) => ({ verificationLevel: s.verificationLevel ?? 1 })),
  );
  const total = signatures.length;
  if (!total) {
    return (
      <p className="text-xs text-fg-subtle">No signatures yet — be the first.</p>
    );
  }

  const levels: VerificationLevel[] = [3, 2, 1, 4];
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-fg">
        {formatCount(total)} total · shown by verification strength
      </p>
      <ul className="space-y-1.5 text-xs text-fg-muted">
        {levels.map((lv) => {
          const n = counts[lv];
          if (!n && lv === 4) return null;
          const pct = Math.round((n / total) * 100);
          return (
            <li key={lv} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-fg-subtle">
                L{lv} {LEVEL_LABELS[lv]}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 tabular-nums text-right text-fg">
                {formatCount(n)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-relaxed text-fg-subtle">
        Leaders can filter to address-tier (L3+) only. Hosting is not endorsement.
      </p>
    </div>
  );
}
