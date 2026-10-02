import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, Check, Copy, GripVertical, LockKeyhole, LogIn, Mail, Plus, Search, X } from 'lucide-react';
import { FaFacebookF, FaWhatsapp } from 'react-icons/fa';
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
  const [loginOpen, setLoginOpen] = useState(() => new URLSearchParams(window.location.search).get('acesso') === 'autor');
  const [loginError, setLoginError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [authorPreview, setAuthorPreview] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
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
    if (!authorPreview) return;
    setEditingId(null);
    setDraft(blankDraft());
    setModalOpen(true);
  };

  const openEdit = (poem: Poem) => {
    if (!authorPreview) return;
    setEditingId(poem.id);
    setDraft({ title: poem.title, content: poem.content, date: dateKey(poem.createdAt) });
    setModalOpen(true);
  };

  const savePoem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authorPreview || !draft.title.trim() || !draft.content.trim()) return;
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
    if (!authorPreview) return;
    if (window.confirm(`Excluir “${poem.title}” desta prévia?`)) {
      setPoemList((current) => current.filter((item) => item.id !== poem.id));
      notify('Texto excluído desta prévia');
    }
  };

  const movePoem = (id: number, direction: -1 | 1) => {
    if (!authorPreview) return;
    setPoemList((current) => {
      const index = current.findIndex((poem) => poem.id === id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  };

  const movePoemTo = (sourceId: number, destinationId: number) => {
    if (!authorPreview || sourceId === destinationId) return;
    setPoemList((current) => {
      const from = current.findIndex((poem) => poem.id === sourceId);
      const to = current.findIndex((poem) => poem.id === destinationId);
      if (from < 0 || to < 0) return current;
      const reordered = [...current];
      const [pickedUp] = reordered.splice(from, 1);
      reordered.splice(to, 0, pickedUp);
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
    <div className={`ed${authorPreview ? ' ed-author-view' : ''}`}>
      <header className="ed-topbar">
        <a className="ed-brand" href="#inicio" aria-label="Flavio Nhoato — início">
          <svg className="ed-mark" aria-hidden="true" viewBox="0 0 52 52" fill="none">
            <path className="ed-mark-orbit" d="M26 2.5C38.98 2.5 49.5 13.02 49.5 26S38.98 49.5 26 49.5 2.5 38.98 2.5 26 13.02 2.5 26 2.5Z" />
            <path className="ed-mark-flourish" d="M6.4 13.4C13.2 17.2 21.1 16.2 26.6 10.1M45.2 38.7c-5.8-1.8-10.4-1-14.2 2.8" />
            <path className="ed-mark-glyph" d="M12.5 35V16.5h12m-12 8.3h9" />
            <path className="ed-mark-glyph" d="M27.8 35V16.5h1.7l9.3 13.1V16.5" />
            <circle className="ed-mark-star" cx="9.1" cy="37.4" r="1.6" />
          </svg>
          <span><span className="ed-brand-name">Flavio Nhoato</span><span className="ed-brand-title">Versos do Tempo</span></span>
        </a>
        <nav className="ed-nav" aria-label="Navegação principal">
          <a href="#arquivo">Arquivo</a>
          <a href="#poemas">Poemas</a>
          {authorPreview ? (
            <div className="ed-author-nav">
              <span className="ed-author-badge"><span aria-hidden="true" />Modo do autor</span>
              <button className="ed-author-exit" onClick={() => setAuthorPreview(false)}><LockKeyhole size={14} /> Sair</button>
            </div>
              ) : <button className="ed-access-button" aria-label="Entrar no acesso do autor" onClick={() => { setLoginError(''); setLoginOpen(true); }}><LogIn size={15} />Entrar</button>}
        </nav>
      </header>
      {authorPreview && <div className="ed-preview-notice"><LockKeyhole size={14} /> Você está vendo a prévia das ferramentas do autor. Essas alterações são apenas demonstrativas e não são salvas no site.</div>}

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
            {authorPreview && <div className="ed-author-tools"><button className="ed-add-nav" onClick={openNew}><Plus size={15} strokeWidth={2.5} /> Adicionar texto</button><span>Arraste a alça de um poema para reorganizá-lo.</span></div>}
            {filteredPoems.length ? (
              <div>
                {filteredPoems.map((poem, index) => {
                  const overallIndex = poemList.findIndex((item) => item.id === poem.id);
                  const slug = encodeURIComponent(poem.title);
                  const encodedUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}#poema-${poem.id}`);
                  const encodedText = encodeURIComponent(`${poem.title} — ${window.location.origin}${window.location.pathname}#poema-${poem.id}`);
                  return (
                    <article
                      className={`ed-poem${draggingId === poem.id ? ' ed-is-dragging' : ''}`}
                      id={`poema-${poem.id}`}
                      key={poem.id}
                      style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
                      draggable={authorPreview}
                      onDragStart={(event) => {
                        if (!authorPreview) { event.preventDefault(); return; }
                        setDraggingId(poem.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(poem.id));
                      }}
                      onDragOver={(event) => { if (authorPreview && draggingId !== null) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const sourceId = Number(event.dataTransfer.getData('text/plain')) || draggingId;
                        if (sourceId !== null) movePoemTo(sourceId, poem.id);
                        setDraggingId(null);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <div className="ed-poem-top">
                        {authorPreview && <button className="ed-drag-handle" aria-label={`Arrastar ${poem.title}`} title="Segure e arraste para reorganizar"><GripVertical size={17} /></button>}
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
                           <a className="ed-icon-button ed-social-facebook" aria-label={`Compartilhar ${poem.title} no Facebook`} title="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer"><FaFacebookF size={15} aria-hidden="true" /></a>
                           <a className="ed-icon-button ed-social-whatsapp" aria-label={`Compartilhar ${poem.title} no WhatsApp`} title="WhatsApp" href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noreferrer"><FaWhatsapp size={16} aria-hidden="true" /></a>
                          <a className="ed-icon-button" aria-label={`Enviar ${poem.title} por e-mail`} title="E-mail" href={`mailto:?subject=${slug}&body=${encodedText}`}><Mail size={15} /></a>
                          <button className="ed-icon-button" aria-label={`Copiar link de ${poem.title}`} title="Copiar link" onClick={() => void copyLink(poem)}><Copy size={14} /></button>
                        </div>
                         {authorPreview && <div className="ed-edit-actions" aria-label={`Ações do autor para ${poem.title}`}>
                           <button className="ed-small-action" aria-label={`Subir ${poem.title}`} title="Subir" disabled={overallIndex === 0} onClick={() => movePoem(poem.id, -1)}><ArrowUp size={14} /></button>
                           <button className="ed-small-action" aria-label={`Descer ${poem.title}`} title="Descer" disabled={overallIndex === poemList.length - 1} onClick={() => movePoem(poem.id, 1)}><ArrowDown size={14} /></button>
                           <button className="ed-small-action" onClick={() => openEdit(poem)}>Editar</button>
                           <button className="ed-small-action" onClick={() => deletePoem(poem)}>Excluir</button>
                         </div>}
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
      {loginOpen && (
        <div className="ed-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}>
          <section className="ed-modal ed-login-modal" role="dialog" aria-modal="true" aria-labelledby="ed-login-title" aria-describedby="ed-login-description">
            <div className="ed-modal-head">
              <div><div className="ed-feed-overline ed-mono">Área reservada</div><h2 id="ed-login-title">Acesso do autor</h2></div>
              <button className="ed-modal-close" aria-label="Fechar" onClick={() => setLoginOpen(false)}><X size={18} /></button>
            </div>
            <p id="ed-login-description" className="ed-login-description">Entre para publicar e organizar seus poemas. As ferramentas de edição ficam indisponíveis para visitantes.</p>
            <form onSubmit={(event) => { event.preventDefault(); setLoginError('O acesso ainda não foi conectado ao sistema seguro de autenticação do site. Nenhuma sessão foi iniciada.'); }}>
              <div className="ed-form-field"><label htmlFor="ed-login-email">E-mail</label><input id="ed-login-email" type="email" autoComplete="username" required placeholder="seu@email.com" /></div>
              <div className="ed-form-field"><label htmlFor="ed-login-password">Senha</label><input id="ed-login-password" type="password" autoComplete="current-password" required placeholder="Sua senha" /></div>
              {loginError && <p className="ed-login-error" role="alert">{loginError}</p>}
              <div className="ed-form-footer"><button type="button" className="ed-form-cancel" onClick={() => setLoginOpen(false)}>Voltar ao blog</button><button type="submit" className="ed-form-submit"><LockKeyhole size={15} /> Entrar</button></div>
            </form>
            <p className="ed-login-security">A área do autor exige uma sessão verificada. Nenhuma ferramenta editorial é liberada nesta prévia visual.</p>
          </section>
        </div>
      )}
      {toast && <div className="ed-toast" role="status">{toast}</div>}
    </div>
  );
}