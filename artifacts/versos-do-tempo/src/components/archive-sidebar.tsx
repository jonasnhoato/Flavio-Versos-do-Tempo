import { MONTHS, type ArchiveTree } from '@/lib/poems';

export type ArchiveSel = { year?: string; month?: string; day?: string };

export function ArchiveSidebar({ tree, sel, onSelect }: { tree: ArchiveTree; sel: ArchiveSel; onSelect: (s: ArchiveSel) => void }) {
  const row = (on: boolean) => `w-full text-left min-h-11 px-3 py-2 rounded-md flex justify-between gap-2 ${on ? 'bg-secondary text-primary' : 'hover:bg-secondary/60'}`;
  return (
    <nav aria-label="Arquivo" className="rounded-2xl border border-card-border bg-sidebar p-4">
      <h2 className="font-display text-2xl text-primary mb-2">Arquivo</h2>
      {tree.length === 0 && <p className="text-base text-muted-foreground">Ainda sem datas.</p>}
      {(sel.year) && <button type="button" className="mb-2 text-base underline text-primary min-h-11" onClick={() => onSelect({})} data-testid="button-archive-clear">Ver todos os poemas</button>}
      {tree.map((y) => (
        <details key={y.year} open={sel.year === y.year || undefined} className="mb-1">
          <summary className={`${row(sel.year === y.year && !sel.month)} cursor-pointer text-xl`} data-testid={`archive-year-${y.year}`}>
            <span>{y.year}</span><span className="text-muted-foreground">{y.count}</span>
          </summary>
          <div className="ml-3 border-l border-border pl-2">
            {y.months.map((m) => (
              <details key={m.month} open={(sel.year === y.year && sel.month === m.month) || undefined}>
                <summary className={`${row(sel.year === y.year && sel.month === m.month && !sel.day)} cursor-pointer`} data-testid={`archive-month-${y.year}-${m.month}`}>
                  <span className="capitalize">{MONTHS[Number(m.month) - 1]}</span><span className="text-muted-foreground">{m.count}</span>
                </summary>
                <ul className="ml-3 pl-2 border-l border-border">
                  {m.days.map((d) => (
                    <li key={d.date}>
                      <button type="button" className={row(sel.day === d.day && sel.month === m.month && sel.year === y.year)} onClick={() => onSelect({ year: y.year, month: m.month, day: d.day })} data-testid={`archive-day-${d.date}`}>
                        <span>Dia {Number(d.day)}</span><span className="text-muted-foreground">{d.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="ml-5 text-base underline min-h-11 text-primary" onClick={() => onSelect({ year: y.year, month: m.month })}>Todo o mês</button>
              </details>
            ))}
            <button type="button" className="ml-2 text-base underline min-h-11 text-primary" onClick={() => onSelect({ year: y.year })}>Todo o ano</button>
          </div>
        </details>
      ))}
    </nav>
  );
}
