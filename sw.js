/* PO-TRADE service worker — faster repeat loads + offline shell.
   SECURITY: only same-origin GET requests are ever handled. Auth / reset / confirm pages, any URL with a query string
   (tokens!), the banner config and every cross-origin request (Supabase, GitHub, fonts) go straight to the network and are never cached. */
const VER = 'po-v18-profile-dock-explore-logo-20261022';
const SHELL = ['./', 'index.html', 'style.css', 'themes.css', 'legend.css', 'redesign.css', 'prism.css', 'nebula.css', 'onboarding.css', 'community-layout-fix.css', 'prism.js', 'nebula.js', 'app.js', 'cosmos-coach.css', 'social-explore.css', 'social-explore.js', 'community-profile.js', 'ai-coach.js', 'ai-coach-content.js', 'sync.js', 'assistant.js', 'alerts.js', 'analysis-plus.js', 'tools.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.ico', 'favicon-32.png', 'favicon-16.png', 'brand-emblem.png'];
const NEVER = /(^|\/)(auth|reset-password|confirm|welcome)\.html$|(^|\/)banner-config\.js$|(^|\/)sw\.js$/i;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('po-') === 0 && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function networkFirst(req, ms) {
  return new Promise(resolve => {
    let settled = false;
    const to = setTimeout(async () => { const c = await caches.match(req); if (c && !settled) { settled = true; resolve(c); } }, ms);
    fetch(req).then(res => {
      clearTimeout(to);
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)).catch(() => {}); }
      if (!settled) { settled = true; resolve(res); }
    }).catch(async () => {
      clearTimeout(to);
      const c = await caches.match(req);
      if (!settled) { settled = true; resolve(c || Response.error()); }
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           /* never touch cross-origin */
  if (url.search) return;                                    /* query strings may carry tokens */
  if (NEVER.test(url.pathname)) return;                      /* auth flow + banner: network only */
  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, 2500)); return; }
  if (/\.(?:js|css|png|webmanifest|svg|woff2?|ico)$/i.test(url.pathname)) e.respondWith(networkFirst(req, 1200));
});
