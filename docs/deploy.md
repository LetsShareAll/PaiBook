# 部署

按 `docs/adr/0003`（全栈 Cloudflare）、`0004`（组织与域名）执行。
流程由两个脚本承担：**体检**（`scripts/preflight-deploy.sh`）与**部署**（`scripts/deploy-all.sh`）。

## 0. 先体检

```bash
bash scripts/preflight-deploy.sh
```

它逐条列出还差什么，并附上修复命令；未登录 Cloudflare 时，D1 与 secrets 检查会明确标为"跳过"而不是假装通过。

## 部署现状（2026-10-06）

已经完成的部分，避免以后重复劳动或误判：

- D1 数据库 `paibook` 已创建，`database_id = a8373d8a-10ad-4abb-b2ba-996e988aebf8`，三份迁移已应用到远端；
- R2 桶 `paibook-media` 已创建，四个 Worker 的 `MEDIA` 绑定已生效；
- 线上只有三行 `game` 数据（`packages/db/seed/games.sql`），**没有导入示例攻略**；
- 四个 Worker 已部署，路由已声明：`paibook.lssa.fun/*` → 门厅，`/genshin/*`、`/honkaistarrail/*`、`/zenlesszonezero/*` → 三个游戏站；
- `SESSION_SECRET` 已设为随机值（四个 Worker 各自独立）；
- **待办**：`paibook.lssa.fun` 的 DNS 记录（wrangler 登录的授权范围不含 DNS，需要人工加或在面板操作）、`ADMIN_PASSWORD`、GitHub 仓库的两个 CI secret。

## 1. 只有你能做的两步

```bash
# ① 登录（或在 CI 里用 API Token）
npx wrangler login

# ② 建库并把返回的 database_id 填进四个 wrangler.jsonc
npx wrangler d1 create paibook

# ②b 建图片存储桶（正文插图用）
npx wrangler r2 bucket create paibook-media

# ③ DNS：给 paibook.lssa.fun 加一条「已代理」记录（Worker 路由会拦截，值用占位即可）
#    面板 → lssa.fun → DNS → 添加记录：类型 AAAA、名称 paibook、IPv6 地址 100::、代理状态=已代理
#    说明：这条记录必须存在且是橙云，Worker 路由才会生效；用占位地址不会真的回源。

# ④ 给 GitHub 仓库加两个 secret（CI 部署用）
gh secret set CLOUDFLARE_API_TOKEN --repo LetsShareAll/PaiBook
gh secret set CLOUDFLARE_ACCOUNT_ID --repo LetsShareAll/PaiBook
```

另外每个站点 Worker 要设两个后台密钥（各一次）：

```bash
for app in genshin honkaistarrail zenlesszonezero portal; do
  ( cd apps/$app && npx wrangler secret put ADMIN_PASSWORD && npx wrangler secret put SESSION_SECRET )
done
```

## 2. 数据库初始化（远端）

```bash
cd apps/genshin
npx wrangler d1 execute paibook --remote --file=../../packages/db/migrations/0000_hesitant_rhodey.sql
npx wrangler d1 execute paibook --remote --file=../../packages/db/migrations/0001_guide_fts.sql
npx wrangler d1 execute paibook --remote --file=../../packages/db/migrations/0002_entity_unique.sql
```

`game` / `version` / `entity` 的基础行现在可以在写作台的「分类维护」里加，不必再写 SQL；
`packages/db/seed/dev.sql` 是本地示例数据，线上不要用。

## 3. 部署

```bash
# 不需要凭据，先验证四个产物与绑定
bash scripts/deploy-all.sh dry-run

# 真正上传
bash scripts/deploy-all.sh
```

CI（`.github/workflows/deploy.yml`）在 push 到 `main` 时会做同样的事，需要第 1 步里的两个 secret。

## 4. 线上验收

```bash
bash scripts/smoke.sh https://paibook.lssa.fun
```

也可以让 GitHub 替你跑（本机到 Cloudflare 边缘可能被网络策略拦住时尤其有用）：
`Actions → live-smoke → Run workflow`，它同时每天 UTC 01:20 自动巡检一次。

覆盖四站的存活、三个内容接口、后台双重上锁、robots/sitemap、搜索与分享卡片图。

脚本查不到、仍需人看一遍的：

- [ ] 三站主题确实各不相同（原神羊皮纸 / 星铁星海 / 绝区零霓虹）。
- [ ] **发布一篇后前台立刻可见**——边缘缓存 purge 的真正验收点（ADR-0002）。这条只能在真实 Cloudflare 上验，
      所以给了独立脚本（它自己建、自己删，不留垃圾）：

      ```bash
      ADMIN_PASSWORD=你的后台密码 bash scripts/verify-purge-live.sh
      ```

      或者给仓库加 `ADMIN_PASSWORD` secret，然后在 Actions 里手动触发 `live-smoke` 并勾选 `check_purge`。
- [ ] 搜索：分站只出本游戏结果；门厅跨游戏。
- [ ] 404 页面是品牌化的（随便访问一个不存在的路径）。
