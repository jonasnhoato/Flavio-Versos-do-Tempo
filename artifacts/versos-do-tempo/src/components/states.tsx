import type { ReactNode } from 'react';

export function PoemSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando poemas">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-card-border bg-card p-8">
          <div className="skeleton h-9 w-2/3" />
          <div className="skeleton h-4 w-40 mt-3" />
          <div className="mt-6 space-y-3">{[0, 1, 2, 3].map((j) => <div key={j} className="skeleton h-5" style={{ width: `${90 - j * 12}%` }} />)}</div>
        </div>
      ))}
    </div>
  );
}

export function Notice({ title, children, action, role }: { title: string; children?: ReactNode; action?: ReactNode; role?: 'alert' }) {
  return (
    <div role={role} className="rise rounded-2xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center">
      <p className="font-display text-3xl text-primary">{title}</p>
      {children && <div className="mt-3 text-lg text-muted-foreground max-w-prose mx-auto">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export const pillBtn = 'min-h-12 px-6 rounded-full text-lg font-semibold inline-flex items-center gap-2 justify-center';
