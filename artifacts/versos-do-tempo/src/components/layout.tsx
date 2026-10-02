import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { useListPoems } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { SiteHeader } from '@/components/site-header';
import '@/styles/editorial.css';

export function Layout({ children }: { children: ReactNode }) {
  const { data } = useListPoems();
  const [location] = useLocation();
  const hasExample = !!data?.some((p) => p.isExample);
  return (
    <div className="ed min-h-[100dvh] flex flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-primary-foreground focus:p-3">Ir para o conteúdo</a>
      <SiteHeader />
      {hasExample && location !== '/' && location !== '/autor' && (
        <p className="ed-disclaimer" data-testid="text-demo-note"><span className="ed-demo-dot" aria-hidden="true" />
          Os poemas marcados como “Texto de demonstração” são exemplos e não são de autoria de Flavio.
        </p>
      )}
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="ed-footer">
        <span>Flavio Nhoato <span aria-hidden="true">·</span> Versos do Tempo</span>
        <span className="ed-mono">UM ACERVO QUE CRESCE A CADA PÁGINA</span>
        <Link href="/sobre" className="ed-footer-link">Sobre este projeto</Link>
      </footer>
    </div>
  );
}
