export type MigrationGuideCommand = {
  label: string;
  language: "sh" | "powershell";
  code: string;
};

export type MigrationGuideStep = {
  index: string;
  title: string;
  paragraphs?: string[];
  commands?: MigrationGuideCommand[];
  list?: string[];
};

export const EVERNOTE_MIGRATION_GUIDE = {
  title: "印象笔记迁移指引",
  subtitle: "支持 MCP 自动化批量导入，保留笔记本目录与堆叠结构",
  introTitle: "最佳实践迁移方案",
  intro: [
    "我们强烈推荐基于 EdgeEver MCP (Model Context Protocol) 命令行进行迁移。该方案经过内存与流式处理优化，能够安全应对数 GB 级别的超大笔记库，并且支持还原印象笔记的「笔记本组（堆叠）」层级结构，完整保留笔记的原始创建与修改时间。",
  ],
  steps: [
    {
      index: "1",
      title: "第一步：用 evernote-backup 导出 ENEX",
      paragraphs: [
        "由于新版印象笔记客户端限制了本地导出，我们使用开源的 `evernote-backup` 工具进行云端整库备份与导出。根据你的电脑系统选择对应的环境执行命令：",
      ],
      commands: [
        {
          label: "macOS / Linux",
          language: "sh",
          code: `# 1. 安装备份工具
pipx install evernote-backup

# 2. 初始化数据库（印象笔记用户指定 china 后端）
# 💡 最佳实践提示：如果 macOS 系统启用了代理，Python 3.14 可能会在建立 HTTPS 隧道时报错，
# 请在命令前加上环境变量清除代理，例如：
HTTP_PROXY="" HTTPS_PROXY="" http_proxy="" https_proxy="" ALL_PROXY="" all_proxy="" no_proxy="*" \\
evernote-backup init-db --backend china --user "你的用户名/邮箱" --password "你的密码"

# 3. 开始云端数据同步（如果笔记较多，这一步需要较长时间）
HTTP_PROXY="" HTTPS_PROXY="" http_proxy="" https_proxy="" ALL_PROXY="" all_proxy="" no_proxy="*" \\
evernote-backup sync

# 4. 导出为 ENEX 文件目录
HTTP_PROXY="" HTTPS_PROXY="" http_proxy="" https_proxy="" ALL_PROXY="" all_proxy="" no_proxy="*" \\
evernote-backup export ./evernote-export`,
        },
        {
          label: "Windows PowerShell",
          language: "powershell",
          code: `# 1. 安装 pipx 与 evernote-backup
py -m pip install --user pipx
py -m pipx ensurepath
# （注意：如果提示修改了 PATH，请关闭并重新打开 PowerShell 窗口）
pipx install evernote-backup

# 2. 初始化数据库
evernote-backup init-db --backend china --user "你的用户名/邮箱" --password "你的密码"

# 3. 同步数据
evernote-backup sync

# 4. 导出为 ENEX 文件目录
evernote-backup export .\\evernote-export`,
        },
      ],
      list: [
        "导出的 `evernote-export` 目录内，如果你的笔记包含「笔记本组（堆叠）」，会生成对应的子目录。本项目的 MCP 导入脚本能自动识别这些子目录并还原为 EdgeEver 的嵌套笔记本结构。",
      ],
    },
    {
      index: "2",
      title: "第二步：生成 EdgeEver MCP Token",
      list: [
        "登录你的 EdgeEver 网页端，点击左下角的「设置（Settings）」图标。",
        "在设置面板中找到「API & MCP 授权」卡片。",
        "点击「生成新 Token」，在输入框内填入 Token 用途（例如：Evernote Migration）。",
        "勾选需要的权限（默认已勾选 `write:notebooks`, `write:memos` 等全部权限）。",
        "生成后复制该 Token 字符串（格式为 `eev_...`）。注意：Token 仅在生成时展示一次，请妥善保管。",
      ],
    },
    {
      index: "3",
      title: "第三步：运行 MCP 命令行脚本导入（推荐）",
      paragraphs: [
        "在 EdgeEver 项目的根目录下，使用 Bun 运行内置的 MCP 导入脚本。该脚本会模拟 MCP 协议，通过高速流式接口将 ENEX 数据写入到 D1 数据库。",
      ],
      commands: [
        {
          label: "批量导入命令",
          language: "sh",
          code: `EDGEEVER_URL="你的 EdgeEver 部署地址(本地开发可使用 http://127.0.0.1:8787)" \\
EDGEEVER_TOKEN="你的 eev_... 格式 MCP Token" \\
bun scripts/import-evernote-enex-via-mcp.mjs --input "/路径/到/evernote-export" \\
  --exclude "不可描述,微博收藏,微信,黑的漂亮" --yes`,
        },
      ],
      list: [
        "💡 **断点续传与完全幂等**：脚本支持在笔记本和笔记两个层级进行去重。在笔记本层级，若数据库中已存在相同笔记本且数量符合，将直接跳过该文件夹；若数量不符（中途中断），脚本会通过 `search_memos` 获取该笔记本已导入的最新笔记，自动跳过完全相同的重复项，实现精准的“断点续传”而不会造成数据重复。",
        "💡 **网络容错与重试机制**：由于云端 D1 数据库在面对大量持续写入时可能会触发限流、短时网络延迟或数据库锁，脚本内置了带指数退避的自动重试机制（默认重试 5 次，每次失败后加倍等待），显著降低了因网络抖动或 500/502/503 错误引发的脚本意外终止率。",
        "💡 **单条笔记大小限制 (1MB)**：Cloudflare D1 平台对 SQL 参数大小有硬性的 1MB (`SQLITE_TOOBIG`) 限制。为了保障迁移过程不被意外中断，对于单条体积过大（例如包含超长 base64 文本、大面积日志拷贝等）的笔记，脚本会在解析时自动截断其 Markdown 内容至 400,000 字符以内，并在末尾附加截断说明 `*(Note truncated due to Cloudflare D1 1MB database limit)*`，保障数据顺利归档。",
        "💡 **内存与性能优化**：脚本已针对海量数据做流式解析优化。在解析 4GB+ 大文件时，会以「单本顺序」加载笔记树，防止导致 Node/Bun 发生 10GB+ 的 Out Of Memory 进程崩溃问题。",
        "💡 **堆叠层级还原**：脚本会自动检查 `.enex` 文件的父目录名称。如果是嵌套笔记本，将自动创建父级笔记本，并通过 `parentId` 建立层级关联，完美还原印象笔记目录结构。",
        "💡 **排除特定笔记本或标签**：你可以使用 `--exclude \"笔记本名称,笔记本组\"` 排除不想要的笔记本，或者使用 `--exclude-tag \"不导入\"` 跳过个别带有该标签的笔记。",
        "你可以添加 `--yes` 参数以开启免交互式自动导入；也可以添加 `--dry-run` 来仅仅解析并确认导入计划。",
      ],
    },
    {
      index: "4",
      title: "第四步：回到网页端手动导入（备用）",
      list: [
        "如果你只有少量单个笔记本（`.enex` 文件），也可以直接通过网页端进行导入。",
        "回到 EdgeEver「我的」页面，点击「导入印象笔记」。",
        "选择本地的 `.enex` 文件，确认解析出的笔记数量后，点击「开始导入」即可。",
      ],
    },
    {
      index: "5",
      title: "如果遇到问题与核心避坑指南",
      list: [
        "**只支持 .enex 格式**：EdgeEver 仅支持解析标准的 `.enex` XML 格式，不支持老版印象笔记的私有 `.notes` 格式。",
        "**时间戳一致性**：导入过程中会自动校验并保留原 Evernote 中的 `createdAt` 和 `updatedAt` 时间，确保迁移后笔记的时间线丝毫不乱（如果 API 生成的 memo 发现时间戳不符，脚本会自动进行验证并拦截）。",
        "**资源文件处理**：导入脚本将把图片与附件保留为资源链接占位。请在迁移后抽样检查包含复杂附件的笔记以确认排版正确。",
      ],
    },
  ] satisfies MigrationGuideStep[],
};
