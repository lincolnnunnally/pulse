export function HostingNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-[var(--radius-md)] border border-border bg-bg-subtle/70 px-3 py-2 text-xs leading-relaxed text-fg-muted ${className}`}
    >
      <strong className="font-medium text-fg">Hosting is not endorsement.</strong>{" "}
      Pulse is a neutral instrument for lawful signals. Featuring a petition means
      people asked leaders to notice — not that every host organization supports
      every cause.
    </p>
  );
}
