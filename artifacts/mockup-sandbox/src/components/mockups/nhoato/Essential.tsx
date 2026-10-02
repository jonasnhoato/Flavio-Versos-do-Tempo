import { useMemo, useState, type CSSProperties } from 'react';
import type { FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, Mail, Minus, Plus, Search, X } from 'lucide-react';
import { introduction, poems as samplePoems, type Poem } from './_source/data';
import { buildArchive, dateKey, formatDate, MONTHS, norm } from './_source/poems';
import './essential.css';

type ArchiveSelection = { year?: string; month?: string; day?: string };
type Draft = { title: string; content: string; createdAt: string };
const toLocalInput = (date: string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function Essential() {
  const [poems, setPoems] = useState<Poem[]>(() => samplePoems.map(p => ({ ...p })));
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<ArchiveSelection>({});
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: '', content: '', createdAt: toLocalInput(new Date().toISOString()) });
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [fontSize, setFontSize] = useState(22);
  const [mobileArchiveOpen, setMobileArchiveOpen] = useState(false);

  const archive = useMemo(() => buildArchive(poems.map(p => ({ date: dateKey(p.createdAt), count: 1 }))), [poems]);
  const shown = useMemo(() => poems.filter(poem => {
    const q = norm(search.trim());
    const inSearch = !q || norm(`${poem.title} ${poem.content}`).includes(q);
    const key = dateKey(poem.createdAt);
    const [year, month, day] = key.split('-');
    return inSearch && (!selection.year || selection.year === year) && (!selection.month || selection.month === month) && (!selection.day || selection.day === day);
  }), [poems, search, selection]);
  const openAdd = () => {
    setEditingId(null);
    setDraft({ title: '', content: '', createdAt: toLocalInput(new Date().toISOString()) });
    setModal('add');
  };
  const openEdit = (poem: Poem) => {
    setEditingId(poem.id);
    setDraft({ title: poem.title, content: poem.content, createdAt: toLocalInput(poem.createdAt) });
    setModal('edit');
  };
  const saveDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title || !draft.content.trim()) return;
    const createdAt = new Date(draft.createdAt).toISOString();
    if (modal === 'edit' && editingId !== null) {
      setPoems(current => current.map(p => p.id === editingId ? { ...p, title, content: draft.content, createdAt } : p));
    } else {
      const nextId = Math.max(0, ...poems.map(p => p.id)) + 1;
      setPoems(current => [{ id: nextId, title, content: draft.content, createdAt, position: -1, isExample: false }, ...current.map(p => ({ ...p, position: p.position + 1 }))]);
    }
    setModal(null);
  };
  const movePoem = (id: number, delta: number) => setPoems(current => {
    const i = current.findIndex(p => p.id === id), j = i + delta;
    if (i < 0 || j < 0 || j >= current.length) return current;
    const next = [...current]; [next[i], next[j]] = [next[j], next[i]];
    return next.map((p, position) => ({ ...p, position }));
  });
  const copyPoem = async (poem: Poem) => {
    const url = `${window.location.origin}${window.location.pathname}#poema-${poem.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback(current => ({ ...current, [poem.id]: 'Endereço copiado.' }));
    } catch {
      const field = document.createElement('textarea');
      field.value = url; field.style.position = 'fixed'; field.style.opacity = '0';
      document.body.appendChild(field); field.select();
      const ok = document.execCommand('copy'); field.remove();
      setFeedback(current => ({ ...current, [poem.id]: ok ? 'Endereço copiado.' : url }));
    }
  };
  const selectArchive = (next: ArchiveSelection) => { setSelection(next); };
  const shareUrl = (poem: Poem) => `${window.location.origin}${window.location.pathname}#poema-${poem.id}`;
  const shareText = (poem: Poem) => `${poem.title} — Flavio Nhoato`;

  const ArchiveTree = () => <nav className="e-archive" aria-label="Arquivo por data">
    <div className="e-archive-title"><h2>Arquivo</h2><span>{poems.length} textos</span></div>
    {selection.year && <button type="button" className="e-archive-clear" onClick={() => selectArchive({})}>← Todos os poemas</button>}
    {archive.length === 0 && <p className="e-reading-note">O arquivo ainda está vazio.</p>}
    {archive.map(y => <details key={y.year} open={selection.year === y.year || undefined}>
      <summary className={`e-archive-row ${selection.year === y.year && !selection.month ? 'is-selected' : ''}`} onClick={() => selectArchive(selection.year === y.year ? {} : { year: y.year })}>
        <span>{y.year}</span><span className="e-count">{y.count}</span>
      </summary>
      {y.months.map(m => <details key={m.month} className="e-archive-nest" open={selection.year === y.year && selection.month === m.month || undefined}>
      <summary className={`e-archive-row ${selection.year === y.year && selection.month === m.month && !selection.day ? 'is-selected' : ''}`} onClick={() => selectArchive(selection.month === m.month && selection.year === y.year ? { year: y.year } : { year: y.year, month: m.month })}>
          <span>{MONTHS[Number(m.month) - 1]}</span><span className="e-count">{m.count}</span>
        </summary>
        <div className="e-archive-nest">{m.days.map(d => <button key={d.date} type="button" className={`e-archive-row e-archive-day ${selection.day === d.day && selection.month === m.month && selection.year === y.year ? 'is-selected' : ''}`} onClick={() => selectArchive({ year: y.year, month: m.month, day: d.day })}>
          <span>Dia {Number(d.day)}</span><span className="e-count">{d.count}</span>
        </button>)}</div>
      </details>)}
    </details>)}
  </nav>;

  return <div className="essential-page" style={{ '--e-poem-size': `${fontSize}px` } as CSSProperties}>
    <div className="e-topline" />
    <header className="e-header"><div className="e-header-inner">
      <a className="e-brand" href="#" aria-label="Flavio Nhoato — início" onClick={e => { e.preventDefault(); selectArchive({}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <span className="e-mark" aria-hidden="true" />
        <span><span className="e-brand-name">Flavio Nhoato</span><span className="e-brand-sub">Versos do Tempo</span></span>
      </a>
      <div className="e-header-right">
        <nav className="e-nav" aria-label="Navegação principal"><a href="#poemas" aria-current="page">Poemas</a><a href="#sobre">Sobre</a></nav>
        <div className="e-size-tools" role="group" aria-label="Tamanho do texto">
          <button className="e-tool-icon" type="button" aria-label="Diminuir tamanho do poema" disabled={fontSize <= 18} onClick={() => setFontSize(s => Math.max(18, s - 1))}><Minus size={14} /></button>
          <span className="e-size-a" aria-hidden="true">A</span>
          <button className="e-tool-icon" type="button" aria-label="Aumentar tamanho do poema" disabled={fontSize >= 28} onClick={() => setFontSize(s => Math.min(28, s + 1))}><Plus size={14} /></button>
        </div>
      </div>
    </div></header>
    <section className="e-intro" id="sobre" aria-labelledby="e-intro-heading">
      <div><div className="e-intro-label">Um caderno que cresce</div><h1 id="e-intro-heading" className="e-intro-title">Palavras no seu próprio tempo.</h1></div>
      <p className="e-intro-copy">{introduction}</p>
    </section>
    <main className="e-main" id="poemas">
      <ArchiveTree />
      <details className="e-mobile-archive" open={mobileArchiveOpen} onToggle={e => setMobileArchiveOpen(e.currentTarget.open)}>
        <summary><span>Arquivo por data</span><span className="e-count">{poems.length} textos</span></summary>
        <div className="e-mobile-tree"><ArchiveTree /></div>
      </details>
      <section className="e-content" aria-label="Poemas">
        <div className="e-content-head"><div><h2 className="e-content-title">Poemas</h2><p className="e-content-count">{shown.length} {shown.length === 1 ? 'texto' : 'textos'}{selection.year ? ` · ${selection.day ? `${Number(selection.day)} de ${MONTHS[Number(selection.month) - 1]} de ` : selection.month ? `${MONTHS[Number(selection.month) - 1]} de ` : ''}${selection.year}` : ' no caderno'}</p></div>
          <button className="e-add" type="button" onClick={openAdd}><Plus size={16} />Adicionar texto</button>
        </div>
        <div className="e-controls"><label className="e-search"><Search size={15} /><input type="search" aria-label="Buscar poemas" placeholder="Buscar por título ou verso" value={search} onChange={e => setSearch(e.target.value)} /></label><span className="e-reading-note">Leitura · 22 px</span></div>
        {shown.length === 0 ? <div className="e-empty"><strong>Nenhum poema por aqui.</strong>{search ? 'Tente outra palavra ou limpe a busca.' : 'Ainda não há textos nesta data.'}<br /><button type="button" onClick={() => { setSearch(''); setSelection({}); }}>Ver todos os poemas</button></div> :
          shown.map(poem => {
            const i = poems.findIndex(p => p.id === poem.id);
            return <article className="e-poem" id={`poema-${poem.id}`} key={poem.id}>
              <div className="e-poem-top"><div><h3 className="e-poem-title">{poem.title}</h3><div className="e-poem-meta"><time dateTime={poem.createdAt}>{formatDate(poem.createdAt)}</time>{poem.isExample && <span className="e-demo">Texto de demonstração</span>}</div></div>
                <div className="e-reorder" aria-label={`Reordenar ${poem.title}`}><button className="e-mini" type="button" title="Subir" aria-label={`Subir ${poem.title}`} disabled={i === 0} onClick={() => movePoem(poem.id, -1)}><ArrowUp size={15} /></button><button className="e-mini" type="button" title="Descer" aria-label={`Descer ${poem.title}`} disabled={i === poems.length - 1} onClick={() => movePoem(poem.id, 1)}><ArrowDown size={15} /></button></div>
              </div>
              <p className="e-poem-body">{poem.content}</p>
              <div className="e-actions">
                <button type="button" className="e-action" onClick={() => openEdit(poem)}>Editar</button>
                <button type="button" className="e-action e-delete" onClick={() => { if (window.confirm(`Excluir “${poem.title}”?`)) setPoems(current => current.filter(p => p.id !== poem.id)); }}>Excluir</button>
                <span className="e-action-sep" />
                <a className="e-action e-share-link" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(poem))}`} target="_blank" rel="noreferrer">Facebook</a>
                <a className="e-action e-share-link" href={`https://wa.me/?text=${encodeURIComponent(`${shareText(poem)}\n${shareUrl(poem)}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                <a className="e-action e-share-link" href={`mailto:?subject=${encodeURIComponent(shareText(poem))}&body=${encodeURIComponent(`${shareText(poem)}\n\n${shareUrl(poem)}`)}`}><Mail size={13} />E-mail</a>
                <button type="button" className="e-action" onClick={() => void copyPoem(poem)}>{feedback[poem.id] === 'Endereço copiado.' ? <Check size={13} /> : <Copy size={13} />}Copiar link</button>
              </div>
              {feedback[poem.id] && <p className="e-feedback" aria-live="polite">{feedback[poem.id]}</p>}
            </article>;
          })}
      </section>
    </main>
    <footer className="e-footer"><span>FLAVIO NHOATO · VERSOS DO TEMPO</span><span>Um poema de cada vez.</span></footer>
    {modal && <div className="e-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
      <section className="e-modal" role="dialog" aria-modal="true" aria-labelledby="e-modal-title">
        <div className="e-modal-head"><div><div className="e-eyebrow">{modal === 'edit' ? 'Revisar poema' : 'Nova página'}</div><h2 id="e-modal-title">{modal === 'edit' ? 'Editar texto' : 'Adicionar texto'}</h2></div><button type="button" className="e-modal-close" aria-label="Fechar" onClick={() => setModal(null)}><X size={18} /></button></div>
        <form onSubmit={saveDraft}>
          <label className="e-field">Título<input required autoFocus maxLength={180} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Título do poema" /></label>
          <label className="e-field">Texto<textarea required value={draft.content} onChange={e => setDraft(d => ({ ...d, content: e.target.value }))} placeholder="Escreva cada verso em sua própria linha." /></label>
          <label className="e-field">Data e horário<input required type="datetime-local" value={draft.createdAt} onChange={e => setDraft(d => ({ ...d, createdAt: e.target.value }))} /></label>
          <div className="e-modal-actions"><button type="button" className="e-cancel" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="e-save">{modal === 'edit' ? 'Salvar alterações' : 'Adicionar texto'}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}