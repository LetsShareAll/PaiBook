#!/usr/bin/env bash
# 上线前后都能跑的冒烟检查：四站是否真的活着、内容是否可读、后台是否仍然上锁。
# 用法：
#   bash scripts/smoke.sh                     # 本地四个 dev server（4123-4126）
#   bash scripts/smoke.sh https://paibook.lssa.fun   # 线上
set -uo pipefail

BASE="${1:-}"
fail=0

check() {
  local name="$1" url="$2" expect="$3" needle="${4:-}"
  local code
  code=$(curl -s -m 20 -o /tmp/pb-smoke-body -w "%{http_code}" "$url" 2>/dev/null || echo 000)
  if [ "$code" != "$expect" ]; then
    printf 'FAIL %-30s %-4s (期望 %s)  %s\n' "$name" "$code" "$expect" "$url"
    fail=1
    return
  fi
  if [ -n "$needle" ] && ! grep -q "$needle" /tmp/pb-smoke-body; then
    printf 'FAIL %-30s 内容里没有「%s」  %s\n' "$name" "$needle" "$url"
    fail=1
    return
  fi
  printf 'ok   %-30s %s\n' "$name" "$code"
}

# 游戏站：三份内容接口 + 后台必须上锁
check_game() {
  local root="$1" prefix="$2" label="$3"
  printf '\n--- %s%s ---\n' "$root" "$prefix"
  check "$label 首页" "$root$prefix/" 200
  check "$label robots" "$root$prefix/robots.txt" 200 "Sitemap:"
  check "$label sitemap" "$root$prefix/sitemap.xml" 200 "guides/"
  check "$label 攻略接口" "$root$prefix/api/guides" 200 "\"items\""
  check "$label 实体接口" "$root$prefix/api/entities" 200 "\"items\""
  check "$label 搜索" "$root$prefix/api/search?q=%E7%A4%BA%E4%BE%8B" 200
  check "$label 后台接口上锁" "$root$prefix/api/admin/guides" 401
  check "$label 后台内容上锁" "$root$prefix/api/admin/links" 401
  check "$label 后台页面" "$root$prefix/admin" 200
}

check_portal() {
  local root="$1"
  printf '\n--- %s（门厅）---\n' "$root"
  check "门厅 首页" "$root/" 200
  check "门厅 robots" "$root/robots.txt" 200 "Sitemap:"
  check "门厅 sitemap" "$root/sitemap.xml" 200 "genshin/"
  check "门厅 游戏清单" "$root/api/games" 200 "\"items\""
  check "门厅 跨游戏搜索" "$root/api/search?q=%E7%A4%BA%E4%BE%8B" 200
}

if [ -z "$BASE" ]; then
  check_portal "http://localhost:4126"
  check_game "http://localhost:4123" "/genshin" "原神"
  check_game "http://localhost:4124" "/honkaistarrail" "星铁"
  check_game "http://localhost:4125" "/zenlesszonezero" "绝区零"
else
  BASE="${BASE%/}"
  check_portal "$BASE"
  check_game "$BASE" "/genshin" "原神"
  check_game "$BASE" "/honkaistarrail" "星铁"
  check_game "$BASE" "/zenlesszonezero" "绝区零"
fi

printf '\n%s\n' "$([ $fail -eq 0 ] && echo '全部通过' || echo '存在失败项')"
exit $fail
