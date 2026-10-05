#!/usr/bin/env bash
# 构建并部署四个 Worker。
#   bash scripts/deploy-all.sh dry-run   # 不需要凭据，只验证产物与绑定
#   bash scripts/deploy-all.sh           # 真正上传（需要 wrangler 已登录）
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
mode="${1:-deploy}"
apps=(genshin honkaistarrail zenlesszonezero portal)

if [ "$mode" = "deploy" ]; then
  if npx wrangler whoami 2>&1 | grep -q "not authenticated"; then
    echo "未登录 Cloudflare：先跑 npx wrangler login，或用 CLOUDFLARE_API_TOKEN 环境变量。" >&2
    exit 1
  fi
fi

for app in "${apps[@]}"; do
  echo
  echo "=== $app ==="
  if ! ( cd "$root" && pnpm --filter "@paibook/$app" build >/dev/null 2>&1 ); then
    echo "构建失败：$app" >&2
    exit 1
  fi
  cd "$root/apps/$app"
  if [ "$mode" = "dry-run" ]; then
    npx wrangler deploy .output/server/index.mjs --assets .output/public --dry-run --outdir "/tmp/pb-dryrun-$app" 2>&1 \
      | grep -E "Total Upload|env\.|dry-run: exiting" || true
  else
    npx wrangler deploy .output/server/index.mjs --assets .output/public
  fi
done

echo
echo "完成（${mode}）"
