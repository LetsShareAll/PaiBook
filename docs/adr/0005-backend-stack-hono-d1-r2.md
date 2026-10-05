# 后端栈：Hono + D1 + R2

API 用 Hono（TypeScript）实现，内容存在 Cloudflare D1（SQLite），图片存 R2，schema 与迁移由 Drizzle 管理，输入校验用 Zod。理由是它与前端同语言、类型可共享，D1 的 SQLite 全文搜索满足站内搜索，整套都落在 Cloudflare 免费额度内。

## Considered Options

- Workers + 外部 Postgres（Neon / Supabase）：SQL 能力更强、有现成面板，代价是多一个外部依赖与一跳网络。
- Workers + Hyperdrive 连自建 Postgres：控制力最强，运维最重。

## 核实结果（2026-10-05，据 Cloudflare 官方文档）

- **Workers 体积**：只有未压缩体积计入上限，没有 gzip 上限；当前单 Worker 未压缩上限 64 MiB。Nuxt SSR + Hono 有充足余量，ADR-0003 的"单 Worker"结论站得住。
- **D1 检索**：官方支持 FTS5（含 `fts5vocab`）。中文需要 FTS5 的 `trigram` 分词器（默认 `unicode61` 不切分中文），实现时验证；退路是 `LIKE` 前缀 + 索引，或客户端搜索。
- **R2**：免费额度 10 GB-month 存储，不收出口流量费——攻略配图够用很久。

## Consequences

- ⚠️ 自 2026-09-01 起，免费档 D1 **超出每日行读取 / 写入限额后直接报错**（直到次日 UTC 零点重置），不再只是限速。免费档为 500 万行读取/天、5 GB 存储/账号、单库 500 MB。这正是 ADR-0002 的边缘缓存不可省的原因：它把读放大挡在 D1 之前。
