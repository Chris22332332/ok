PORTAL BROWSER — RENDER DEPLOYMENT

WHAT CHANGED
- The existing Portal layout and styling are preserved.
- Proxy startup now configures BareMux before waiting for the service worker.
- CurlTransport receives its documented { websocket } option; Epoxy receives { wisp }.
- Startup checks that the required Scramjet, BareMux, and transport files are actually served.
- If Scramjet initialization finds a missing IndexedDB object store, the app attempts a targeted reset of Scramjet-named databases only, then retries once. It does not clear unrelated browser storage.
- Replaced deprecated wisp-server-node with the maintained @mercuryworkshop/wisp-js server used by the upstream Scramjet demo.
- Wisp WebSocket upgrades now route only through the exact /wisp/ endpoint.
- Proxy request failures now show the underlying error instead of a generic service-worker message.
- The service worker and version-coupled scripts are cache-busted and served with no-cache headers.
- /healthz is included for Render health checks.

DEPLOY TO YOUR EXISTING RENDER SERVICE
1. Extract this ZIP.
2. Upload/replace the extracted files in the ROOT of the same GitHub repository connected to your Render service.
   package.json and server.js must be at the repository root. The browser files must be in public/.
3. Commit the changes to the main branch (or the branch your Render service uses).
4. In Render, open the existing netttooo service and use Manual Deploy -> Deploy latest commit if it does not deploy automatically.
5. Keep Build Command as: npm install
6. Keep Start Command as: npm start
7. No API keys or environment variables are required by this project as supplied.

RENDER SETTINGS
- Runtime: Node
- Node version: 22 (the .node-version file specifies this)
- Health Check Path: /healthz
- Pre-Deploy Command: blank

AFTER DEPLOY
1. Close every tab open to netttooo.onrender.com.
2. Open https://netttooo.onrender.com/ in a new tab and hard refresh (Ctrl+Shift+R).
3. Try Wikipedia first. If the proxy still fails, open F12 -> Console and send the first red error plus Render's latest deploy/runtime logs.
4. You can force Epoxy by visiting https://netttooo.onrender.com/?transport=epoxy .

LOCAL RUN
Install Node.js 22, open a terminal in this folder, then run:
  npm install
  npm test
  npm start
Open http://localhost:8080 .

LIMITATIONS / TEST STATUS
The ZIP and local syntax/static checks can be verified in this environment. Installing npm dependencies and launching the real Scramjet/Wisp proxy could not be completed here because this environment cannot resolve external package hosts (DNS/network restriction). Therefore the live proxy must still be runtime-tested after Render redeploys. Some destination websites may independently block proxy traffic or behave differently from a normal browser.
