import { useEffect, useMemo, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { CalendarDays, Plus, Search, X } from 'lucide-react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@clerk/react';
import { getListPoemsQueryKey, useListPoems, type Poem } from '@workspace/api-client-react';
import { useAuthorAccess } from '@/hooks/use-author-access';
import { PoemCard } from '@/components/poem-card';
import { BlogIntroduction } from '@/components/blog-introduction';
import { ConfirmDelete, PoemFormDialog } from '@/components/poem-dialogs';
import { ArchiveSidebar, type ArchiveSel } from '@/components/archive-sidebar';
import { Notice, PoemSkeleton, pillBtn } from '@/components/states';
import { usePoemActions } from '@/hooks/use-poem-actions';
import { useMeta } from '@/hooks/use-meta';
import { buildArchive, dateKey, errMsg, norm, MONTHS } from '@/lib/poems';

type RowProps = { poem: Poem; index: number; total: number; busy: boolean; onMove: (i: number, d: -1 | 1) => void; onCommit: () => void; onEdit: (p: Poem) => void; onDelete: (p: Poem) => void };

function Row({ poem, index, total, busy, onMove, onCommit, onEdit, onDelete }: RowProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={poem} dragListener={false} dragControls={controls} onDragEnd={onCommit} className="list-none" whileDrag={{ scale: 1.015, zIndex: 10 }}>
      <PoemCard poem={poem} index={index} canEdit onEdit={() => onEdit(poem)} onDelete={() => onDelete(poem)}
        reorder={{ onUp: () => onMove(index, -1), onDown: () => onMove(index, 1), disableUp: index === 0, disableDown: index === total - 1, busy, onHandleDown: (e) => controls.start(e) }} />
    </Reorder.Item>
  );
}

