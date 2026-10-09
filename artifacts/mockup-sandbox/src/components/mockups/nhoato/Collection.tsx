import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Check, ChevronDown, Copy, Facebook, Mail, Menu, Pencil, Plus, Search, Share2, Trash2, X } from 'lucide-react';
import { introduction, poems as samplePoems, type Poem } from './_source/data';
import './Collection.css';

const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dateKey = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const prettyDate = (value: string) => {
  const [y, m, d] = dateKey(value).split('-').map(Number);
  return `${d} de ${months[m - 1]} de ${y}`;
};
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

type Selection = { year?: string; month?: string; day?: string };
type Draft = { title: string; content: string };

export function Collection() {
  const [items, setItems] = useState<Poem[]>(samplePoems);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<Selection>({});
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: '', content: '' });
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(22);
  const [copied, setCopied] = useState<number | null>(null);

  const archive = useMemo(() => {
    const years = new Map<string, Map<string, Set<string>>>();
    items.forEach((poem) => {
      const [year, month, day] = dateKey(poem.createdAt).split('-');
      if (!years.has(year)) years.set(year, new Map());
      const monthMap = years.get(year)!;
      if (!monthMap.has(month)) monthMap.set(month, new Set());
      monthMap.get(month)!.add(day);
    });
    return [...years.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([year, monthMap]) => ({
      year,
      months: [...monthMap.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([month, days]) => ({ month, days: [...days].sort((a, b) => b.localeCompare(a)) })),
    }));
  }, [items]);

  const visible = useMemo(() => items.filter((poem) => {
    const date = dateKey(poem.createdAt);
    const [year, month, day] = date.split('-');
    const matchesDate = (!selection.year || selection.year === year) && (!selection.month || selection.month === month) && (!selection.day || selection.day === day);
    const matchesQuery = !query || normalize(`${poem.title} ${poem.content}`).includes(normalize(query));
    return matchesDate && matchesQuery;
  }), [items, query, selection]);

  const openAdd = () => { setEditingId(null); setDraft({ title: '', content: '' }); setModal('add'); };
  const openEdit = (poem: Poem) => { setEditingId(poem.id); setDraft({ title: poem.title, content: poem.content }); setModal('edit'); };
  const saveDraft = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) return;
    if (modal === 'edit' && editingId !== null) {
      setItems((current) => current.map((poem) => poem.id === editingId ? { ...poem, ...draft, isExample: true } : poem));
      setNotice('Texto atualizado neste protótipo.');
    } else {
      const nextId = Math.max(0, ...items.map((poem) => poem.id)) + 1;
      setItems((current) => [{ id: nextId, ...draft, createdAt: new Date().toISOString(), position: -1, isExample: true }, ...current]);
      setNotice('Texto adicionado neste protótipo.');
      setSelection({});
    }
    setModal(null);
  };
  const removePoem = (id: number) => {
    if (window.confirm('Excluir este texto deste protótipo?')) setItems((current) => current.filter((poem) => poem.id !== id));
  };
  const move = (id: number, direction: -1 | 1) => setItems((current) => {
    const index = current.findIndex((poem) => poem.id === id);
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const reordered = [...current];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    return reordered;
  });
  const shareUrl = (id: number) => `${window.location.origin}/poema/${id}`;
  const copyLink = async (id: number) => {
    try {
      await navigator.clipboard.writeText(shareUrl(id));
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      window.prompt('Copie o endereço do texto:', shareUrl(id));
    }
  };
  const share = (poem: Poem, platform: 'facebook' | 'whatsapp' | 'email') => {
    const url = shareUrl(poem.id);
    const text = `${poem.title} — Flavio Nhoato, Versos do Tempo`;
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener,noreferrer');
    if (platform === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  };

  const clearFilter = () => setSelection({});
  const selectionText = selection.day ? `${selection.day}/${selection.month}/${selection.year}` : selection.month ? `${months[Number(selection.month) - 1]} de ${selection.year}` : selection.year || '';

  return (
    <main className="collection">
      <header className="cl-topbar">
        <a className="cl-brand" href="#inicio" aria-label="Versos do Tempo, início">
          <span className="cl-mark" aria-hidden="true"><span>FN</span></span>
          <span className="cl-brand-copy"><strong>Flavio Nhoato</strong><small>VERSOS DO TEMPO</small></span>
        </a>
        <nav className={`cl-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
          <a href="#poemas" onClick={() => setMenuOpen(false)}>Poemas <span className="cl-nav-count">{items.length}</span></a>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
        </nav>
        <div className="cl-top-actions">
          <div className="cl-type-controls" aria-label="Tamanho do texto">
            <button onClick={() => setFontScale((s) => Math.max(18, s - 1))} aria-label="Diminuir letra">A−</button>
            <button onClick={() => setFontScale((s) => Math.min(28, s + 1))} aria-label="Aumentar letra">A+</button>
          </div>
          <button className="cl-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}><Menu size={21} /></button>
        </div>
      </header>

      <section id="sobre" className="cl-intro">
        <div className="cl-intro-label"><span className="cl-pulse" /> UM CADERNO ABERTO</div>
        <div className="cl-intro-body">
          <p>{introduction}</p>
          <a href="#poemas" className="cl-intro-link">Percorrer a coleção <span aria-hidden="true">↘</span></a>
        </div>
      </section>

      <div className="cl-disclaimer"><span className="cl-disclaimer-dot" /> Textos marcados como demonstração são exemplos e não são de autoria de Flavio.</div>

      <div className="cl-layout">
        <aside className="cl-archive" aria-label="Arquivo cronológico">
          <div className="cl-archive-head">
            <span className="cl-eyebrow">ENCONTRE POR DATA</span>
            <h2>Arquivo</h2>
            <button className={`cl-all-link ${!selectionText ? 'active' : ''}`} onClick={clearFilter}>Todos os textos <span>{items.length}</span></button>
          </div>
          <div className="cl-tree">
            {archive.length === 0 && <p className="cl-archive-empty">As datas dos textos aparecerão aqui.</p>}
            {archive.map(({ year, months: yearMonths }) => (
              <details key={year} open={selection.year === year || undefined} className="cl-year">
                <summary className={selection.year === year && !selection.month ? 'selected' : ''}><span>{year}</span><ChevronDown size={15} /><i>{yearMonths.reduce((n, m) => n + m.days.length, 0)}</i></summary>
                <div className="cl-month-list">
                  {yearMonths.map(({ month, days }) => (
                    <details key={month} open={selection.year === year && selection.month === month || undefined} className="cl-month">
                      <summary className={selection.month === month && selection.year === year && !selection.day ? 'selected' : ''} onClick={(event) => { event.preventDefault(); setSelection({ year, month }); }}>
                        <span>{months[Number(month) - 1]}</span><i>{days.length}</i>
                      </summary>
                      <div className="cl-day-list">
                        {days.map((day) => <button key={day} className={selection.day === day && selection.month === month && selection.year === year ? 'selected' : ''} onClick={() => setSelection({ year, month, day })}>Dia {Number(day)} <span>•</span></button>)}
                        <button className="cl-month-all" onClick={() => setSelection({ year, month })}>Ver o mês</button>
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <div className="cl-archive-note"><BookOpen size={16} /> <span>Um acervo que cresce aos poucos, palavra por palavra.</span></div>
        </aside>

        <section className="cl-reading" id="poemas">
          <div className="cl-section-heading">
            <div>
              <span className="cl-eyebrow">A COLEÇÃO</span>
              <h1>Poemas<span className="cl-heading-period">.</span></h1>
              <p>{items.length} {items.length === 1 ? 'texto' : 'textos'} reunidos até agora{selectionText ? ` · ${selectionText}` : ''}</p>
            </div>
            <button className="cl-add" onClick={openAdd}><Plus size={18} strokeWidth={2.2} /><span>Adicionar texto</span></button>
          </div>
          <div className="cl-tools">
            <label className="cl-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título ou verso" aria-label="Buscar poemas por título ou verso" /><kbd>⌘ K</kbd></label>
            {selectionText && <button className="cl-filter-chip" onClick={clearFilter}>{selectionText}<X size={14} /></button>}
          </div>
          <div className="cl-local-note">A edição e a organização estão disponíveis apenas nesta prévia.</div>

          <div className="cl-poem-list">
            {visible.map((poem, index) => (
              <article className="cl-poem" key={poem.id}>
                <div className="cl-poem-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
                <div className="cl-poem-main">
                  <div className="cl-poem-meta"><time dateTime={poem.createdAt}>{prettyDate(poem.createdAt)}</time><span className="cl-meta-dot" />{poem.isExample && <span className="cl-demo">Texto de demonstração</span>}</div>
                  <div className="cl-poem-title-row">
                    <h2>{poem.title}</h2>
                    <div className="cl-order">
                      <button onClick={() => move(poem.id, -1)} disabled={index === 0} aria-label={`Mover ${poem.title} para cima`} title="Mover para cima"><ArrowUp size={15} /></button>
                      <button onClick={() => move(poem.id, 1)} disabled={index === visible.length - 1} aria-label={`Mover ${poem.title} para baixo`} title="Mover para baixo"><ArrowDown size={15} /></button>
                    </div>
                  </div>
                  <p className="cl-poem-content" style={{ fontSize: `${fontScale}px` }}>{poem.content}</p>
                  <div className="cl-poem-footer">
                    <div className="cl-share-actions" aria-label={`Compartilhar ${poem.title}`}>
                      <button onClick={() => share(poem, 'facebook')} aria-label="Compartilhar no Facebook"><Facebook size={15} /><span>Facebook</span></button>
                      <button onClick={() => share(poem, 'whatsapp')} aria-label="Compartilhar pelo WhatsApp"><Share2 size={15} /><span>WhatsApp</span></button>
                      <button onClick={() => share(poem, 'email')} aria-label="Compartilhar por e-mail"><Mail size={15} /><span>E-mail</span></button>
                      <button onClick={() => copyLink(poem.id)} aria-label="Copiar link"><Copy size={15} /><span>{copied === poem.id ? 'Copiado' : 'Copiar link'}</span></button>
                    </div>
                    <div className="cl-edit-actions">
                      <button onClick={() => openEdit(poem)} aria-label={`Editar ${poem.title}`}><Pencil size={15} /><span>Editar</span></button>
                      <button onClick={() => removePoem(poem.id)} aria-label={`Excluir ${poem.title}`}><Trash2 size={15} /><span>Excluir</span></button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {visible.length === 0 && <div className="cl-empty"><span className="cl-empty-symbol">∅</span><h2>Nenhum texto por aqui</h2><p>Tente outra busca ou escolha uma data diferente no arquivo.</p><button onClick={() => { setQuery(''); clearFilter(); }}>Limpar busca e arquivo</button></div>}
          </div>
          <footer className="cl-footer"><span>FLAVIO NHOATO</span><span>Palavras guardadas no tempo <i>·</i> {new Date().getFullYear()}</span></footer>
        </section>
      </div>

      {notice && <div className="cl-toast" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}

      {modal && <div className="cl-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <section className="cl-modal" role="dialog" aria-modal="true" aria-labelledby="cl-modal-title">
          <div className="cl-modal-header"><div><span className="cl-eyebrow">{modal === 'add' ? 'NOVO TEXTO' : 'ALTERAR TEXTO'}</span><h2 id="cl-modal-title">{modal === 'add' ? 'Adicionar texto' : 'Editar texto'}</h2></div><button className="cl-modal-close" onClick={() => setModal(null)} aria-label="Fechar"><X size={20} /></button></div>
          <form onSubmit={saveDraft}>
            <label className="cl-field">Título<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Dê um título ao texto" required /></label>
            <label className="cl-field">Texto<textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Escreva ou cole o poema aqui. As quebras de linha serão preservadas." rows={9} required /></label>
            <p className="cl-form-caption">Esta ação é apenas demonstrativa e não será publicada.</p>
            <div className="cl-form-actions"><button type="button" className="cl-cancel" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="cl-save">{modal === 'add' ? 'Adicionar texto' : 'Salvar alterações'}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}