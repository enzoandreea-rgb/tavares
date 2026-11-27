/* Tavares & Co. — guarda o app para abrir sem internet. Não toca nos dados (eles ficam no IndexedDB). */
const VERSAO = 'tavares-2026.11.27-3';
const ARQUIVOS = ['index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'montserrat-latin-400-normal.woff2', 'montserrat-latin-500-normal.woff2', 'montserrat-latin-600-normal.woff2', 'montserrat-latin-700-normal.woff2',
  'playfair-display-latin-500-normal.woff2', 'playfair-display-latin-600-normal.woff2', 'playfair-display-latin-700-normal.woff2'];
// baixa sempre do servidor (ignora o cache de 10 min do GitHub Pages no navegador)
const fresco = url => fetch(new Request(url, { cache: 'reload' }));
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(ARQUIVOS.map(a => fresco(a).then(r => r.ok ? c.put(a, r) : null).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') { // página: tenta a versão nova primeiro; sem internet, usa a guardada
    e.respondWith((async () => {
      const c = await caches.open(VERSAO);
      try {
        const r = await Promise.race([fresco(req.url), new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 4000))]);
        if (r.ok) { c.put('index.html', r.clone()); return r; }
      } catch (er) {}
      return (await c.match('index.html')) || new Response('Sem conexão', { status: 503 });
    })());
    return;
  }
  e.respondWith(caches.open(VERSAO).then(async c => (await c.match(req, { ignoreSearch: true })) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
});
