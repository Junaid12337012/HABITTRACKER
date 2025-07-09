// This service worker handles notification events.

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // This looks for an open window with the app's URL and focuses it.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it.
      if (clientList.length > 0) {
        let client = clientList[0];
        // Find the focused window or the first one.
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      // Otherwise, open a new window.
      return clients.openWindow('/');
    })
  );
});
