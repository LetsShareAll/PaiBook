#!/usr/bin/env bash
# 初始化各应用的本地 D1（miniflare 按应用目录分别保存状态，所以每个应用都要来一遍）。
# 用法：./scripts/local-db.sh genshin honkaistarrail zenlesszonezero portal
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
apps=("$@")
if [ ${#apps[@]} -eq 0 ]; then
  apps=(genshin honkaistarrail zenlesszonezero portal)
fi

for app in "${apps[@]}"; do
  dir="$root/apps/$app"
  if [ ! -d "$dir" ]; then
    echo "跳过：apps/$app 不存在"
    continue
  fi

  (
    cd "$dir"
    has_guide=$(npx wrangler d1 execute paibook --local --json \
      --command "SELECT name FROM sqlite_master WHERE type='table' AND name='guide';" 2>/dev/null \
      | jq -r '.[0].results | length' 2>/dev/null || echo 0)

    if [ "${has_guide:-0}" = "0" ]; then
      for migration in "$root"/packages/db/migrations/*.sql; do
        npx wrangler d1 execute paibook --local --file="$migration" >/dev/null
      done
      echo "apps/${app}: tables created"
    fi

    npx wrangler d1 execute paibook --local --file="$root/packages/db/seed/dev.sql" >/dev/null
    echo "apps/${app}: seed applied"
  )
done
