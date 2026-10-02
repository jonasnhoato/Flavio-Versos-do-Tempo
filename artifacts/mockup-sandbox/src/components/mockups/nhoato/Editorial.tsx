import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, Check, Copy, Mail, Plus, Search, Share2, X } from 'lucide-react';
import { introduction, poems as samplePoems, type Poem } from './_source/data';
import './Editorial.css';

type ArchiveSelection = { year?: string; month?: string; day?: string };
type Draft = { title: string; content: string; date: string };

const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));

const blankDraft = (): Draft => ({ title: '', content: '', date: dateKey(new Date().toISOString()) });

export function Editorial() {
  const [poemList, setPoemList] = useState<Poem[]>(() => samplePoems.map((poem) => ({ ...poem })));
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<ArchiveSelection>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [toast, setToast] = useState('');

  const archive = useMemo(() => {
    const years = new Map<string, Map<string, Map<string, number>>>();
    poemList.forEach((poem) => {
      const [year, month, day] = dateKey(poem.createdAt).split('-');
      if (!years.has(year)) years.set(year, new Map());
      const months = years.get(year)!;
      if (!months.has(month)) months.set(month, new Map());
      const days = months.get(month)!;
      days.set(day, (days.get(day) ?? 0) + 1);
    });
    return [...years.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([year, months]) => ({
      year,
      count: [...months.values()].reduce((total, days) => total + [...days.values()].reduce((sum, count) => sum + count, 0), 0),
      months: [...months.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([month, days]) => ({
        month,
        count: [...days.values()].reduce((sum, count) => sum + count, 0),
        days: [...days.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([day, count]) => ({ day, count })),
      })),
    }));
  }, [poemList]);

  const filteredPoems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return poemList.filter((poem) => {
      const [year, month, day] = dateKey(poem.createdAt).split('-');
      const matchesDate = (!selection.year || year === selection.year)
        && (!selection.month || month === selection.month)
        && (!selection.day || day === selection.day);
      const matchesText = !query || `${poem.title} ${poem.content}`.toLocaleLowerCase('pt-BR').includes(query);
      return matchesDate && matchesText;
    });
  }, [poemList, search, selection]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const openNew = () => {
    setEditingId(null);
    setDraft(blankDraft());
    setModalOpen(true);
  };

  const openEdit = (poem: Poem) => {
    setEditingId(poem.id);
    setDraft({ title: poem.title, content: poem.content, date: dateKey(poem.createdAt) });
    setModalOpen(true);
  };

  const savePoem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) return;
    if (editingId !== null) {
      setPoemList((current) => current.map((poem) => poem.id === editingId
        ? { ...poem, title: draft.title.trim(), content: draft.content, createdAt: `${draft.date}T12:00:00` }
        : poem));
      notify('Texto atualizado');
    } else {
      const nextId = Math.max(0, ...poemList.map((poem) => poem.id)) + 1;
      setPoemList((current) => [{ id: nextId, title: draft.title.trim(), content: draft.content, createdAt: `${draft.date}T12:00:00`, position: -1, isExample: false }, ...current]);
      setSelection({});
      setSearch('');
      notify('Texto adicionado ao início da página');
    }
    setModalOpen(false);
  };

  const deletePoem = (poem: Poem) => {
    if (window.confirm(`Excluir “${poem.title}” desta prévia?`)) {
      setPoemList((current) => current.filter((item) => item.id !== poem.id));
      notify('Texto excluído desta prévia');
    }
  };

  const movePoem = (id: number, direction: -1 | 1) => {
    setPoemList((current) => {
      const index = current.findIndex((poem) => poem.id === id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  };

  const copyLink = async (poem: Poem) => {
    const url = `${window.location.origin}${window.location.pathname}#poema-${poem.id}`;
    try {
      await navigator.clipboard.writeText(url);
      notify('Link copiado');
    } catch {
      notify('Não foi possível copiar o link neste navegador');
    }
  };

  const archiveTree = (
    <div className="ed-archive-inner">
      <button className={`ed-archive-all${!selection.year ? ' is-active' : ''}`} onClick={() => setSelection({})}>Todos os poemas <span className="ed-count">{poemList.length}</span></button>
      {archive.length === 0 && <p className="ed-archive-empty">Ainda sem datas no arquivo.</p>}
      {archive.map((year) => (
        <details className="ed-year" key={year.year} open={selection.year === year.year || undefined}>
          <summary aria-label={`Ano ${year.year}, ${year.count} poemas`}><span>{year.year}</span><span className="ed-count">{year.count}</span></summary>
          <div className="ed-months">
            {year.months.map((month) => (
              <details className="ed-month" key={month.month} open={selection.year === year.year && selection.month === month.month || undefined}>
                <summary
                  className={selection.year === year.year && selection.month === month.month && !selection.day ? 'is-active' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    setSelection(selection.year === year.year && selection.month === month.month && !selection.day
                      ? { year: year.year }
                      : { year: year.year, month: month.month });
                  }}
                >
                  <span>{monthNames[Number(month.month) - 1]}</span><span className="ed-count">{month.count}</span>
                </summary>
                <ul className="ed-day-list">
                  {month.days.map((day) => (
                    <li key={day.day}>
                      <button
                        className={`ed-day-button${selection.year === year.year && selection.month === month.month && selection.day === day.day ? ' is-active' : ''}`}
                        onClick={() => setSelection({ year: year.year, month: month.month, day: day.day })}
                      >
                        <span>Dia {Number(day.day)}</span><span className="ed-count">{day.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button className="ed-day-link" onClick={() => setSelection({ year: year.year, month: month.month })}>Ver o mês inteiro</button>
              </details>
            ))}
            <button className="ed-day-link" onClick={() => setSelection({ year: year.year })}>Ver o ano inteiro</button>
          </div>
        </details>
      ))}
    </div>
  );

  return (
    <div className="ed">
      <header className="ed-topbar">
        <a className="ed-brand" href="#inicio" aria-label="Flavio Nhoato — início">
          <span className="ed-mark" aria-hidden="true">fn</span>
          <span><span className="ed-brand-name">Flavio Nhoato</span><span className="ed-brand-title">Versos do Tempo</span></span>
        </a>
        <nav className="ed-nav" aria-label="Navegação principal">
          <a href="#arquivo">Arquivo</a>
          <a href="#poemas">Poemas</a>
          <button className="ed-add-nav" onClick={openNew}><Plus size={15} strokeWidth={2.5} />Adicionar texto</button>
        </nav>
      </header>

      <main id="inicio">
        <section className="ed-hero" aria-labelledby="ed-author">
          <div>
            <div className="ed-kicker ed-mono">Um caderno em movimento</div>
            <h1 id="ed-author">Flavio <span>Nhoato</span></h1>
            <div className="ed-hero-caption ed-mono">VERSOS DO TEMPO <span aria-hidden="true">/</span> POESIA, UM DIA DE CADA VEZ</div>
          </div>
          <div className="ed-intro">
            <div className="ed-intro-label ed-mono">Boas-vindas</div>
            {introduction.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </section>

        <div className="ed-disclaimer"><span className="ed-demo-dot" aria-hidden="true" />Os poemas marcados como “Texto de demonstração” são exemplos e não são de autoria de Flavio.</div>

        <div className="ed-main">
          <aside className="ed-archive" id="arquivo">
            <h2 className="ed-archive-title ed-mono">Percorrer por data</h2>
            {archiveTree}
          </aside>

          <details className="ed-mobile-archive" id="arquivo-mobile">
            <summary><span><CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 9 }} />Arquivo de datas</span><span className="ed-count">{poemList.length} textos</span></summary>
            {archiveTree}
          </details>

          <section className="ed-feed" id="poemas" aria-labelledby="ed-feed-title">
            <div className="ed-feed-header">
              <div className="ed-feed-heading">
                <div className="ed-feed-overline ed-mono">Leitura em ordem de chegada</div>
                <h2 id="ed-feed-title">Os poemas</h2>
                <div className="ed-feed-count">{filteredPoems.length} {filteredPoems.length === 1 ? 'texto' : 'textos'} nesta seleção</div>
              </div>
              <label className="ed-search-wrap">
                <Search className="ed-search-icon" size={16} aria-hidden="true" />
                <input className="ed-search" type="search" aria-label="Buscar poemas" placeholder="Buscar título ou verso" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
            </div>
            <p className="ed-tip">Use as setas para mudar a ordem nesta prévia. As alterações são locais.</p>
            {filteredPoems.length ? (
              <div>
                {filteredPoems.map((poem, index) => {
                  const overallIndex = poemList.findIndex((item) => item.id === poem.id);
                  const slug = encodeURIComponent(poem.title);
                  const encodedUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}#poema-${poem.id}`);
                  const encodedText = encodeURIComponent(`${poem.title} — ${window.location.origin}${window.location.pathname}#poema-${poem.id}`);
                  return (
                    <article className="ed-poem" id={`poema-${poem.id}`} key={poem.id} style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}>
                      <div className="ed-poem-top">
                        <div className="ed-poem-index">{String(index + 1).padStart(2, '0')}</div>
                        <div className="ed-poem-main">
                          <h3>{poem.title}</h3>
                          <div className="ed-poem-meta"><time dateTime={poem.createdAt}>{formatDate(poem.createdAt)}</time>{poem.isExample && <span className="ed-example">Texto de demonstração</span>}</div>
                        </div>
                      </div>
                      <div className="ed-poem-text">{poem.content}</div>
                      <div className="ed-poem-actions">
                        <div className="ed-share-actions">
                          <span className="ed-share-label">Compartilhar</span>
                          <a className="ed-icon-button" aria-label={`Compartilhar ${poem.title} no Facebook`} title="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer"><Share2 size={15} /></a>
                          <a className="ed-icon-button" aria-label={`Compartilhar ${poem.title} no WhatsApp`} title="WhatsApp" href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noreferrer"><span className="ed-mono" style={{ fontSize: 10 }}>WA</span></a>
                          <a className="ed-icon-button" aria-label={`Enviar ${poem.title} por e-mail`} title="E-mail" href={`mailto:?subject=${slug}&body=${encodedText}`}><Mail size={15} /></a>
                          <button className="ed-icon-button" aria-label={`Copiar link de ${poem.title}`} title="Copiar link" onClick={() => void copyLink(poem)}><Copy size={14} /></button>
                        </div>
                        <div className="ed-edit-actions" aria-label={`Ações para ${poem.title}`}>
                          <button className="ed-small-action" aria-label={`Subir ${poem.title}`} title="Subir" disabled={overallIndex === 0} onClick={() => movePoem(poem.id, -1)}><ArrowUp size={14} /></button>
                          <button className="ed-small-action" aria-label={`Descer ${poem.title}`} title="Descer" disabled={overallIndex === poemList.length - 1} onClick={() => movePoem(poem.id, 1)}><ArrowDown size={14} /></button>
                          <button className="ed-small-action" onClick={() => openEdit(poem)}>Editar</button>
                          <button className="ed-small-action" onClick={() => deletePoem(poem)}>Excluir</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="ed-empty">
                <strong>Nenhum poema nesta busca.</strong>
                Tente outro título ou verso, ou escolha outra data no arquivo.
                {(search || selection.year) && <div><button onClick={() => { setSearch(''); setSelection({}); }}>Limpar busca e datas</button></div>}
              </div>
            )}
          </section>
        </div>
      </main>
      <footer className="ed-footer"><span>Flavio Nhoato <span aria-hidden="true">·</span> Versos do Tempo</span><span className="ed-mono">UM ACERVO QUE CRESCE A CADA PÁGINA</span></footer>

      {modalOpen && (
        <div className="ed-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="ed-modal" role="dialog" aria-modal="true" aria-labelledby="ed-modal-title">
            <div className="ed-modal-head">
              <div><div className="ed-feed-overline ed-mono">{editingId === null ? 'Novo texto' : 'Editar texto'}</div><h2 id="ed-modal-title">{editingId === null ? 'Adicionar texto' : 'Editar poema'}</h2></div>
              <button className="ed-modal-close" aria-label="Fechar" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={savePoem}>
              <div className="ed-form-field"><label htmlFor="ed-title">Título</label><input id="ed-title" required autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div>
              <div className="ed-form-field"><label htmlFor="ed-date">Data</label><input id="ed-date" type="date" required value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></div>
              <div className="ed-form-field"><label htmlFor="ed-content">Texto <span className="ed-count">— as quebras de linha serão mantidas</span></label><textarea id="ed-content" required value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></div>
              <div className="ed-form-footer"><button type="button" className="ed-form-cancel" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" className="ed-form-submit"><Check size={15} style={{ verticalAlign: 'middle', marginRight: 7 }} />Salvar texto</button></div>
            </form>
          </section>
        </div>
      )}
      {toast && <div className="ed-toast" role="status">{toast}</div>}
    </div>
  );
}