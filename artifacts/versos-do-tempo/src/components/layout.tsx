import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { useListPoems } from '@workspace/api-client-react';
import { SiteHeader } from '@/components/site-header';

export function Layout({ children }: { children: ReactNode }) {
  const { data } = useListPoems();
  const hasExample = !!data?.some((p) => p.isExample);
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-primary-foreground focus:p-3">Ir para o conteúdo</a>
      <SiteHeader />
      {hasExample && (
        <p className="text-center text-base text-muted-foreground bg-secondary/50 border-b border-border px-4 py-2" data-testid="text-demo-note">
          Os poemas marcados como “Texto de demonstração” são apenas exemplos e não são de autoria de Flávio.
        </p>
      )}
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="border-t border-border mt-16 py-8 px-4 text-center text-base text-muted-foreground">
        <p className="font-display italic text-xl text-primary">Flávio — Versos do Tempo</p>
        <p className="mt-1">Cada poema pertence ao seu autor. <Link href="/sobre" className="underline">Sobre este projeto</Link></p>
      </footer>
    </div>
  );
}
