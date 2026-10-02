const paragraphs = [
  'Versos do Tempo é o espaço de poesia de Flavio Nhoato: um lugar para reunir palavras, preservar textos e fazer da leitura um encontro tranquilo. Como um livro que permanece por perto, este blog convida a abrir uma página, acompanhar cada verso e deixar que as palavras encontrem seu próprio tempo.',
  'Ao longo destas páginas, centenas de poemas serão compartilhados aos poucos, formando um acervo que cresce a cada publicação. Você pode percorrê-los na ordem em que aparecem, buscar um título ou um verso e revisitar os textos pelo arquivo de datas. Leia no seu ritmo e, quando um poema tocar você, compartilhe-o com alguém.',
];

export function BlogIntroduction() {
  return (
    <section className="ed-hero" aria-labelledby="ed-author">
      <div>
        <div className="ed-kicker ed-mono">Um caderno em movimento</div>
        <h1 id="ed-author">Flavio <span>Nhoato</span></h1>
        <div className="ed-hero-caption ed-mono">VERSOS DO TEMPO <span aria-hidden="true">/</span> POESIA, UM DIA DE CADA VEZ</div>
      </div>
      <div className="ed-intro">
        <div className="ed-intro-label ed-mono">Boas-vindas</div>
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}