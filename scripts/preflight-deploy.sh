#!/usr/bin/env bash
# 上线前体检：把「还差什么」一条条列出来，每条都附上修复命令。
# 需要凭据的检查在未登录时会明确标为「未验证」，不会假装通过。
set -uo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
apps=(genshin honkaistarrail zenlesszonezero portal)
todo=0

ok()   { printf 'ok    %s\n' "$1"; }
miss() { printf '待办  %s\n      → %s\n' "$1" "$2"; todo=$((todo + 1)); }

echo "== 本地仓库 =="
if git -C "$root" ls-files --error-unmatch apps/genshin/.dev.vars >/dev/null 2>&1; then
  miss ".dev.vars 被提交进了仓库" "git rm --cached apps/*/.dev.vars"
else
  ok ".dev.vars 未被提交"
fi

for app in "${apps[@]}"; do
  [ -f "$root/apps/$app/public/og.png" ] || miss "apps/$app 缺分享卡片图" "pnpm og:build"
done
[ -f "$root/.github/workflows/deploy.yml" ] && ok "CI 工作流存在" || miss "缺 CI 工作流" "见 docs/deploy.md"

echo
echo "== Cloudflare =="
if npx wrangler whoami 2>&1 | grep -q "not authenticated"; then
  miss "wrangler 未登录" "npx wrangler login（或导出 CLOUDFLARE_API_TOKEN）"
  authed=0
else
  ok "wrangler 已登录"
  authed=1
fi

for app in "${apps[@]}"; do
  id=$(grep -oE '"database_id"\s*:\s*"[^"]+"' "$root/apps/$app/wrangler.jsonc" | head -1 | grep -oE '[0-9a-f-]{36}')
  if [ "$id" = "00000000-0000-0000-0000-000000000000" ]; then
    miss "apps/$app 的 database_id 还是占位符" "npx wrangler d1 create paibook，然后把返回的 id 填进四个 wrangler.jsonc"
  else
    ok "apps/$app 的 database_id 已填写"
  fi
done

if [ "${authed:-0}" = "1" ]; then
  if npx wrangler d1 list --json 2>/dev/null | grep -q '"paibook"'; then
    ok "D1 数据库 paibook 存在"
  else
    miss "D1 数据库 paibook 不存在" "npx wrangler d1 create paibook"
  fi
  for app in "${apps[@]}"; do
    list=$(cd "$root/apps/$app" && npx wrangler secret list 2>/dev/null || true)
    echo "$list" | grep -q "ADMIN_PASSWORD" || miss "apps/$app 缺 ADMIN_PASSWORD" "cd apps/$app && npx wrangler secret put ADMIN_PASSWORD"
    echo "$list" | grep -q "SESSION_SECRET" || miss "apps/$app 缺 SESSION_SECRET" "cd apps/$app && npx wrangler secret put SESSION_SECRET"
  done
else
  echo "跳过  D1 / secrets 检查（未登录，无法验证）"
fi

echo
echo "== GitHub =="
if gh secret list --repo LetsShareAll/PaiBook >/tmp/pb-gh-secrets 2>/dev/null; then
  grep -q "CLOUDFLARE_API_TOKEN" /tmp/pb-gh-secrets || miss "仓库缺 CLOUDFLARE_API_TOKEN" "gh secret set CLOUDFLARE_API_TOKEN --repo LetsShareAll/PaiBook"
  grep -q "CLOUDFLARE_ACCOUNT_ID" /tmp/pb-gh-secrets || miss "仓库缺 CLOUDFLARE_ACCOUNT_ID" "gh secret set CLOUDFLARE_ACCOUNT_ID --repo LetsShareAll/PaiBook"
else
  miss "读不到仓库 secret 列表" "确认 gh 已登录且有仓库权限"
fi

echo
if [ "$todo" -eq 0 ]; then
  echo "体检通过：可以部署（bash scripts/deploy-all.sh）"
else
  echo "还有 $todo 项待办"
fi
exit 0
