import { useEffect } from 'react';

export function useMeta(title: string, description: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
    m.setAttribute('content', description);
    for (const [property, content] of [['og:title', title], ['og:description', description]]) {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('property', property); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    }
  }, [title, description, enabled]);
}
