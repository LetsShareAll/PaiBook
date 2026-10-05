# 三个站点共享一个 Nuxt base layer

三个游戏各是一个独立的 Nuxt 应用：各自的入口、主题与路由前缀（`/genshin`、`/honkaistarrail`、`/zenlesszonezero`），三者共享一个 base layer 承载设计系统 token、数据访问与通用组件。理由是"每个游戏单独做一个站"是产品要求，而三者在数据模型与内容结构上完全一致——复制三份代码会让每次内容模型变更都要改三处。

## Considered Options

- 单个应用 + 三套主题：实现最省事，但三个站无法独立演进，"各自单独一个站"的体验会被稀释。
- 三个独立仓库：共享 layer 无从复用。
