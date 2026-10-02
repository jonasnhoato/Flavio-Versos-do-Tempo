import type { BlogInfo, Poem } from './data';

export const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

export function permalink(id: number): string {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
  return `${window.location.origin}${base}poema/${id}`;
}

export function dateKey(createdAt: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(createdAt));
}

export function formatDate(createdAt: string): string {
  const [y, m, d] = dateKey(createdAt).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

export function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export type ArchiveTree = { year: string; count: number; months: { month: string; count: number; days: { date: string; day: string; count: number }[] }[] }[];

export function buildArchive(items: BlogInfo['archive']): ArchiveTree {
  const years = new Map<string, Map<string, { date: string; day: string; count: number }[]>>();
  [...items].sort((a, b) => b.date.localeCompare(a.date)).forEach((it) => {
    const [y, m, d] = it.date.split('-');
    if (!years.has(y)) years.set(y, new Map());
    const ms = years.get(y)!;
    if (!ms.has(m)) ms.set(m, []);
    ms.get(m)!.push({ date: it.date, day: d, count: it.count });
  });
  return [...years.entries()].map(([year, ms]) => {
    const months = [...ms.entries()].map(([month, days]) => ({ month, days, count: days.reduce((a, d) => a + d.count, 0) }));
    return { year, months, count: months.reduce((a, m) => a + m.count, 0) };
  });
}

export function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') return (e as { message: string }).message;
  return 'Algo não saiu como esperado. Tente de novo.';
}

export async function makePoemImage(poem: Poem): Promise<Blob> {
  const W = 1080, pad = 90, lh = 52;
  const c = document.createElement('canvas');
  const measure = c.getContext('2d')!;
  measure.font = '36px Georgia, serif';
  const lines: string[] = [];
  for (const raw of poem.content.split('\n')) {
    if (!raw.trim()) { lines.push(''); continue; }
    let cur = '';
    for (const w of raw.split(' ')) {
      const t = cur ? cur + ' ' + w : w;
      if (measure.measureText(t).width > W - pad * 2 && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    lines.push(cur);
  }
  const cut = lines.length > 34;
  const shown = cut ? lines.slice(0, 34) : lines;
  if (cut) shown.push('', '… leia o poema completo no link do blog.');
  const H = pad * 2 + 150 + shown.length * lh + 90;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0f1520'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#d9b46b'; g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = '#d9b46b'; g.font = 'italic 56px Georgia, serif'; g.textBaseline = 'top';
  g.fillText(poem.title.slice(0, 40), pad, pad + 20);
  g.fillStyle = '#ece3cf'; g.font = '36px Georgia, serif';
  shown.forEach((l, i) => g.fillText(l, pad, pad + 150 + i * lh));
  g.fillStyle = '#9fa6b2'; g.font = '28px Georgia, serif';
  g.fillText('Flávio — Versos do Tempo' + (poem.isExample ? '  ·  Texto de demonstração' : ''), pad, H - pad - 20);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Falha ao criar a imagem'))), 'image/png'));
}
