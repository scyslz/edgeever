---
draft: false
title: "AI Agent 一句话部署 EdgeEver 运行指南"
snippet: "把 EdgeEver Fork 仓库链接交给 AI Agent，并按核心仓库部署协议安装到 Cloudflare。"
image: {
    src: "/images/agent-deploy.jpg",
    alt: "AI Agent 部署 EdgeEver 到 Cloudflare"
}
publishDate: "2026-07-02 00:50"
category: "Deployment"
author: "EdgeEver Team"
tags: [cloudflare, deploy, ai-agent, serverless]
---

如果您习惯使用 AI 编程助手或 Agent（例如 Codex、Claude Code、Antigravity 等），可以让 Agent 按核心仓库的部署协议自动完成 EdgeEver 的 Cloudflare 部署。

这篇文章同步自 `edgeever/docs/agent-deploy-cloudflare.md` 的当前流程。推荐先 Fork 官方仓库到自己的 GitHub 账号，再把 Fork 仓库链接交给 Agent。

---

### 一键部署指令

您可以直接把下面这句话发送给 AI 助手：

```text
这个是我的 EdgeEver Fork 仓库链接：<你的 Fork 仓库 URL>。请把这个项目安装部署到 Cloudflare 上。
```

---

### Agent 应遵守的规则

- 先读取 `AGENTS.md`、`README.md`、`.env.local.example` 和 `docs/agent-deploy-cloudflare.md`。
- 不创建新分支，部署工作在 `main` 上执行。
- 优先使用 `bun run deploy:setup`、`bun run deploy:doctor` 和 `bun run deploy`。
- 不把个人 Worker 名称、D1 database ID、R2 bucket 名称、account ID、API token 或域名硬编码进源码。
- 本地和私有部署值写入 `.env.local`，该文件已被 git ignore。
- 只有 Cloudflare 授权、首次登录密码、自定义域名归属等无法安全推断的信息，才需要询问用户。

---

### 标准部署流程

1. Clone 仓库并进入目录：

   ```sh
   git clone <repo-url>
   cd edgeever
   ```

2. 安装依赖：

   ```sh
   bun install
   ```

3. 确认 Cloudflare 授权：

   ```sh
   bunx wrangler whoami
   ```

   如果失败，Agent 应先协助完成 Cloudflare 登录或要求提供合适的 API Token。

4. 准备 Cloudflare 资源和 `.env.local`：

   ```sh
   EDGE_EVER_PASSWORD='<first-login-password>' bun run deploy:setup
   ```

   `deploy:setup` 会在需要时复制 `.env.local.example`，复用或创建 D1 数据库，创建 R2 bucket，并根据首次登录密码生成 `EDGE_EVER_AUTH_PASSWORD_HASH`。

5. 检查部署输入：

   ```sh
   bun run deploy:doctor
   ```

   所有 `fail` 结果都应修复后再继续。

6. 部署：

   ```sh
   bun run deploy
   ```

   该命令会构建 Web 应用、应用远端 D1 migrations，并部署 Cloudflare Worker。部署过程中，脚本会把 `EDGE_EVER_AUTH_PASSWORD_HASH` 作为 Worker secret 上传。

7. 验证结果：

   ```sh
   curl -I https://<worker-url>/
   curl https://<worker-url>/api/openapi.json
   ```

   然后打开站点，用 `EDGE_EVER_AUTH_USERNAME` 和首次登录密码登录，再在应用内 MCP 设置创建 Token。

### 高级自定义变量与多实例部署

可以在执行 `deploy:setup` 或 `deploy` 前向 `.env.local` 写入自定义变量：

```sh
EDGE_EVER_WORKER_NAME=edgeever
EDGE_EVER_D1_DATABASE_NAME=edgeever
EDGE_EVER_R2_BUCKET_NAME=edgeever-resources
EDGE_EVER_R2_PREVIEW_BUCKET_NAME=edgeever-resources-preview
EDGE_EVER_AUTH_USERNAME=admin
EDGE_EVER_CUSTOM_DOMAIN=notes.example.com
```

多实例可以设置 `EDGE_EVER_INSTANCE=<name>`，并使用作用域变量：

```sh
EDGE_EVER_INSTANCE=PROD
EDGE_EVER_PROD_WORKER_NAME=edgeever-prod
EDGE_EVER_PROD_D1_DATABASE_ID=<特定的数据库-ID>
EDGE_EVER_PROD_R2_BUCKET_NAME=edgeever-prod-resources
EDGE_EVER_PROD_AUTH_PASSWORD_HASH=<特定的密码-HASH>
```

### Agent 何时应该停下来询问

只有以下情况应阻塞并询问用户：

- Cloudflare 授权缺失，且 Agent 无法打开或完成登录。
- 用户必须选择或提供首次登录密码。
- 自定义域名不在当前 Cloudflare 账号中。
- 资源创建因账号限制、权限、计费或命名冲突失败，且无法通过选择新名称解决。

部署完成后，Agent 应报告部署 URL、登录用户名、密码是用户提供还是生成的、在应用哪里创建 EdgeEver MCP Token，以及是否还存在自定义域名或 DNS 步骤。
