import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import * as libcurl from "@mercuryworkshop/libcurl-transport";
import * as epoxy from "@mercuryworkshop/epoxy-transport";

const app = express();
const publicPath = fileURLToPath(new URL("./public", import.meta.url));

// The browser needs these headers for the WebAssembly/transport stack.
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Keep the shell, service worker, and version-coupled proxy bundles fresh.
  // This prevents an older Scramjet/BareMux script being mixed with a new page.
  if (
    req.path === "/" ||
    req.path === "/index.html" ||
    req.path === "/sw.js" ||
    req.path.startsWith("/scram/") ||
    req.path.startsWith("/baremux/") ||
    req.path.startsWith("/libcurl/") ||
    req.path.startsWith("/epoxy/")
  ) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "portal-browser" });
});

app.use(express.static(publicPath));
app.use("/scram/", express.static(scramjetPath));
app.use("/baremux/", express.static(baremuxPath));
if (libcurl.libcurlPath) app.use("/libcurl/", express.static(libcurl.libcurlPath));
if (epoxy.epoxyPath) app.use("/epoxy/", express.static(epoxy.epoxyPath));

app.use((_req, res) => res.status(404).type("text/plain").send("Not found"));

const server = createServer(app);
server.on("upgrade", (req, socket, head) => {
  let pathname;
  try {
    pathname = new URL(req.url || "/", "http://localhost").pathname;
  } catch {
    socket.destroy();
    return;
  }

  if (pathname === "/wisp/") {
    // wisp-js/server is the maintained drop-in replacement for wisp-server-node.
    req.url = pathname;
    try {
      wisp.routeRequest(req, socket, head);
    } catch (error) {
      console.error("Wisp upgrade failed:", error);
      socket.destroy();
    }
    return;
  }

  socket.end();
});

const port = Number.parseInt(process.env.PORT || "", 10) || 8080;
server.listen(port, "0.0.0.0", () => {
  console.log(`Portal running on port ${port}`);
  console.log(`transports: libcurl=${Boolean(libcurl.libcurlPath)} epoxy=${Boolean(epoxy.epoxyPath)}`);
});

function shutdown() {
  console.log("Shutting down Portal Browser...");
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
