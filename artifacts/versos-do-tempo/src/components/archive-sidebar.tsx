import { MONTHS, type ArchiveTree } from '@/lib/poems';

export type ArchiveSel = { year?: string; month?: string; day?: string };

export function ArchiveSidebar({ tree, sel, onSelect }: { tree: ArchiveTree; sel: ArchiveSel; onSelect: (s: ArchiveSel) => void }) {
  return (
    <nav aria-label="Arquivo" className="ed-archive-inner">
      <h2 className="ed-archive-title ed-mono">Percorrer por data</h2>
      <button type="button" className={`ed-archive-all${!sel.year ? ' is-active' : ''}`} onClick={() => onSelect({})} data-testid="button-archive-clear">Todos os poemas <span className="ed-count">{tree.reduce((n, y) => n + y.count, 0)}</span></button>
      {tree.length === 0 && <p className="ed-archive-empty">Ainda sem datas no arquivo.</p>}
      {tree.map((y) => (
        <details key={y.year} open={sel.year === y.year || undefined} className="ed-year">
          <summary className={sel.year === y.year && !sel.month ? 'is-active' : ''} data-testid={`archive-year-${y.year}`}>
            <span>{y.year}</span><span className="ed-count">{y.count}</span>
          </summary>
          <div className="ed-months">
            {y.months.map((m) => (
              <details key={m.month} className="ed-month" open={(sel.year === y.year && sel.month === m.month) || undefined}>
                <summary className={sel.year === y.year && sel.month === m.month && !sel.day ? 'is-active' : ''} data-testid={`archive-month-${y.year}-${m.month}`}>
                  <span className="capitalize">{MONTHS[Number(m.month) - 1]}</span><span className="ed-count">{m.count}</span>
                </summary>
                <ul className="ed-day-list">
                  {m.days.map((d) => (
                    <li key={d.date}>
                      <button type="button" className={`ed-day-button${sel.day === d.day && sel.month === m.month && sel.year === y.year ? ' is-active' : ''}`} onClick={() => onSelect({ year: y.year, month: m.month, day: d.day })} data-testid={`archive-day-${d.date}`} aria-pressed={sel.day === d.day && sel.month === m.month && sel.year === y.year}>
                        <span>Dia {Number(d.day)}</span><span className="ed-count">{d.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="ed-day-link" onClick={() => onSelect({ year: y.year, month: m.month })}>Todo o mês</button>
              </details>
            ))}
            <button type="button" className="ed-day-link" onClick={() => onSelect({ year: y.year })}>Todo o ano</button>
          </div>
        </details>
      ))}
    </nav>
  );
}
