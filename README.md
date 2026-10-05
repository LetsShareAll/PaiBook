# PaiBook · 派书

> 不是应急食品，是应急手册！

《原神》《崩坏：星穹铁道》《绝区零》三款游戏的攻略站：**每个游戏一个独立的站点**，各自的主题与路由前缀，共享同一套数据模型与后端。

长标题：Paimon EmergencyBook · 派蒙的应急手册

## 站点

| 站点 | 路径 |
| --- | --- |
| 门厅（游戏选择 + 跨游戏搜索） | `/` |
| 原神 | `/genshin` |
| 崩坏：星穹铁道 | `/honkaistarrail` |
| 绝区零 | `/zenlesszonezero` |

线上地址：`https://paibook.lssa.fun`（尚未部署，见下）

## 现在能做什么

- **站内写稿发布**：`/<游戏>/admin` 登录后可写 Markdown、预览真实页面、发布或退回草稿；草稿不进列表、不进搜索。
- **发布即生效**：SSR + 边缘缓存，发布时清缓存（这套机制的实测记录见 `docs/adr/0002`）。
- **中文全文搜索**：FTS5 + bigram 索引（`docs/adr` 里记了为什么不是 trigram），分站搜索只出本游戏，门厅跨游戏。
- **我的档案**：勾选自己拥有的角色/代理人，过滤攻略；数据只存在浏览器 IndexedDB，服务端不保存任何用户数据（`docs/adr/0008`）。
- **站外推荐（Link）**：只存标题、自写摘要与出处，正文留在原站。
- **分类维护**：实体（角色/代理人/敌人…）与版本在写作台里直接增删。

## 快速开始

```bash
pnpm install
pnpm db:local          # 初始化四个应用的本地 D1（建表 + 示例数据 + 搜索索引）
pnpm dev:genshin       # 或 dev:honkaistarrail / dev:zenlesszonezero / dev:portal
```

写作台默认密码在 `apps/*/.dev.vars`（本地示例值 `dev-password`，已被 git 忽略）。

## 验证

```bash
pnpm test:invariants   # 20 项核心不变量（草稿隔离 / 发布可见 / 上锁 / 中文分词 / 实体）
bash scripts/smoke.sh  # 36 项线上冒烟（四站存活、接口、上锁、robots、sitemap、分享卡片）
pnpm preflight         # 上线前体检：还差什么，每条附修复命令
```

CI（`.github/workflows/verify.yml`）在每次 push 时跑前两项；本地 D1 不需要任何 Cloudflare 凭据。

## 部署

见 [`docs/deploy.md`](./docs/deploy.md)：体检 → 登录 Cloudflare / 建 D1 / 配 secret → `bash scripts/deploy-all.sh` → `bash scripts/smoke.sh https://paibook.lssa.fun`。

## 结构

```
apps/          四个 Nuxt 应用（三个游戏站 + 门厅）
packages/
  layer/       共享 Nuxt layer：设计 token、组件、页面（写作台/搜索/档案/错误页）、robots 与 sitemap
  db/          Drizzle schema、迁移、仓储（含 FTS 索引与分词）
  api/         Hono 应用（公开接口 + 管理接口），可整体提取成独立 Worker
  contracts/   zod 契约与类型，前后端共用
scripts/       本地库初始化、搜索索引重建、分享卡片生成、冒烟、不变量测试、上线体检、部署
docs/adr/      架构决策记录（含实测订正）
CONTEXT.md     领域词汇表（Game / Site / Entity / Guide / Draft / Link / Version / Profile）
```

## 非官方声明

本站是非官方粉丝站点，与米哈游（上海米哈游影铁科技有限公司）及 COGNOSPHERE PTE. LTD. 及其关联公司没有任何关联，也未获得其赞助或认可。本站不使用官方美术素材、游戏内字体与官方标识——所有图标、装饰与分享卡片均自行绘制（见 `docs/adr/0007`）。《原神》《崩坏：星穹铁道》《绝区零》及其素材的权利归米哈游所有。

本站完全免费：没有广告、没有打赏、没有会员。

## 许可

- 代码：Apache License 2.0，见 [`LICENSE`](./LICENSE)
- 站点内容（攻略正文、条目数据、摘要）：CC BY-NC-SA 4.0
