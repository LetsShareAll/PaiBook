# 全栈 Cloudflare：单 Worker 部署，前后端分离降为代码边界

前端（Nuxt SSR）、API（Hono）、数据库（D1）、图片（R2）与 DNS 全部落在 Cloudflare，Nuxt 渲染与 API 部署为**同一个 Worker**：SSR 进程内直接查 D1，零网络跳，也不存在"前端已上线而 API 未部署"的错位。API 仍写成可整体提取的模块（Hono 应用挂在 `server/api`，由 `server/domain` 独占数据访问），一旦出现第二个消费者——移动端、第三方或另一个站——可以把它整体提成独立 Worker 并用 Service Binding 连接。

「前后端分离」因此被重新表述：它是**代码边界**，不是部署边界。

## Considered Options

- 两个 Worker（web + api）：取数多一跳，需要共享 types 包与两条流水线，而此刻的收益（独立扩缩容、独立版本化）为零。
- GitHub Pages + 独立 API 域名：第三方 cookie、CORS，且没有按需渲染能力（见 ADR-0002）。
