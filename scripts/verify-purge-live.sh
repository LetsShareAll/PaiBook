#!/usr/bin/env bash
# 线上验收：发布一篇攻略 → 前台必须立刻可见（ADR-0002 的边缘缓存 purge）。
# 这是唯一"只能在真实 Cloudflare 上验"的断言——本地与 wrangler dev 都已经验过，
# 但真实的边缘缓存行为只有线上能证明。
#
# 用法：
#   ADMIN_PASSWORD=你的后台密码 bash scripts/verify-purge-live.sh
#   ADMIN_PASSWORD=... bash scripts/verify-purge-live.sh https://paibook.lssa.fun /genshin
#
# 脚本自己清理：无论成功失败，都会删掉它创建的临时条目。
set -uo pipefail

BASE="${1:-https://paibook.lssa.fun}"
PREFIX="${2:-/genshin}"
SITE="${BASE%/}${PREFIX}"
PASSWORD="${ADMIN_PASSWORD:?需要 ADMIN_PASSWORD 环境变量（后台密码）}"

STAMP=$(date +%s)
SLUG="purge-live-${STAMP}"
TITLE="线上 purge 验证 ${STAMP}"
JAR=$(mktemp)
GUIDE_ID=""
fail=0

cleanup() {
  if [ -n "$GUIDE_ID" ]; then
    curl -s -o /dev/null -X DELETE -b "$JAR" "${SITE}/api/admin/guides/${GUIDE_ID}"
    echo "已删除临时条目 ${GUIDE_ID}"
  fi
  rm -f "$JAR"
}
trap cleanup EXIT

echo "站点：$SITE"
echo "--- 1. 预热首页（让它进边缘缓存）---"
curl -s -o /dev/null "${SITE}/"
echo "ok   已预热"

echo "--- 2. 登录 ---"
code=$(curl -s -c "$JAR" -o /dev/null -w "%{http_code}" -X POST "${SITE}/api/admin/login" \
  -H 'content-type: application/json' --data-binary "{\"password\":\"${PASSWORD}\"}")
if [ "$code" != "200" ]; then
  echo "FAIL 登录失败（HTTP ${code}）：密码不对，或这个站的 ADMIN_PASSWORD 还没设置"
  exit 1
fi
echo "ok   登录成功"

echo "--- 3. 建草稿：前台不能出现 ---"
GUIDE_ID=$(curl -s -b "$JAR" -X POST "${SITE}/api/admin/guides" -H 'content-type: application/json' \
  --data-binary "{\"title\":\"${TITLE}\",\"slug\":\"${SLUG}\",\"summary\":\"线上 purge 验收，脚本会自动删除\",\"body\":\"## 验收\n\n这条内容只用于验证发布链路。\",\"versionId\":null,\"entityIds\":[]}" \
  | jq -r '.id // empty')
if [ -z "$GUIDE_ID" ]; then echo "FAIL 创建草稿失败"; exit 1; fi
if curl -s "${SITE}/" | grep -q "${TITLE}"; then
  echo "FAIL 草稿泄漏到前台"
  fail=1
else
  echo "ok   草稿未出现在前台"
fi

echo "--- 4. 发布：首页必须立刻出现（purge 的关键断言）---"
curl -s -o /dev/null -b "$JAR" -X POST "${SITE}/api/admin/guides/${GUIDE_ID}/status" \
  -H 'content-type: application/json' --data-binary '{"status":"published"}'
if curl -s "${SITE}/" | grep -q "${TITLE}"; then
  echo "ok   发布后首页立刻可见——边缘缓存确实失效了"
else
  echo "FAIL 发布后首页仍是旧的：purge 没生效（ADR-0002 的核心断言不成立）"
  fail=1
fi

echo "--- 5. 详情页与站点地图 ---"
detail=$(curl -s -o /dev/null -w "%{http_code}" "${SITE}/guides/${SLUG}")
[ "$detail" = "200" ] && echo "ok   详情页 200" || { echo "FAIL 详情页 ${detail}"; fail=1; }
curl -s "${SITE}/sitemap.xml" | grep -q "${SLUG}" && echo "ok   已进 sitemap" || { echo "FAIL sitemap 未收录"; fail=1; }

echo
[ "$fail" -eq 0 ] && echo "线上 purge 验收通过" || echo "线上 purge 验收失败"
exit "$fail"
