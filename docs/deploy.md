# 部署

按 `docs/adr/0003`（全栈 Cloudflare）、`0004`（组织与域名）执行。
流程由两个脚本承担：**体检**（`scripts/preflight-deploy.sh`）与**部署**（`scripts/deploy-all.sh`）。

## 0. 先体检

```bash
bash scripts/preflight-deploy.sh
```

它逐条列出还差什么，并附上修复命令；未登录 Cloudflare 时，D1 与 secrets 检查会明确标为"跳过"而不是假装通过。

## 1. 只有你能做的两步

```bash
# ① 登录（或在 CI 里用 API Token）
npx wrangler login

# ② 建库并把返回的 database_id 填进四个 wrangler.jsonc
npx wrangler d1 create paibook

# ②b 建图片存储桶（正文插图用）
npx wrangler r2 bucket create paibook-media

# ③ 给 GitHub 仓库加两个 secret（CI 部署用）
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

覆盖四站的存活、三个内容接口、后台双重上锁、robots/sitemap、搜索与分享卡片图。

脚本查不到、仍需人看一遍的：

- [ ] 三站主题确实各不相同（原神羊皮纸 / 星铁星海 / 绝区零霓虹）。
- [ ] 各站 `/admin` 能登录；**发布一篇后前台立刻可见**——这条是边缘缓存 purge 的真正验收点（ADR-0002）。
- [ ] 搜索：分站只出本游戏结果；门厅跨游戏。
- [ ] 404 页面是品牌化的（随便访问一个不存在的路径）。
