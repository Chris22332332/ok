// Portal Browser service worker. The build query ensures each deployment gets a fresh Scramjet runtime.
importScripts("/scram/scramjet.all.js?v=portal-20261030-3");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function handleRequest(event) {
  await scramjet.loadConfig();
  if (scramjet.route(event)) return scramjet.fetch(event);
  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event).catch((error) => {
    // Keep the original error visible in the proxied frame; this makes genuine
    // transport/controller failures diagnosable instead of showing a generic page.
    const message = error && error.message ? error.message : String(error);
    console.error("Portal service worker proxy request failed:", {
      url: event.request.url,
      destination: event.request.destination,
      message,
      stack: error && error.stack ? error.stack : undefined
    });

    return new Response("Portal proxy request failed: " + message, {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }));
});
