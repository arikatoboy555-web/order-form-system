import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const assets = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/edit.html": ["edit.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/picker.css": ["picker.css", "text/css; charset=utf-8"],
  "/native-address.css": ["native-address.css", "text/css; charset=utf-8"],
  "/edit-styles.css": ["edit-styles.css", "text/css; charset=utf-8"],
  "/experiment-config.js": ["experiment-config.js", "text/javascript; charset=utf-8"],
  "/script.js": ["script.js", "text/javascript; charset=utf-8"],
  "/submit.js": ["submit.js", "text/javascript; charset=utf-8"],
  "/edit.js": ["edit.js", "text/javascript; charset=utf-8"],
  "/thai-addresses.js": ["thai-addresses.js", "text/javascript; charset=utf-8"]
};

const entries = Object.entries(assets).map(([route, [file, type]]) => {
  const content = readFileSync(resolve(file), "utf8");
  return JSON.stringify(route) + ":[" + JSON.stringify(content) + "," + JSON.stringify(type) + "]";
});

const worker = "const ASSETS={" + entries.join(",") + "};\n" +
"export default {async fetch(request){\n" +
"  const path=new URL(request.url).pathname;\n" +
"  const asset=ASSETS[path];\n" +
"  if(!asset)return new Response(\"Not found\",{status:404});\n" +
"  return new Response(asset[0],{headers:{\"content-type\":asset[1],\"cache-control\":\"public, max-age=300\"}});\n" +
"}};\n";

writeFileSync(resolve("dist/server/index.js"), worker, "utf8");
