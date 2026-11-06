// Online-only PWA. Never intercept or cache account, plan, API or image traffic.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
