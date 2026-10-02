import type { PointerEvent } from 'react';
import { Link } from 'wouter';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Poem } from '@workspace/api-client-react';
import { ShareBar } from '@/components/share-bar';
import { formatDate } from '@/lib/poems';

export type ReorderControls = {
  onUp: () => void; onDown: () => void; disableUp: boolean; disableDown: boolean;
  onHandleDown: (e: PointerEvent) => void; busy: boolean;
};

type Props = { poem: Poem; full?: boolean; canEdit: boolean; onEdit: () => void; onDelete: () => void; reorder?: ReorderControls };

export function PoemCard({ poem, full, canEdit, onEdit, onDelete, reorder }: Props) {
  const tool = 'h-12 min-w-12 px-3 grid place-items-center rounded-md border border-input hover:border-primary hover:text-primary disabled:opacity-35 disabled:hover:border-input disabled:hover:text-inherit';
  return (
    <article className="rounded-2xl border border-card-border bg-card p-5 sm:p-8 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]" data-testid={`card-poem-${poem.id}`}>
      <header className="flex items-start gap-3">
        {reorder && (
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" aria-label={`Arrastar o poema ${poem.title}`} title="Segure e arraste" onPointerDown={reorder.onHandleDown}
              className={`${tool} cursor-grab active:cursor-grabbing`} style={{ touchAction: 'none' }} data-testid={`handle-poem-${poem.id}`}><GripVertical size={22} /></button>
            <button type="button" className={tool} onClick={reorder.onUp} disabled={reorder.disableUp || reorder.busy} aria-label={`Subir o poema ${poem.title}`} data-testid={`button-up-${poem.id}`}><ArrowUp size={20} /></button>
            <button type="button" className={tool} onClick={reorder.onDown} disabled={reorder.disableDown || reorder.busy} aria-label={`Descer o poema ${poem.title}`} data-testid={`button-down-${poem.id}`}><ArrowDown size={20} /></button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-primary leading-tight break-words">
            {full ? poem.title : <Link href={`/poema/${poem.id}`} className="hover:underline" data-testid={`link-poem-${poem.id}`}>{poem.title}</Link>}
          </h2>
          <p className="mt-1 text-base text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <time dateTime={poem.createdAt}>{formatDate(poem.createdAt)}</time>
            {poem.isExample && <span className="rounded-full border border-primary/60 text-primary px-3 py-0.5 text-sm" data-testid={`badge-example-${poem.id}`}>Texto de demonstração</span>}
          </p>
        </div>
      </header>
      <div className="font-poem whitespace-pre-wrap break-words mt-6 leading-[1.75] text-foreground/95" style={{ fontSize: 'var(--poem-size)' }} data-testid={`text-poem-${poem.id}`}>{poem.content}</div>
      {canEdit && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className={`${tool} gap-2 inline-flex items-center`} data-testid={`button-edit-${poem.id}`}><Pencil size={18} />Editar</button>
          <button type="button" onClick={onDelete} className={`${tool} gap-2 inline-flex items-center hover:!border-destructive hover:!text-destructive`} data-testid={`button-delete-${poem.id}`}><Trash2 size={18} />Excluir</button>
        </div>
      )}
      <ShareBar poem={poem} />
    </article>
  );
}
