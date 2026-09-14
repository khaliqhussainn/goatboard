/**
 * Shared shell for the three legal pages, so they can't drift apart in
 * structure or spacing.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">
          GOATBOARD · goatboard.lol
        </p>
      </header>
      {children}
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="billboard-surface flex flex-col gap-2 rounded-[1.75rem] p-5 sm:p-6">
      <h2 className="text-lg font-black tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
