import { useEffect, useMemo, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { useGetBlogInfo, useListPoems, type Poem } from '@workspace/api-client-react';
import { PoemCard } from '@/components/poem-card';
import { ConfirmDelete, PoemFormDialog } from '@/components/poem-dialogs';
import { ArchiveSidebar, type ArchiveSel } from '@/components/archive-sidebar';
import { Notice, PoemSkeleton, pillBtn } from '@/components/states';
import { usePoemActions } from '@/hooks/use-poem-actions';
import { useMeta } from '@/hooks/use-meta';
import { buildArchive, dateKey, errMsg, norm } from '@/lib/poems';

type RowProps = { poem: Poem; index: number; total: number; busy: boolean; onMove: (i: number, d: -1 | 1) => void; onCommit: () => void; onEdit: (p: Poem) => void; onDelete: (p: Poem) => void };

function Row({ poem, index, total, busy, onMove, onCommit, onEdit, onDelete }: RowProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={poem} dragListener={false} dragControls={controls} onDragEnd={onCommit} className="list-none" whileDrag={{ scale: 1.015, zIndex: 10 }}>
      <PoemCard poem={poem} canEdit onEdit={() => onEdit(poem)} onDelete={() => onDelete(poem)}
        reorder={{ onUp: () => onMove(index, -1), onDown: () => onMove(index, 1), disableUp: index === 0, disableDown: index === total - 1, busy, onHandleDown: (e) => controls.start(e) }} />
    </Reorder.Item>
  );
}

export default function Blog() {
  useMeta('Flávio — Versos do Tempo | Poemas', 'Blog de poesia de Flávio: poemas para ler com calma, compartilhar e guardar.');
  const list = useListPoems();
  const info = useGetBlogInfo();
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
    const opts = { onSuccess: () => setFormOpen(false), onError: (e: unknown) => setFormErr(errMsg(e)) };
    if (editing) act.update.mutate({ id: editing.id, data }, opts); else act.create.mutate({ data }, opts);
  };
  const confirmDel = () => {
    if (!toDelete) return;
    setDelErr('');
    act.remove.mutate({ id: toDelete.id }, { onSuccess: () => setToDelete(null), onError: (e) => setDelErr(errMsg(e)) });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-[17rem_1fr] gap-8">
      <aside className="lg:sticky lg:top-28 self-start order-1">
        <div className="hidden lg:block"><ArchiveSidebar tree={tree} sel={sel} onSelect={setSel} /></div>
        <details className="lg:hidden rounded-xl border border-border bg-sidebar p-4">
          <summary className="cursor-pointer text-lg text-primary">Buscar poemas por data{sel.year ? ' · filtro ativo' : ''}</summary>
          <div className="mt-3"><ArchiveSidebar tree={tree} sel={sel} onSelect={setSel} /></div>
        </details>
      </aside>
      <section className="order-2 min-w-0">
        <div className="rise mb-6">
          <h1 className="font-display text-5xl sm:text-6xl text-foreground leading-none">Poemas</h1>
          <p className="mt-2 text-lg text-muted-foreground">{info.data ? `${info.data.total} ${info.data.total === 1 ? 'poema' : 'poemas'} no caderno` : 'Abrindo o caderno…'}</p>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[14rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={22} />
            <label htmlFor="busca" className="sr-only">Buscar poemas</label>
            <input id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou verso" data-testid="input-search"
              className="w-full min-h-12 rounded-full bg-card border-2 border-input pl-12 pr-12 text-lg focus:border-primary" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center" data-testid="button-clear-search"><X size={20} /></button>}
          </div>
          {canEdit && <button type="button" onClick={openNew} className={`${pillBtn} bg-primary text-primary-foreground`} data-testid="button-add"><Plus size={22} />Adicionar texto</button>}
        </div>
        {info.data && !canEdit && (
          <p className="mb-4 text-base text-muted-foreground rounded-lg border border-border px-4 py-3" data-testid="text-readonly">
            Somente leitura: a edição ainda não está liberada nesta versão publicada. Ela só será ativada quando o acesso protegido do autor for configurado.
          </p>
        )}
        {canEdit && <p className="mb-4 text-sm text-muted-foreground/80" data-testid="text-dev-note">Modo de desenvolvimento: a edição está ativa só durante o desenvolvimento.</p>}
        {canDrag && <p className="mb-4 text-base text-muted-foreground">Para mudar a ordem, segure a alça e arraste, ou use as setas.</p>}
        {canEdit && filtering && order.length > 1 && <p className="mb-4 text-base text-primary">A ordem só pode ser mudada sem busca ou filtro de data.</p>}
        {reorderErr && <p role="alert" className="mb-4 text-destructive text-lg" data-testid="text-reorder-error">{reorderErr}</p>}

        {list.isLoading ? <PoemSkeleton /> : list.isError ? (
          <Notice role="alert" title="Não foi possível abrir os poemas" action={<button type="button" className={`${pillBtn} bg-primary text-primary-foreground`} onClick={() => list.refetch()} data-testid="button-retry">Tentar de novo</button>}>{errMsg(list.error)}</Notice>
        ) : order.length === 0 ? (
          <Notice title="O caderno ainda está em branco" action={canEdit ? <button type="button" onClick={openNew} className={`${pillBtn} bg-primary text-primary-foreground`}><Plus size={22} />Adicionar o primeiro texto</button> : undefined}>Quando houver poemas, eles aparecerão aqui.</Notice>
        ) : shown.length === 0 ? (
          <Notice title="Nenhum poema encontrado" action={<button type="button" className={`${pillBtn} border border-input`} onClick={() => { setQ(''); setSel({}); }} data-testid="button-clear-filters">Limpar busca e datas</button>}>Tente outra palavra ou outra data.</Notice>
        ) : canDrag ? (
          <Reorder.Group axis="y" values={order} onReorder={live} className="space-y-6 p-0 m-0">
            {order.map((p, i) => <Row key={p.id} poem={p} index={i} total={order.length} busy={act.reorder.isPending} onMove={move} onCommit={commit} onEdit={openEdit} onDelete={(x) => { setDelErr(''); setToDelete(x); }} />)}
          </Reorder.Group>
        ) : (
          <div className="space-y-6">
            {shown.map((p) => <PoemCard key={p.id} poem={p} canEdit={canEdit} onEdit={() => openEdit(p)} onDelete={() => { setDelErr(''); setToDelete(p); }} />)}
          </div>
        )}
      </section>
      <PoemFormDialog open={formOpen} onOpenChange={setFormOpen} poem={editing} pending={act.create.isPending || act.update.isPending} error={formErr} onSubmit={submit} />
      <ConfirmDelete poem={toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDel} pending={act.remove.isPending} error={delErr} />
    </div>
  );
}
