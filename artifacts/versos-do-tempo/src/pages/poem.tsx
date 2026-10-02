import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@clerk/react';
import { getGetPoemQueryKey, useGetPoem } from '@workspace/api-client-react';
import { useAuthorAccess } from '@/hooks/use-author-access';
import { PoemCard } from '@/components/poem-card';
import { ConfirmDelete, PoemFormDialog } from '@/components/poem-dialogs';
import { Notice, PoemSkeleton, pillBtn } from '@/components/states';
import { usePoemActions } from '@/hooks/use-poem-actions';
import { useMeta } from '@/hooks/use-meta';
import { errMsg } from '@/lib/poems';

export default function PoemPage({ poemId }: { poemId: string }) {
  const id = Number(poemId);
  const valid = Number.isInteger(id) && id > 0;
  const [, setLoc] = useLocation();
  const poemQ = useGetPoem(id, { query: { enabled: valid, queryKey: getGetPoemQueryKey(id), retry: false } });
  const info = useAuthorAccess();
  const { isSignedIn } = useAuth();
  const close = () => setLoc(isSignedIn ? '/autor' : '/', { replace: true });
  const act = usePoemActions();
  const poem = poemQ.data;
  useMeta(poem ? `${poem.title} — Flavio Nhoato, Versos do Tempo` : 'Poema — Flavio Nhoato, Versos do Tempo', poem ? poem.content.replace(/\s+/g, ' ').slice(0, 150) : 'Leia um poema de Flavio Nhoato — Versos do Tempo.');
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [err, setErr] = useState('');

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content className="ed ed-reader-modal" data-testid="dialog-poem-reader">
          <Dialog.Title className="sr-only">{poem?.title ?? 'Leitura do poema'}</Dialog.Title>
          <Dialog.Description className="sr-only">Texto completo do poema. Feche a janela para voltar ao blog.</Dialog.Description>
          <div className="ed-reader-top">
            <span className="ed-mono">Leitura completa</span>
            <Dialog.Close className="ed-icon-button" aria-label="Fechar leitura" data-testid="button-close-reader"><X size={20}/></Dialog.Close>
          </div>
          <div className="ed-reader-body">
        {!valid || (poemQ.isError) ? (
          <Notice role="alert" title="Poema não encontrado" action={<div className="flex gap-3 justify-center flex-wrap">{valid && <button type="button" className={`${pillBtn} border border-input`} onClick={() => poemQ.refetch()} data-testid="button-retry">Tentar de novo</button>}<Link href="/" className={`${pillBtn} bg-primary text-primary-foreground`}>Ver os poemas</Link></div>}>Este endereço não leva a nenhum poema, ou ele foi removido.</Notice>
        ) : poemQ.isLoading || !poem ? <PoemSkeleton /> : (
          <div className="rise">
            <PoemCard poem={poem} full canEdit={!!info.data?.canEdit} onEdit={() => { setErr(''); setEdit(true); }} onDelete={() => { setErr(''); setDel(true); }} />
          </div>
        )}
          </div>
          <Dialog.Close className="ed-reader-back" data-testid="link-back"><ArrowLeft size={16}/>Voltar ao blog</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
      <PoemFormDialog open={!!info.data?.canEdit && edit} onOpenChange={setEdit} poem={poem} pending={act.update.isPending} error={err}
        onSubmit={(data) => act.update.mutate({ id, data }, { onSuccess: () => setEdit(false), onError: (e) => setErr(errMsg(e)) })} />
      <ConfirmDelete poem={del && info.data?.canEdit ? poem ?? null : null} onCancel={() => setDel(false)} pending={act.remove.isPending} error={err}
        onConfirm={() => act.remove.mutate({ id }, { onSuccess: () => { setDel(false); close(); }, onError: (e) => setErr(errMsg(e)) })} />
    </Dialog.Root>
  );
}
