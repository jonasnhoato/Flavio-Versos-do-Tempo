import { Link, useLocation } from 'wouter';
import { useAuthorAccess } from '@/hooks/use-author-access';
import { CalendarDays, FileText, LockKeyhole, LogIn, LogOut, Minus, Plus } from 'lucide-react';
import { useAuth, useClerk } from '@clerk/react';
import { AuthorMonogram } from '@/components/author-monogram';
import { useFontSize } from '@/hooks/use-font-size';

export function SiteHeader() {
  const [loc] = useLocation();
  const info = useAuthorAccess();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const f = useFontSize();
  return (
    <header className="ed-topbar">
        <Link href="/" className="ed-brand" data-testid="link-home" aria-label="Flavio Nhoato — início">
          <AuthorMonogram />
          <span><span className="ed-brand-name">Flavio Nhoato</span><span className="ed-brand-title">Versos do Tempo</span></span>
        </Link>
        <nav className="ed-nav" aria-label="Principal">
          <a href={`${import.meta.env.BASE_URL}#arquivo`} className="ed-nav-link" data-testid="link-arquivo"><CalendarDays size={15} aria-hidden="true"/>Arquivo</a>
          <Link href="/" className="ed-nav-link" data-testid="link-poemas" aria-current={loc === '/' || loc.startsWith('/poema') ? 'page' : undefined}><FileText size={15} aria-hidden="true"/>Textos</Link>
          <Link href="/sobre" data-testid="link-sobre" aria-current={loc === '/sobre' ? 'page' : undefined}>Sobre</Link>
          {isLoaded && (isSignedIn ? <div className="ed-author-nav">
            <Link href="/autor" className="ed-access-button" data-testid="link-author"><LockKeyhole size={15}/>{info.data?.canEdit ? 'Autor' : 'Minha conta'}</Link>
            <button type="button" className="ed-author-exit" onClick={() => void signOut({ redirectUrl: import.meta.env.BASE_URL })} data-testid="button-signout"><LogOut size={14}/><span>Sair</span></button>
          </div> : <Link href="/sign-in" className="ed-access-button" data-testid="link-author"><LogIn size={15} aria-hidden="true"/>Acesso do autor</Link>)}
        </nav>
        <div className="ed-font-controls" role="group" aria-label="Tamanho da letra dos textos">
          <button type="button" className="ed-icon-button" onClick={f.dec} disabled={f.i === 0} aria-label="Diminuir letra" data-testid="button-font-minus"><span aria-hidden="true">A</span><Minus size={12} /></button>
          <button type="button" className="ed-icon-button" onClick={f.inc} disabled={f.i === f.max} aria-label="Aumentar letra" data-testid="button-font-plus"><span aria-hidden="true">A</span><Plus size={12} /></button>
        </div>
    </header>
  );
}
