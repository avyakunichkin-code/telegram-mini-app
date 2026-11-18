import { createHash } from 'node:crypto'

/** Bundle-only allowlist. Service worker never stores API or report responses. */
export function offlineShell() {
  return {
    name: 'plan-offline-shell',
    apply: 'build',
    generateBundle: { order: 'post', handler(_options, bundle) {
      const files = Object.keys(bundle).filter(f => /\.(?:js|css|html)$/.test(f))
      const version = createHash('sha256').update(files.map(f => f + (bundle[f].code || bundle[f].source || '')).join('|')).digest('hex').slice(0, 12)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = 'plan-shell-v1-${version}';
const ROOT = new URL('./', self.location.href);
const FILES = ${JSON.stringify(files)}.map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('plan-shell-v1-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || url.pathname.startsWith('/api/') || !url.href.startsWith(ROOT.href)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match(new URL('index.html', ROOT).href, { ignoreVary: true }))));
  } else if (FILES.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request, { ignoreVary: true })) || fetch(request)));
  }
});
` })
    } },
  }
}
