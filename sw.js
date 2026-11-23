/* Tavares & Co. — guarda o app para abrir sem internet. Não toca nos dados (eles ficam no IndexedDB). */
const VERSAO = 'tavares-v1';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'fonts/montserrat-latin-400-normal.woff2', 'fonts/montserrat-latin-500-normal.woff2', 'fonts/montserrat-latin-600-normal.woff2', 'fonts/montserrat-latin-700-normal.woff2',
  'fonts/playfair-display-latin-500-normal.woff2', 'fonts/playfair-display-latin-600-normal.woff2', 'fonts/playfair-display-latin-700-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const chave = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(VERSAO).then(async c => {
    const salvo = await c.match(chave, { ignoreSearch: true });
    const rede = fetch(req).then(r => { if (r.ok) c.put(chave, r.clone()); return r; }).catch(() => null);
    return salvo || (await rede) || new Response('Sem conexão', { status: 503 });
  }));
});