export default function Blog() {
  const [location, setLocation] = useLocation();
  useMeta('Flavio Nhoato — Versos do Tempo | Textos', 'Blog de textos de Flavio Nhoato: textos para ler com calma, compartilhar e guardar.', !location.startsWith('/poema/'));
  const search = useSearch();
  const { isSignedIn } = useAuth();
  const list = useListPoems({ query: { queryKey: getListPoemsQueryKey(), refetchInterval: isSignedIn ? false : 60000 } });
  const info = useAuthorAccess();
  const act = usePoemActions();
  const canEdit = !!info.data?.canEdit;
  const [order, setOrder] = useState<Poem[]>([]);
  const orderRef = useRef<Poem[]>([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<ArchiveSel>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Poem | null>(null);
  const [toDelete, setToDelete] = useState<Poem | null>(null);
  const [formErr, setFormErr] = useState('');
  const [delErr, setDelErr] = useState('');
  const [reorderErr, setReorderErr] = useState('');

  useEffect(() => {
    if (canEdit && new URLSearchParams(search).get('novo') === '1') {
      setEditing(null); setFormErr(''); setFormOpen(true);
      setLocation('/autor', { replace: true });
    }
  }, [search, canEdit, setLocation]);

  useEffect(() => {
    if (list.data) { const s = [...list.data].sort((a, b) => a.position - b.position); setOrder(s); orderRef.current = s; }
  }, [list.data]);

  const filtering = q.trim() !== '' || !!sel.year;
  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return order.filter((p) => {
      if (nq && !norm(p.title + ' ' + p.content).includes(nq)) return false;
      const [y, m, d] = dateKey(p.createdAt).split('-');
      if (sel.year && sel.year !== y) return false;
      if (sel.month && sel.month !== m) return false;
      if (sel.day && sel.day !== d) return false;
      return true;
    });
  }, [order, q, sel]);
  const tree = useMemo(() => buildArchive(info.data?.archive ?? []), [info.data]);
  const canDrag = canEdit && !filtering && order.length > 1;

  const commit = () => {
    setReorderErr('');
    act.reorder.mutate({ data: { ids: orderRef.current.map((p) => p.id) } }, { onError: (e) => { setReorderErr('Não foi possível guardar a nova ordem. ' + errMsg(e)); } });
  };
  const live = (next: Poem[]) => { orderRef.current = next; setOrder(next); };
  const move = (i: number, d: -1 | 1) => {
    const next = [...orderRef.current]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    live(next); commit();
  };

  const openNew = () => { setEditing(null); setFormErr(''); setFormOpen(true); };
  const openEdit = (p: Poem) => { setEditing(p); setFormErr(''); setFormOpen(true); };
  const submit = (data: { title: string; content: string }) => {
    setFormErr('');
    const opts = { onSuccess: () => { setFormOpen(false); if (!editing) { setQ(''); setSel({}); } }, onError: (e: unknown) => setFormErr(errMsg(e)) };
    if (editing) act.update.mutate({ id: editing.id, data }, opts); else act.create.mutate({ data }, opts);
  };
  const confirmDel = () => {
    if (!toDelete) return;
    setDelErr('');
    act.remove.mutate({ id: toDelete.id }, { onSuccess: () => setToDelete(null), onError: (e) => setDelErr(errMsg(e)) });
  };

  return (
    <>
      <BlogIntroduction />
      {order.some(p => p.isExample) && <p className="ed-disclaimer" data-testid="text-demo-note"><span className="ed-demo-dot" aria-hidden="true" />Os poemas marcados como “Texto de demonstração” são exemplos e não são de autoria de Flavio.</p>}
      <div className="ed-main">
        <aside className="ed-archive-wrap" id="arquivo">
          <div className="ed-archive"><ArchiveSidebar tree={tree} sel={sel} onSelect={setSel} /></div>
          <details className="ed-mobile-archive" open={!!sel.year || undefined}>
            <summary><span><CalendarDays size={14} aria-hidden="true" />Arquivo de datas{sel.year ? ' · filtro ativo' : ''}</span><span className="ed-count">{info.data?.total ?? '…'} textos</span></summary>
            <ArchiveSidebar tree={tree} sel={sel} onSelect={setSel} />
          </details>
        </aside>
        <section className="ed-feed" id="poemas" aria-labelledby="ed-feed-title">
          <div className="ed-feed-header">
            <div className="ed-feed-heading">
              <div className="ed-feed-overline ed-mono">Um acervo para percorrer</div>
              <h2 id="ed-feed-title">As ideias</h2>
              <p className="ed-feed-count">{list.isLoading ? 'Abrindo o caderno…' : `${shown.length} ${shown.length === 1 ? 'texto' : 'textos'} nesta seleção`}</p>
            </div>
            <div className="ed-search-wrap">
              <Search className="ed-search-icon" size={16} aria-hidden="true" />
              <label htmlFor="busca" className="sr-only">Buscar poemas</label>
              <input id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar título ou verso" data-testid="input-search" className="ed-search" />
              {q && <button type="button" onClick={() => setQ('')} aria-label="Limpar busca" className="ed-search-clear" data-testid="button-clear-search"><X size={16} /></button>}
            </div>
          </div>
          {isSignedIn && info.data && !canEdit && <p className="ed-tip" data-testid="text-readonly">Esta conta não tem autorização de autor. A leitura e o compartilhamento continuam disponíveis.</p>}
          {info.isError && <p role="alert" className="ed-tip text-destructive">Não foi possível verificar o acesso às ferramentas. <button type="button" className="underline" onClick={() => info.refetch()}>Tentar novamente</button></p>}
          {canEdit && <div className="ed-author-tools"><button type="button" className="ed-add-nav" onClick={openNew} data-testid="button-add"><Plus size={15}/>Adicionar texto</button><span className="ed-author-badge"><span aria-hidden="true"/>Modo do autor</span></div>}
          {canDrag && <p className="ed-tip">Para mudar a ordem, segure a alça e arraste, ou use as setas.</p>}
          {filtering && <div className="ed-filter-note"><span>{sel.year ? `Arquivo: ${[sel.day, sel.month && MONTHS[Number(sel.month) - 1], sel.year].filter(Boolean).join(' · ')}` : 'Busca ativa'}</span><button type="button" className="ed-small-action" onClick={() => { setQ(''); setSel({}); }} data-testid="button-clear-filters">Limpar busca e datas <X size={12}/></button></div>}
          {canEdit && filtering && order.length > 1 && <p className="ed-tip">A ordem só pode ser mudada sem busca ou filtro de data.</p>}
          {reorderErr && <p role="alert" className="mb-4 text-destructive text-sm" data-testid="text-reorder-error">{reorderErr}</p>}

        {list.isLoading ? <PoemSkeleton /> : list.isError ? (
          <Notice role="alert" title="Não foi possível abrir os textos" action={<button type="button" className={`${pillBtn} bg-primary text-primary-foreground`} onClick={() => list.refetch()} data-testid="button-retry">Tentar de novo</button>}>{errMsg(list.error)}</Notice>
        ) : order.length === 0 ? (
          <Notice title="O caderno ainda está em branco" action={canEdit ? <button type="button" onClick={openNew} className={`${pillBtn} bg-primary text-primary-foreground`}><Plus size={22} />Adicionar o primeiro texto</button> : undefined}>Quando houver textos, eles aparecerão aqui.</Notice>
        ) : shown.length === 0 ? (
          <Notice title="Nenhum texto encontrado" action={<button type="button" className={`${pillBtn} border border-input`} onClick={() => { setQ(''); setSel({}); }} data-testid="button-clear-filters">Limpar busca e datas</button>}>Tente outra palavra ou outra data.</Notice>
        ) : canDrag ? (
          <Reorder.Group axis="y" values={order} onReorder={live} className="p-0 m-0" aria-label="Poemas reordenáveis">
            {order.map((p, i) => <Row key={p.id} poem={p} index={i} total={order.length} busy={act.reorder.isPending} onMove={move} onCommit={commit} onEdit={openEdit} onDelete={(x) => { setDelErr(''); setToDelete(x); }} />)}
          </Reorder.Group>
        ) : (
          <div>
            {shown.map((p, index) => <PoemCard key={p.id} index={index} poem={p} canEdit={canEdit} onEdit={() => openEdit(p)} onDelete={() => { setDelErr(''); setToDelete(p); }} />)}
          </div>
        )}
        </section>
      </div>
      <PoemFormDialog open={canEdit && formOpen} onOpenChange={setFormOpen} poem={editing} pending={act.create.isPending || act.update.isPending} error={formErr} onSubmit={submit} />
      <ConfirmDelete poem={canEdit ? toDelete : null} onCancel={() => setToDelete(null)} onConfirm={confirmDel} pending={act.remove.isPending} error={delErr} />
    </>
  );
}
