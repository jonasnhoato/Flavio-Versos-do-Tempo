import { Link } from 'wouter';
import { useGetBlogInfo } from '@workspace/api-client-react';
import { useMeta } from '@/hooks/use-meta';

export default function About() {
  useMeta('Sobre — Flavio Nhoato, Versos do Tempo', 'Sobre este projeto: um blog de poesia pensado para leitura confortável, sem biografia inventada.');
  const info = useGetBlogInfo();
  return (
    <div className="ed-static-page rise">
      <h1 className="font-display text-5xl font-semibold">Sobre</h1>
      <div className="mt-8 space-y-6 text-[15px] leading-[1.8] text-muted-foreground">
        <p>“Flavio Nhoato — Versos do Tempo” é um blog de poesia pensado como um livro querido: fundo escuro, letras confortáveis e uma coisa de cada vez, para ler com calma no celular.</p>
        <p>Esta página não traz biografia. Não há aqui nenhuma história de vida, data ou fato sobre o autor que ele mesmo não tenha contado, e por isso nada foi inventado. Quando Flavio quiser, ele poderá escrever suas próprias palavras neste lugar.</p>
        <p>Os poemas marcados com <strong className="text-primary font-semibold">Texto de demonstração</strong> são apenas exemplos para mostrar como o blog funciona. Não são de autoria de Flavio e serão substituídos pelos textos dele.</p>
        <p>Cada poema tem um endereço próprio e pode ser compartilhado por Facebook, WhatsApp, e-mail ou link.</p>
        <p className="text-sm text-muted-foreground border-l border-primary pl-4" data-testid="text-edit-status">
          {info.data?.canEdit
            ? 'Você está na conta autorizada do autor. A publicação, edição, exclusão e organização dos poemas estão disponíveis para você.'
            : 'A leitura e o compartilhamento são públicos. Adicionar, editar, excluir e reordenar poemas exige a conta verificada e autorizada do autor. Criar uma conta não libera essas ferramentas.'}
        </p>
      </div>
      <Link href="/" className="inline-flex mt-8 min-h-11 items-center px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold" data-testid="link-read">Ler os poemas</Link>
    </div>
  );
}
