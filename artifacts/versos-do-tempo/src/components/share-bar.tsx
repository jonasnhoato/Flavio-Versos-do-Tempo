import { useState } from 'react';
import { Copy, Mail } from 'lucide-react';
import { SiFacebook, SiWhatsapp } from 'react-icons/si';
import type { Poem } from '@workspace/api-client-react';
import { permalink } from '@/lib/poems';

export function ShareBar({ poem }: { poem: Poem }) {
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [manual, setManual] = useState('');
  const url = () => permalink(poem.id);
  const text = `${poem.title} — Flavio Nhoato, Versos do Tempo`;
  const open = (u: string) => window.open(u, '_blank', 'noopener,noreferrer');
  const reset = () => { setOk(''); setErr(''); setManual(''); };

  const copy = async () => {
    reset();
    const u = url();
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(u);
      else {
        const t = document.createElement('textarea');
        t.value = u; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        const done = document.execCommand('copy');
        document.body.removeChild(t);
        if (!done) throw new Error('copy');
      }
      setOk('Endereço copiado. Basta colar onde quiser.');
    } catch {
      setErr('Não foi possível copiar sozinho. Selecione e copie o endereço abaixo.');
      setManual(u);
    }
  };

  return (
    <div className="ed-share-group">
      <div className="ed-share-actions">
        <span className="ed-share-label">Compartilhar</span>
        <button type="button" className="ed-icon-button ed-social-facebook" data-testid={`share-facebook-${poem.id}`} title="Facebook" aria-label={`Compartilhar ${poem.title} no Facebook`} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}><SiFacebook size={15} /></button>
        <button type="button" className="ed-icon-button ed-social-whatsapp" data-testid={`share-whatsapp-${poem.id}`} title="WhatsApp" aria-label={`Compartilhar ${poem.title} no WhatsApp`} onClick={() => open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url())}`)}><SiWhatsapp size={15} /></button>
        <a className="ed-icon-button" data-testid={`share-email-${poem.id}`} title="E-mail" aria-label={`Enviar ${poem.title} por e-mail`} href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(text + '\n\n' + url())}`}><Mail size={15} /></a>
        <button type="button" className="ed-icon-button" data-testid={`share-copy-${poem.id}`} onClick={copy} title="Copiar link" aria-label={`Copiar link de ${poem.title}`}><Copy size={14} /></button>
      </div>
      <div aria-live="polite">
        {ok && <p className="mt-2 text-xs text-primary" data-testid={`share-ok-${poem.id}`}>{ok}</p>}
      </div>
      {err && <p role="alert" className="mt-2 text-xs text-destructive" data-testid={`share-error-${poem.id}`}>{err}</p>}
      {manual && <input readOnly value={manual} onFocus={(e) => e.currentTarget.select()} aria-label="Endereço do poema" className="mt-2 w-full rounded-md bg-background border border-input px-3 py-3 text-sm" />}
    </div>
  );
}
