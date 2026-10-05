# 攻略页用 SSR + 边缘缓存，而不是构建期预渲染

攻略页由 Cloudflare Worker 在请求时渲染，结果按 route rules 的 `swr` 缓存在边缘；发布内容时清缓存。理由：站点要求"直接在网站上编辑攻略并发布"，若走静态托管 + 构建期预渲染，每次发布都要触发一次重建，就会出现"发布成功但页面还是旧的"这类不一致窗口；而纯客户端渲染会让攻略页在搜索引擎与分享卡片里不可见。

## 实现要点（实测订正）

- `swr` 缓存由 **Nitro 自己的 cache storage** 承载，不是 `caches.default` 里的 URL 副本。最初按"删 URL"实现，实测 `purge` 命中 0 条、发布后首页仍是旧内容。
- 现在发布钩子清空 Nitro 的 cache storage（站点小、发布频率低，整表清空的代价可忽略），换来的是"发布即生效"不依赖缓存键名推导。
- 开发环境（`NODE_ENV !== 'production'`）不启用 `swr`：否则改完代码/内容会看到旧 HTML，容易被误判成 hydration 报错或其他 bug。
- 验证方式：`nuxt build` 后用 `wrangler dev .output/server/index.mjs --assets .output/public` 跑真实产物，预热首页 → 通过管理接口发布 → 首页必须立刻出现新内容。

## Consequences

- 每次发布都会清掉整站渲染缓存，下一次请求回源重渲染（个人站可接受）。
- 首字节取决于 Worker 冷启动与 D1 查询，缓存命中时不受影响。
