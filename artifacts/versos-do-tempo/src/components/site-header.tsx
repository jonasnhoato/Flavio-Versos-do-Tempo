import { Link, useLocation } from 'wouter';
import { Minus, Plus } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useFontSize } from '@/hooks/use-font-size';

export function SiteHeader() {
  const [loc] = useLocation();
  const f = useFontSize();
  const nav = (href: string, label: string, on: boolean) => (
    <Link href={href} data-testid={`link-${label.toLowerCase()}`} aria-current={on ? 'page' : undefined}
      className={`px-3 py-2 rounded-md text-lg border-b-2 ${on ? 'border-primary text-primary' : 'border-transparent text-foreground/80 hover:text-primary'}`}>
      {label}
    </Link>
  );
  const btn = 'h-12 w-12 grid place-items-center rounded-full border border-input text-foreground hover:border-primary hover:text-primary disabled:opacity-35 disabled:hover:border-input';
  return (
    <header className="border-b border-border bg-background/85 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href="/" className="flex items-center gap-3" data-testid="link-home">
          <Logo />
          <span className="leading-none">
            <span className="block font-display text-3xl sm:text-4xl font-semibold text-foreground">Flávio</span>
            <span className="block font-display italic text-lg sm:text-xl text-primary mt-0.5">Versos do Tempo</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center" aria-label="Principal">
            {nav('/', 'Poemas', loc === '/' || loc.startsWith('/poema'))}
            {nav('/sobre', 'Sobre', loc === '/sobre')}
          </nav>
          <div className="flex items-center gap-1" role="group" aria-label="Tamanho da letra">
            <button type="button" className={btn} onClick={f.dec} disabled={f.i === 0} aria-label="Diminuir letra" data-testid="button-font-minus"><Minus size={20} /></button>
            <span className="font-display text-2xl px-1" aria-hidden="true">A</span>
            <button type="button" className={btn} onClick={f.inc} disabled={f.i === f.max} aria-label="Aumentar letra" data-testid="button-font-plus"><Plus size={20} /></button>
          </div>
        </div>
      </div>
    </header>
  );
}
