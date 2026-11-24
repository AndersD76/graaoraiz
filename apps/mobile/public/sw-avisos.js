// Service worker dos avisos de mensagem nova (Web Push) da versão web do Grão Raiz.
// O servidor (apps/web/lib/push.ts) manda { titulo, corpo, caminho, marca }; tocar no aviso abre a conversa.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { corpo: evento.data ? evento.data.text() : '' };
  }
  const titulo = dados.titulo || 'Grão Raiz';
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.corpo || 'Você tem uma mensagem nova.',
      icon: '/icone-aviso.png',
      badge: '/emblema-aviso.png',
      tag: dados.marca || 'grao-raiz',
      renotify: true,
      data: { caminho: dados.caminho || '/conversas' },
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const caminho = (evento.notification.data && evento.notification.data.caminho) || '/conversas';
  const destino = new URL(caminho, self.location.origin).href;
  evento.waitUntil(
    (async () => {
      const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const janela of abertas) {
        if (new URL(janela.url).origin === self.location.origin && 'focus' in janela) {
          await janela.focus();
          if ('navigate' in janela) await janela.navigate(destino);
          return;
        }
      }
      await self.clients.openWindow(destino);
    })(),
  );
});
