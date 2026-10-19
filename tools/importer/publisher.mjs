// Watches content/ and publishes every new or changed page: DA upload + aem.page preview (never live).
// State: migration-work/published.json { "<doc path>": <mtimeMs published> }; log: migration-work/publisher.log
// usage: node migration-work/scripts/publisher.mjs [--once]
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = '/backups/blefebvre/da-alc-oc14/repo';
const CONTENT = path.join(ROOT, 'content');
const STATE = path.join(ROOT, 'migration-work/published.json');
const LOG = path.join(ROOT, 'migration-work/publisher.log');
const PUBLISH = path.join(ROOT, 'tools/importer/publish-to-da.sh');
// stale artefacts that must never be published (old homepage path before it moved to /index)
const SKIP = new Set(['en']);
const once = process.argv.includes('--once');

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
const log = (m) => fs.appendFileSync(LOG, `${new Date().toISOString()} ${m}\n`);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'images') walk(p, out);
    } else if (e.name.endsWith('.plain.html')) out.push(p);
  }
  return out;
}

function publish(docPath) {
  const list = `/tmp/publisher-${process.pid}.txt`;
  const out = `/tmp/publisher-${process.pid}.log`;
  fs.writeFileSync(list, `${docPath}\n`);
  fs.writeFileSync(out, '');
  execFileSync(PUBLISH, [list, out]);
  const line = fs.readFileSync(out, 'utf8').split('\n').find((l) => l.startsWith(`${docPath} `)) || `${docPath} no-result`;
  return { ok: /upload=2\d\d preview=2\d\d/.test(line), line };
}

async function tick() {
  let done = 0;
  for (const file of walk(CONTENT)) {
    const doc = path.relative(CONTENT, file).replace(/\.plain\.html$/, '');
    if (SKIP.has(doc)) continue;
    const { mtimeMs } = fs.statSync(file);
    // let a file settle for a few seconds after it is written
    if (state[doc] >= mtimeMs || Date.now() - mtimeMs < 5000) continue;
    const r = publish(doc);
    log(r.line);
    if (r.ok) {
      state[doc] = mtimeMs;
      fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
      done += 1;
    }
  }
  return done;
}

do {
  const n = await tick();
  if (n) log(`tick published=${n} total=${Object.keys(state).length}`);
  if (!once) await new Promise((r) => { setTimeout(r, 20000); });
} while (!once);
