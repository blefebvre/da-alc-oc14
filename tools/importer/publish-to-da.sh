#!/bin/bash
# Upload imported pages to Document Authoring and trigger preview (aem.page only — never live).
# usage: publish-to-da.sh <file-with-doc-paths> [log-file]
#   doc paths are content-relative without extension, e.g. en/play-online/casino/golden
# Credentials are injected by the environment for admin.da.live / admin.hlx.page.
ORG=blefebvre
REPO=da-alc-oc14
LIST="$1"
LOG="${2:-/dev/stdout}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

post() { # url [curl args...] -> prints http code, retries on 429/5xx
  local url="$1"; shift
  local code=000
  for attempt in 1 2 3 4 5; do
    code=$(curl -s -o /tmp/publish-resp.$$ -w "%{http_code}" -X POST "$@" "$url")
    case "$code" in 2*) break ;; 429|5*|000) sleep $((attempt * 3)) ;; *) break ;; esac
  done
  echo "$code"
}

ok=0; fail=0
while read -r path; do
  [ -z "$path" ] && continue
  src="$ROOT/content/$path.plain.html"
  if [ ! -f "$src" ]; then echo "MISSING $path" >> "$LOG"; fail=$((fail + 1)); continue; fi
  tmp="/tmp/da-upload-$$.html"
  { echo '<body><header></header><main>'; sed "s#src=\"images/#src=\"https://content.da.live/$ORG/$REPO/images/#g" "$src"; echo '</main><footer></footer></body>'; } > "$tmp"
  up=$(post "https://admin.da.live/source/$ORG/$REPO/$path.html" -F "data=@$tmp;type=text/html")
  webpath="$path"; [ "$path" = "index" ] && webpath=""
  pv=$(post "https://admin.hlx.page/preview/$ORG/$REPO/main/$webpath")
  echo "$path upload=$up preview=$pv" >> "$LOG"
  if [[ "$up" == 2* && "$pv" == 2* ]]; then ok=$((ok + 1)); else fail=$((fail + 1)); fi
done < "$LIST"
echo "PUBLISH SUMMARY ok=$ok fail=$fail" >> "$LOG"
