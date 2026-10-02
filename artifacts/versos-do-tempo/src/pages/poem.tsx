import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { getGetPoemQueryKey, useGetBlogInfo, useGetPoem } from '@workspace/api-client-react';
import { PoemCard } from '@/components/poem-card';
import { ConfirmDelete, PoemFormDialog } from '@/components/poem-dialogs';
import { Notice, PoemSkeleton, pillBtn } from '@/components/states';
import { usePoemActions } from '@/hooks/use-poem-actions';
import { useMeta } from '@/hooks/use-meta';
import { errMsg } from '@/lib/poems';

export default function PoemPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const valid = Number.isInteger(id) && id > 0;
  const [, setLoc] = useLocation();
  const poemQ = useGetPoem(id, { query: { enabled: valid, queryKey: getGetPoemQueryKey(id), retry: false } });
  const info = useGetBlogInfo();
  const act = usePoemActions();
  const poem = poemQ.data;
  useMeta(poem ? `${poem.title} — Flávio, Versos do Tempo` : 'Poema — Flávio, Versos do Tempo', poem ? poem.content.replace(/\s+/g, ' ').slice(0, 150) : 'Leia um poema de Flávio — Versos do Tempo.');
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [err, setErr] = useState('');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 min-h-12 text-lg text-primary hover:underline" data-testid="link-back"><ArrowLeft size={20} />Todos os poemas</Link>
      <div className="mt-4">
        {!valid || (poemQ.isError) ? (
          <Notice role="alert" title="Poema não encontrado" action={<div className="flex gap-3 justify-center flex-wrap">{valid && <button type="button" className={`${pillBtn} border border-input`} onClick={() => poemQ.refetch()} data-testid="button-retry">Tentar de novo</button>}<Link href="/" className={`${pillBtn} bg-primary text-primary-foreground`}>Ver os poemas</Link></div>}>Este endereço não leva a nenhum poema, ou ele foi removido.</Notice>
        ) : poemQ.isLoading || !poem ? <PoemSkeleton /> : (
          <div className="rise">
            <PoemCard poem={poem} full canEdit={!!info.data?.canEdit} onEdit={() => { setErr(''); setEdit(true); }} onDelete={() => { setErr(''); setDel(true); }} />
          </div>
        )}
      </div>
      <PoemFormDialog open={edit} onOpenChange={setEdit} poem={poem} pending={act.update.isPending} error={err}
        onSubmit={(data) => act.update.mutate({ id, data }, { onSuccess: () => setEdit(false), onError: (e) => setErr(errMsg(e)) })} />
      <ConfirmDelete poem={del ? poem ?? null : null} onCancel={() => setDel(false)} pending={act.remove.isPending} error={err}
        onConfirm={() => act.remove.mutate({ id }, { onSuccess: () => { setDel(false); setLoc('/'); }, onError: (e) => setErr(errMsg(e)) })} />
    </div>
  );
}
