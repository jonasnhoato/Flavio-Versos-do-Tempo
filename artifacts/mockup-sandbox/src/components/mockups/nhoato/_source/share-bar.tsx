import { useState } from 'react';
import { Link2, Mail } from 'lucide-react';
import { SiFacebook, SiInstagram, SiWhatsapp } from 'react-icons/si';
import type { Poem } from './data';
import { makePoemImage, permalink } from './poems';

export function ShareBar({ poem }: { poem: Poem }) {
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [manual, setManual] = useState('');
  const url = () => permalink(poem.id);
  const text = `${poem.title} — Flávio, Versos do Tempo`;
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

  const instagram = async () => {
    reset();
    try {
      const blob = await makePoemImage(poem);
      const file = new File([blob], `poema-${poem.id}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: poem.title, text }); setOk('Escolha o Instagram na lista de compartilhamento.'); return; }
        catch (e) { if ((e as Error).name === 'AbortError') return; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `poema-${poem.id}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setOk('O Instagram não aceita links de partilha pela web. Baixamos uma imagem do poema: abra o Instagram e publique-a de lá.');
    } catch {
      setErr('Não foi possível criar a imagem do poema neste aparelho.');
    }
  };

  const b = 'min-h-12 px-4 inline-flex items-center gap-2 rounded-full border border-input text-base hover:border-primary hover:text-primary';
  return (
    <div className="mt-6 pt-5 border-t border-border/70">
      <p className="text-base text-muted-foreground mb-3">Compartilhar este poema</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={b} data-testid={`share-facebook-${poem.id}`} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}><SiFacebook size={20} />Facebook</button>
        <button type="button" className={b} data-testid={`share-whatsapp-${poem.id}`} onClick={() => open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url())}`)}><SiWhatsapp size={20} />WhatsApp</button>
        <a className={b} data-testid={`share-email-${poem.id}`} href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(text + '\n\n' + url())}`}><Mail size={20} />E-mail</a>
        <button type="button" className={b} data-testid={`share-instagram-${poem.id}`} onClick={instagram}><SiInstagram size={20} />Instagram</button>
        <button type="button" className={b} data-testid={`share-copy-${poem.id}`} onClick={copy}><Link2 size={20} />Copiar endereço</button>
      </div>
      <div aria-live="polite">
        {ok && <p className="mt-3 text-base text-primary" data-testid={`share-ok-${poem.id}`}>{ok}</p>}
      </div>
      {err && <p role="alert" className="mt-3 text-base text-destructive" data-testid={`share-error-${poem.id}`}>{err}</p>}
      {manual && <input readOnly value={manual} onFocus={(e) => e.currentTarget.select()} aria-label="Endereço do poema" className="mt-2 w-full rounded-md bg-background border border-input px-3 py-3 text-base" />}
    </div>
  );
}
