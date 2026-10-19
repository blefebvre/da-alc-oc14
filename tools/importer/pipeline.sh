#!/bin/bash
# Sequential import -> DA upload -> aem.page preview pipeline.
# usage: pipeline.sh <name>:<bundle>:<urls-file> [<name>:<bundle>:<urls-file> ...]
# Logs: migration-work/import-<name>.log; status: migration-work/pipeline.status (publishing is done per page by publisher.mjs)
ROOT=/backups/blefebvre/da-alc-oc14/repo
cd "$ROOT" || exit 1
D=/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts
STATUS=migration-work/pipeline.status

# url-file -> doc paths exactly as the import scripts compute them (sanitizePath per segment)
# mode "pending": print URLs whose content file does not exist yet; mode "paths": print existing doc paths
docpaths() {
  node -e '
    const fs = require("fs");
    const seg = (s) => decodeURIComponent(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const doc = (u) => {
      const p = new URL(u).pathname.replace(/^\/content\/alc/, "").replace(/\/$/, "").replace(/\.html?$/, "");
      if (p === "" || p === "/en") return "index";
      return p.split("/").filter(Boolean).map(seg).join("/");
    };
    const urls = fs.readFileSync(process.argv[1], "utf8").split("\n").filter(Boolean);
    const exists = (u) => fs.existsSync(`content/${doc(u)}.plain.html`);
    const out = process.argv[2] === "pending" ? urls.filter((u) => !exists(u)) : urls.filter(exists).map(doc);
    process.stdout.write(out.join("\n") + (out.length ? "\n" : ""));
  ' "$1" "$2"
}

for spec in "$@"; do
  IFS=: read -r name bundle urls <<< "$spec"
  # the importer's own reuse check uses a different path mapping, so skip already-imported URLs here
  docpaths "$urls" pending > "migration-work/pending-$name.txt"
  echo "$(date -u +%FT%TZ) import-start $name pending=$(wc -l < "migration-work/pending-$name.txt")" >> "$STATUS"
  if [ -s "migration-work/pending-$name.txt" ]; then
    node "$D/run-bulk-import.js" --import-script "$bundle" --urls "migration-work/pending-$name.txt" > "migration-work/import-$name.log" 2>&1
  fi
  echo "$(date -u +%FT%TZ) import-end $name exit=$?" >> "$STATUS"

done
echo "$(date -u +%FT%TZ) pipeline-done" >> "$STATUS"
