# Homepage project instructions

## 新增论文与 AI 配图

- 每次新增论文，先阅读 [论文 AI 配图规范](docs/publication-ai-images.md)。默认将配套 AI 图的生成、检查和接入一起完成；这是用户的长期偏好，无需再次询问是否需要配图。用户在当前任务中明确要求跳过时，以用户要求为准。
- 先读取论文或官方项目页，核实研究问题、技术方案和核心 Idea，再使用内置图片生成工具。不能只根据标题猜测方法，也不能把旧图里的科学内容当作事实来源。
- 沿用已接受的高信息密度科研 infographic：古朴纸色、细致线稿、克制配色，包含具体流程、中间表示、核心机制。图内不显示会议、期刊、发表年份、作者、arXiv 编号或内部文件 ID。
- 最终图片保存到 `public/images/paper-ai/<publication-id>.png`；来源、最终提示词和检查记录保存到 `docs/paper-ai/<publication-id>.md`。文件名必须匹配 `content/publications.yaml` 中的 `id`，但文件名不能成为图内标题。
- 保留用户手动设置的 `img`（含外部图片和视频）。当前页面优先显示 `img`，没有 `img` 时才由数据层自动发现同 ID 的 AI 图。不要为了显示 AI 图而覆盖手动媒体。
- 生成后亲自查看图片，并检查 Full Publications 的初始加载、筛选后渲染和灯箱。保持现有紧凑布局；Full Publications 只显示总 citation，不添加每篇论文的 citation。
- 图片生成失败或资料不足时，继续完成可以核实的论文信息更新，明确报告配图尚未完成；不要用抽象占位图或猜测内容冒充完成。

## 项目入口

- 内容：`content/publications.yaml`；首页精选：`content/selected.yaml`。
- 部署资源：`public/`。仓库根目录下的 `images/` 不会自动部署。
- 图片 fallback：`src/data/content.ts`；初始列表：`src/components/Publication.astro`；筛选后列表：`src/scripts/interactions.ts`。
- 图片与灯箱样式：`src/styles/publication-media.css`。
- 论文内容或代码更新后运行 `npm run check` 和 `npm run build`；仅更新文档时检查差异与链接即可。
