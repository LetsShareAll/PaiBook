# 部署清单

按 `docs/adr/0003`（全栈 Cloudflare）、`0004`（组织与域名）执行。**只有你能做的步骤**已单独标出。

## 0. 还差的代码工作（部署前必须先做）

- [ ] **各站的路径前缀**：三款游戏要挂在 `paibook.lssa.fun/genshin`、`/honkaistarrail`、`/zenlesszonezero`，门厅挂在 `/`。
      现在各应用的页面路径还是根路径（`/guides/x`、`/search`），需要在每个游戏应用上设置 `app.baseURL = '/<slug>/'`，
      并让门厅与三站之间的链接使用带前缀的绝对路径。**这一步没做完，线上路由会 404。**

## 1. 只有你能做的步骤

- [ ] 登录 Cloudflare：`npx wrangler login`（或建一个 API Token 用于 CI）。
- [ ] 建数据库：`npx wrangler d1 create paibook`，把返回的 `database_id` 填进四个应用的 `wrangler.jsonc`
      （现在还是占位 `00000000-0000-0000-0000-000000000000`）。
- [ ] 建 DNS/路由：`paibook.lssa.fun` 指向门厅 Worker；`/genshin/*`、`/honkaistarrail/*`、`/zenlesszonezero/*`
      分别指向三个站点 Worker。
- [ ] 在 GitHub 仓库里加两个 Actions secret：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
- [ ] 设置后台密码（每个站点 Worker 各一次）：
      `cd apps/genshin && npx wrangler secret put ADMIN_PASSWORD`，同样设置 `SESSION_SECRET`。

## 2. 数据库初始化（远端）

```bash
# 建表
cd apps/genshin
npx wrangler d1 execute paibook --remote --file=../../packages/db/migrations/0000_hesitant_rhodey.sql
npx wrangler d1 execute paibook --remote --file=../../packages/db/migrations/0001_guide_fts.sql

# 三款游戏的 game / version / entity 基础行（示例数据仅供本地；线上应换成真实内容）
# 注意：目前 game/version/entity 还没有管理界面，先手工写入或用脚本导入。
```

## 3. 部署

```bash
# 本地手动部署单个站点（CI 会自动做同样的事）
pnpm --filter @paibook/genshin build
cd apps/genshin && npx wrangler deploy .output/server/index.mjs --assets .output/public
```

CI：`.github/workflows/deploy.yml` 在 push 到 `main` 时对四个应用矩阵构建并部署（需要上面的两个 secret）。

## 4. 部署后自检

- [ ] `https://paibook.lssa.fun/` 门厅可访问，三个游戏卡片链接正确。
- [ ] `/genshin/`、`/honkaistarrail/`、`/zenlesszonezero/` 各自的主题与内容正确。
- [ ] 各站 `/admin` 能用 `ADMIN_PASSWORD` 登录；发布一篇后前台**立刻**可见（验证 purge）。
- [ ] 搜索：分站搜索只出本游戏结果；门厅搜索跨游戏。
- [ ] 页脚非官方声明在位；星铁站包含官方指引要求的署名句。
