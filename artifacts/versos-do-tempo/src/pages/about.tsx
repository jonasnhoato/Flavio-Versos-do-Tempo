import { Link } from 'wouter';
import { useGetBlogInfo } from '@workspace/api-client-react';
import { useMeta } from '@/hooks/use-meta';

export default function About() {
  useMeta('Sobre — Flávio, Versos do Tempo', 'Sobre este projeto: um blog de poesia pensado para leitura confortável, sem biografia inventada.');
  const info = useGetBlogInfo();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 rise">
      <h1 className="font-display text-5xl sm:text-6xl">Sobre</h1>
      <div className="font-poem mt-8 space-y-6 text-xl leading-[1.8]">
        <p>“Flávio — Versos do Tempo” é um blog de poesia pensado como um livro querido: fundo escuro, letras grandes, uma coisa de cada vez, para ler com calma no celular.</p>
        <p>Esta página não traz biografia. Não há aqui nenhuma história de vida, data ou fato sobre o autor que ele mesmo não tenha contado, e por isso nada foi inventado. Quando Flávio quiser, ele poderá escrever suas próprias palavras neste lugar.</p>
        <p>Os poemas marcados com <strong className="text-primary font-semibold">Texto de demonstração</strong> são apenas exemplos para mostrar como o blog funciona. Não são de autoria de Flávio e serão substituídos pelos textos dele.</p>
        <p>Cada poema tem um endereço próprio e pode ser compartilhado por Facebook, WhatsApp, e-mail ou link. O Instagram não permite compartilhar links por páginas da web; por isso, nele o blog oferece uma imagem do poema para publicar pelo aplicativo.</p>
        <p className="text-lg text-muted-foreground border-l-2 border-primary pl-4" data-testid="text-edit-status">
          {info.data?.canEdit
            ? 'Sobre a edição: neste momento a edição está ativa porque o site roda em modo de desenvolvimento.'
            : 'Sobre a edição: a versão publicada é somente leitura. Adicionar, editar, excluir e reordenar poemas só serão liberados depois que o acesso protegido do autor for configurado, para que ninguém além dele possa mexer nos textos.'}
        </p>
      </div>
      <Link href="/" className="inline-flex mt-8 min-h-12 items-center px-6 rounded-full bg-primary text-primary-foreground text-lg font-semibold" data-testid="link-read">Ler os poemas</Link>
    </div>
  );
}
