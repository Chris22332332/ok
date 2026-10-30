import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const files = ["server.js", "public/sw.js"];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || `${file}: syntax check failed\n`);
    process.exit(result.status || 1);
  }
  console.log(`PASS syntax: ${file}`);
}

const html = readFileSync("public/index.html", "utf8");
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim());
if (!inlineScripts.length) throw new Error("No inline application script was found in public/index.html");
for (let index = 0; index < inlineScripts.length; index += 1) {
  new vm.Script(inlineScripts[index], { filename: `public/index.html:inline-script-${index + 1}` });
  console.log(`PASS syntax: public/index.html inline script ${index + 1}`);
}

for (const required of [
  "public/index.html",
  "public/sw.js",
  "package.json",
  "server.js",
  "render.yaml",
  ".node-version"
]) {
  readFileSync(required);
  console.log(`PASS file exists: ${required}`);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.scripts?.start !== "node server.js") throw new Error("package.json must start server.js");
if (!pkg.dependencies?.["@mercuryworkshop/bare-mux"] || !pkg.dependencies?.["@mercuryworkshop/scramjet"]) {
  throw new Error("BareMux and Scramjet dependencies must be declared");
}
if (!pkg.dependencies?.["@mercuryworkshop/wisp-js"] || pkg.dependencies?.["wisp-server-node"]) {
  throw new Error("The maintained wisp-js server must replace deprecated wisp-server-node");
}
console.log("PASS package metadata and maintained Wisp dependency");

if (!html.includes("websocket: wisp") || !html.includes("wisp: wisp")) {
  throw new Error("Both transport option shapes must be present");
}
if (!html.includes("setTransport(transportPath, transportOptions)")) {
  throw new Error("BareMux transport must be configured during setup");
}
console.log("PASS proxy transport initialization configuration");

const worker = readFileSync("public/sw.js", "utf8");
if (!worker.includes("portal-20261030-3")) throw new Error("Service worker build identifier is missing");
if (!html.includes("portal-20261030-3")) throw new Error("HTML build identifier is missing");
if (!worker.includes("Portal proxy request failed: ")) throw new Error("Service worker must expose diagnostic proxy errors");
console.log("PASS matching cache-busting build identifiers");
