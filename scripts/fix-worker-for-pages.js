/**
 * fix-worker-for-pages.js
 *
 * After `wrangler deploy --dry-run --outdir .open-next/bundled`, this script:
 *  1. Reads the bundled worker.js
 *  2. Rewrites bare node built-in imports (e.g. `from "crypto"`) to use the
 *     `node:` prefix (e.g. `from "node:crypto"`) so Cloudflare Pages'
 *     bundler can resolve them correctly.
 *  3. Writes the result to .open-next/assets/_worker.js so Pages picks it up
 *     in "advanced mode".
 */

const fs = require("fs");
const path = require("path");

const NODE_BUILTINS = [
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "sys",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
];

const inputPath = path.join(__dirname, "../.open-next/bundled/worker.js");
const outputPath = path.join(__dirname, "../.open-next/assets/_worker.js");

let content = fs.readFileSync(inputPath, "utf8");

// Replace bare imports like: from "crypto"  ->  from "node:crypto"
// Also handle require("crypto") -> require("node:crypto")
for (const mod of NODE_BUILTINS) {
  // ES module imports: from "mod" or from 'mod'
  content = content.replace(
    new RegExp(`from "(${mod})"`, "g"),
    `from "node:${mod}"`
  );
  content = content.replace(
    new RegExp(`from '(${mod})'`, "g"),
    `from 'node:${mod}'`
  );
  // CommonJS require: require("mod") or require('mod')
  content = content.replace(
    new RegExp(`require\\("(${mod})"\\)`, "g"),
    `require("node:${mod}")`
  );
  content = content.replace(
    new RegExp(`require\\('(${mod})'\\)`, "g"),
    `require('node:${mod}')`
  );
}

fs.writeFileSync(outputPath, content, "utf8");
console.log(`✓ Wrote _worker.js to ${outputPath}`);
