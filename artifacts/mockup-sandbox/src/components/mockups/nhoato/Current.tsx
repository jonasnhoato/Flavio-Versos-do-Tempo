import { useState } from 'react';
import { Router } from 'wouter';
import { Plus, Search } from 'lucide-react';
import { SiteHeader } from './_source/site-header';
import { PoemCard } from './_source/poem-card';
import { ArchiveSidebar, type ArchiveSel } from './_source/archive-sidebar';
import { buildArchive } from './_source/poems';
import { poems } from './_source/data';
import './_group.css';

export function Current() {
  const [sel, setSel] = useState<ArchiveSel>({});
  const tree = buildArchive(poems.map(p => ({ date: p.createdAt.slice(0, 10), count: 1 })));
  return <Router><div className="min-h-screen bg-background text-foreground">
    <SiteHeader />
    <div className="bg-secondary/50 text-muted-foreground text-center px-4 py-3 text-base">Os poemas marcados como “Texto de demonstração” são apenas exemplos e não são de autoria de Flávio.</div>
    <div className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-[17rem_1fr] gap-8">
      <aside className="lg:sticky lg:top-28 self-start"><ArchiveSidebar tree={tree} sel={sel} onSelect={setSel} /></aside>
      <section className="min-w-0">
        <div className="mb-6"><h1 className="font-display text-5xl sm:text-6xl text-foreground leading-none">Poemas</h1><p className="mt-2 text-lg text-muted-foreground">3 poemas no caderno</p></div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[14rem]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={22}/><input aria-label="Buscar poemas" placeholder="Buscar por título ou verso" className="w-full min-h-12 rounded-full bg-card border-2 border-input pl-12 pr-12 text-lg" /></div>
          <button className="min-h-12 px-6 rounded-full inline-flex items-center gap-2 text-lg font-semibold bg-primary text-primary-foreground"><Plus size={22}/>Adicionar texto</button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground/80">Modo de desenvolvimento: a edição está ativa só durante o desenvolvimento.</p>
        <p className="mb-4 text-base text-muted-foreground">Para mudar a ordem, segure a alça e arraste, ou use as setas.</p>
        <div className="space-y-6">{poems.map((poem,i) => <PoemCard key={poem.id} poem={poem} canEdit onEdit={()=>{}} onDelete={()=>{}} reorder={{onUp:()=>{},onDown:()=>{},disableUp:i===0,disableDown:i===2,busy:false,onHandleDown:()=>{}}}/>)}</div>
      </section>
    </div>
  </div></Router>;
}