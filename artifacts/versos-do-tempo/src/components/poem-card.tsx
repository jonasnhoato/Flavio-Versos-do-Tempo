import type { PointerEvent } from 'react';
import { Link } from 'wouter';
import { ArrowDown, ArrowRight, ArrowUp, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Poem } from '@workspace/api-client-react';
import { ShareBar } from '@/components/share-bar';
import { formatDate } from '@/lib/poems';

export type ReorderControls = {
  onUp: () => void; onDown: () => void; disableUp: boolean; disableDown: boolean;
  onHandleDown: (e: PointerEvent) => void; busy: boolean;
};

type Props = { poem: Poem; index?: number; full?: boolean; canEdit: boolean; onEdit: () => void; onDelete: () => void; reorder?: ReorderControls };

export function PoemCard({ poem, index, full, canEdit, onEdit, onDelete, reorder }: Props) {
  const tool = 'ed-small-action';
  return (
    <article className={`ed-poem${full ? ' ed-poem-full' : ''}`} data-testid={`card-poem-${poem.id}`}>
      <header className="ed-poem-top">
        {!full && <span className="ed-poem-index" aria-hidden="true">{String((index ?? poem.position) + 1).padStart(2, '0')}</span>}
        <div className="ed-poem-main">
          {full ? <h1 className="ed-detail-title">{poem.title}</h1> : <h3><Link href={`/poema/${poem.id}`} className="ed-poem-link" data-testid={`link-poem-${poem.id}`}>{poem.title}</Link></h3>}
          <p className="ed-poem-meta">
            <time dateTime={poem.createdAt}>{formatDate(poem.createdAt)}</time>
            {poem.isExample && <span className="ed-example" data-testid={`badge-example-${poem.id}`}>Texto de demonstração</span>}
          </p>
        </div>
      </header>
      {full ? <div className="ed-poem-text" style={{ fontSize: 'var(--poem-size)' }} data-testid={`text-poem-${poem.id}`}>{poem.content}</div> :
        <Link href={`/poema/${poem.id}`} className="ed-poem-open-excerpt" aria-label={`Ler ${poem.title} completo`} data-testid={`link-read-poem-${poem.id}`}>
          <span className="ed-poem-text ed-poem-excerpt" style={{ fontSize: 'var(--poem-size)' }} data-testid={`text-poem-${poem.id}`}>{poem.content.split('\n').slice(0, 5).join('\n').slice(0, 600)}</span>
          <span className="ed-read-more">Ler texto completo <ArrowRight size={14} aria-hidden="true"/></span>
        </Link>}
      <div className="ed-poem-actions">
        <ShareBar poem={poem} />
        {canEdit && <div className="ed-edit-actions" aria-label={`Ações para ${poem.title}`}>
          {reorder && <>
            <button type="button" aria-label={`Arrastar o poema ${poem.title}`} title="Segure e arraste" onPointerDown={e => { if (!reorder.busy) reorder.onHandleDown(e); }} disabled={reorder.busy}
              className={`${tool} cursor-grab active:cursor-grabbing`} style={{ touchAction: 'none' }} data-testid={`handle-poem-${poem.id}`}><GripVertical size={15} /></button>
            <button type="button" className={tool} onClick={reorder.onUp} disabled={reorder.disableUp || reorder.busy} aria-label={`Subir o poema ${poem.title}`} data-testid={`button-up-${poem.id}`}><ArrowUp size={14} /></button>
            <button type="button" className={tool} onClick={reorder.onDown} disabled={reorder.disableDown || reorder.busy} aria-label={`Descer o poema ${poem.title}`} data-testid={`button-down-${poem.id}`}><ArrowDown size={14} /></button>
          </>}
          <button type="button" onClick={onEdit} className={tool} data-testid={`button-edit-${poem.id}`}><Pencil size={12} />Editar</button>
          <button type="button" onClick={onDelete} className={`${tool} ed-delete-action`} data-testid={`button-delete-${poem.id}`}><Trash2 size={12} />Excluir</button>
        </div>
        }
      </div>
    </article>
  );
}
