#!/usr/bin/env bash
# 初始化各应用的本地 D1（miniflare 按应用目录分别保存状态，所以每个应用都要来一遍）。
# 用法：bash scripts/local-db.sh [应用名...]
set -uo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
apps=("$@")
if [ ${#apps[@]} -eq 0 ]; then
  apps=(genshin honkaistarrail zenlesszonezero portal)
fi

for app in "${apps[@]}"; do
  dir="$root/apps/$app"
  if [ ! -d "$dir" ]; then
    echo "skip: apps/$app not found"
    continue
  fi

  (
    cd "$dir"
    for migration in "$root"/packages/db/migrations/*.sql; do
      out=$(npx wrangler d1 execute paibook --local --file="$migration" 2>&1 || true)
      case "$out" in
        *"already exists"*) ;;
        *'"success": true'*) echo "apps/${app}: applied $(basename "$migration")" ;;
      esac
    done
    npx wrangler d1 execute paibook --local --file="$root/packages/db/seed/dev.sql" >/dev/null 2>&1 \
      && echo "apps/${app}: seed applied"
    node "$root/scripts/reindex-local.mjs" "$dir" >/dev/null 2>&1 \
      && echo "apps/${app}: search index rebuilt"
  )
done
