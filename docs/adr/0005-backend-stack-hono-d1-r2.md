# 后端栈：Hono + D1 + R2

API 用 Hono（TypeScript）实现，内容存在 Cloudflare D1（SQLite），图片存 R2，schema 与迁移由 Drizzle 管理，输入校验用 Zod。理由是它与前端同语言、类型可共享，D1 的 SQLite 全文搜索满足站内搜索，整套都落在 Cloudflare 免费额度内。

## Considered Options

- Workers + 外部 Postgres（Neon / Supabase）：SQL 能力更强、有现成面板，代价是多一个外部依赖与一跳网络。
- Workers + Hyperdrive 连自建 Postgres：控制力最强，运维最重。

## 待核实

选型所依据的 Cloudflare 现行配额（Workers 打包体积上限、D1 的 FTS5 与中文分词、R2 免费额度）正在核实；若与结论冲突，修订本 ADR。
