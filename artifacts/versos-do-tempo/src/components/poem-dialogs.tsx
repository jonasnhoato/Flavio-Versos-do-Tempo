import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Alert from '@radix-ui/react-alert-dialog';
import { X } from 'lucide-react';
import type { Poem } from '@workspace/api-client-react';

const overlay = 'fixed inset-0 z-40 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0';
const panel = 'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1.5rem)] max-h-[94dvh] overflow-y-auto rounded-3xl border border-border bg-popover p-5 sm:p-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95';
const btn = 'min-h-11 px-5 rounded-full text-sm font-semibold';

type FormProps = { open: boolean; onOpenChange: (o: boolean) => void; poem?: Poem | null; pending: boolean; error: string; onSubmit: (d: { title: string; content: string }) => void };

export function PoemFormDialog({ open, onOpenChange, poem, pending, error, onSubmit }: FormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  useEffect(() => { if (open) { setTitle(poem?.title ?? ''); setContent(poem?.content ?? ''); } }, [open, poem]);
  const valid = title.trim().length > 0 && content.trim().length > 0;
  const submit = (e: FormEvent) => { e.preventDefault(); if (valid && !pending) onSubmit({ title: title.trim(), content }); };
  const field = 'w-full rounded-xl bg-background border border-input px-4 py-3 text-base focus:border-primary';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={`${panel} max-w-2xl`} aria-describedby="poem-form-desc">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-3xl font-semibold text-foreground">{poem ? 'Editar texto' : 'Adicionar texto'}</Dialog.Title>
            <Dialog.Close className="h-12 w-12 grid place-items-center rounded-full border border-input shrink-0" aria-label="Fechar" data-testid="button-close-form"><X /></Dialog.Close>
          </div>
          <Dialog.Description id="poem-form-desc" className="text-sm text-muted-foreground mt-1">Escreva o título e o poema. As quebras de linha serão mantidas.</Dialog.Description>
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div>
              <label htmlFor="poem-title" className="block text-sm mb-2">Título</label>
              <input id="poem-title" className={field} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} data-testid="input-title" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="poem-content" className="block text-sm mb-2">Poema</label>
              <textarea id="poem-content" className={`${field} font-poem min-h-[40dvh] leading-relaxed`} style={{ fontSize: 'var(--poem-size)' }} value={content} maxLength={100000} onChange={(e) => setContent(e.target.value)} data-testid="input-content" />
            </div>
            {error && <p role="alert" className="text-destructive text-sm" data-testid="text-form-error">{error}</p>}
            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close className={`${btn} border border-input`} data-testid="button-cancel">Cancelar</Dialog.Close>
              <button type="submit" disabled={!valid || pending} className={`${btn} bg-primary text-primary-foreground disabled:opacity-50`} data-testid="button-save">{pending ? 'Guardando…' : 'Guardar poema'}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type DelProps = { poem: Poem | null; onCancel: () => void; onConfirm: () => void; pending: boolean; error: string };

export function ConfirmDelete({ poem, onCancel, onConfirm, pending, error }: DelProps) {
  return (
    <Alert.Root open={!!poem} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <Alert.Portal>
        <Alert.Overlay className={overlay} />
        <Alert.Content className={`${panel} max-w-lg`}>
          <Alert.Title className="font-display text-3xl text-primary">Excluir este texto?</Alert.Title>
          <Alert.Description className="mt-3 text-sm leading-relaxed">
            “{poem?.title}” será removido de vez. Esta ação não pode ser desfeita.
          </Alert.Description>
          {error && <p role="alert" className="mt-3 text-destructive text-lg">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Alert.Cancel className={`${btn} border border-input`} data-testid="button-delete-cancel">Manter poema</Alert.Cancel>
            <button type="button" onClick={onConfirm} disabled={pending} className={`${btn} bg-destructive text-destructive-foreground disabled:opacity-60`} data-testid="button-delete-confirm">{pending ? 'Excluindo…' : 'Sim, excluir'}</button>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  );
}
