# zhouz.dev

Astro-powered academic homepage, statically generated for Cloudflare Pages. Editable content remains in `content/*.yaml` and `content/research.html`; Astro reads it at build time and emits complete HTML to `dist/`. JavaScript is used only for publication filters, PDF/BibTeX dialogs, navigation, and back-to-top controls.

## English

### Quick start

```bash
npm install
npm run dev
```

Open the local URL shown by Astro (normally `http://localhost:4321`). Other useful commands:

```bash
npm run check    # Astro/TypeScript diagnostics
npm run build    # static output in dist/
npm run preview  # preview the production build
```

### Content files

- `content/site.yaml`: navbar, sidebar profile, contacts, logos, footer
- `content/about.yaml`: home-page introduction and education
- `content/research.html`: Research introduction and the three research direction cards
- `content/news.yaml`: recent news
- `content/publications.yaml`: full publication list
- `content/selected.yaml`: selected publication IDs for the home page
- `content/topics.txt`: Publications topic order
- `content/projects.yaml`: software and research projects
- `content/academics.yaml`: academic service, talks, teaching, and awards

Static files live in `public/` and are copied unchanged to the site root:

- `public/images/`: avatar, logos, favicon, and publication/project images
- `public/resources/`: PDFs, posters, slides, certificates, and BibTeX files
- `public/assets/`: the existing visual theme, Bootstrap, and fonts

Fields ending in `_html`, fields named `html` or `text`, and `content/research.html` are trusted authored HTML. Other values are escaped by Astro.

For new images referenced by content YAML, place the file under `public/images/` and write its site-root path in YAML, for example `public/images/paper-logo/MyPaper.png` with `img: images/paper-logo/MyPaper.png`. Files kept only under the repository-level `images/` directory are not copied to the deployed site automatically.

### Add a publication

AI-assisted updates follow [AGENTS.md](AGENTS.md) and the [publication AI image guide](docs/publication-ai-images.md). A new paper includes a companion AI infographic by default.

1. Add the paper to `content/publications.yaml` with a unique `id`.
2. Add its BibTeX file under `public/resources/bibtex/` (the existing source copy is under `resources/bibtex/`).
3. Add a `BibTeX` link such as `/resources/bibtex/Example26-paper.txt`.
4. Read the paper, generate and inspect its infographic using the guide, then save it as `public/images/paper-ai/<id>.png`. Record the sources and final prompt in `docs/paper-ai/<id>.md`.
5. Optionally add the ID to `content/selected.yaml`.
6. Run `npm run check && npm run build`; the build validates duplicate/missing selected IDs and local resource references. Preview the list, filters, and image lightbox on desktop and mobile.

The optional `img` field accepts a local or external image URL, or a direct video URL (`.mp4`, `.webm`, `.ogv`, `.mov`, `.m4v`, including query strings). Manual `img` takes priority; without it, the data layer discovers `public/images/paper-ai/<id>.png` as the fallback. No YAML `aiImg` entry is needed. Astro discovers existing files at build time; it does not generate images.

Publication thumbnails open in a lightbox. Videos play silently while the thumbnail is visible; the lightbox provides playback controls. Browsers with reduced motion enabled keep thumbnails paused.

### Cloudflare Pages deployment

Connect the GitHub repository in Cloudflare Pages with:

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
```

Configure `zhouz.dev` as a custom domain in the Cloudflare dashboard; the repository `CNAME` file is retained as metadata but does not configure Cloudflare by itself. `public/_headers` supplies conservative security/cache headers and `public/_redirects` maps the legacy `.html` URLs to clean routes.

The external project pages `/DeCoOp/`, `/FTTA/`, `/RPC/`, and `/TTA-Learnability/` are bundled under `public/` from their public GitHub repositories so the paths survive the Cloudflare move. See `public/project-routes.md`; refresh those copies when the upstream project pages change.

## 中文

### 本地开发

```bash
npm install
npm run dev
```

打开 Astro 输出的本地地址（通常是 `http://localhost:4321`）。常用命令：

```bash
npm run check    # Astro / TypeScript 检查
npm run build    # 生成纯静态 dist/
npm run preview  # 预览生产构建
```

### 内容与资源

主要内容仍由 `content/` 管理：

- `site.yaml`：导航、个人信息、联系方式、Logo、页脚
- `about.yaml`：简介和教育经历
- `research.html`：Research 介绍文字和三个研究方向卡片
- `news.yaml`：Recent News
- `publications.yaml`：完整论文列表
- `selected.yaml`：首页精选论文 ID
- `topics.txt`：论文按 Topic 展示时的顺序
- `projects.yaml`：软件和科研项目
- `academics.yaml`：学术服务、报告、教学、获奖

部署用静态资源位于 `public/`，并原样输出到网站根目录：

- `public/images/`：头像、Logo、favicon、论文与项目图片
- `public/resources/`：PDF、Poster、Slides、证书和 BibTeX
- `public/assets/`：现有主题、Bootstrap 和字体

以 `_html` 结尾的字段、名为 `html` 或 `text` 的字段，以及 `content/research.html` 会作为可信 HTML 输出；其他普通字段由 Astro 自动转义。

在 YAML 中新增图片时，请把文件放在 `public/images/` 下，并使用网站根路径，例如文件 `public/images/paper-logo/MyPaper.png` 对应 `img: images/paper-logo/MyPaper.png`。只放在仓库根目录 `images/` 下的文件不会自动发布。

### 新增论文与 AI 配图

新增论文时，助手默认按 [AGENTS.md](AGENTS.md) 和 [论文 AI 配图规范](docs/publication-ai-images.md) 同步生成配图：先核实论文内容，再用高信息密度、古朴线稿风格展示研究问题、技术方案和核心 Idea。图内不显示会议、期刊、发表年份或内部 ID。

- 最终图片：`public/images/paper-ai/<论文 id>.png`。
- 来源与最终提示词：`docs/paper-ai/<论文 id>.md`。
- 手动 `img`（包括视频）优先；未设置时，数据层自动发现同 ID 的 AI 图，无需填写 `aiImg`。
- Astro 构建只发现已有图片；新增 YAML 记录本身不会调用图片生成服务。
- 更新后检查桌面、手机、筛选与灯箱，运行 `npm run check` 和 `npm run build`。

### Cloudflare Pages 部署

Cloudflare Pages 项目设置：

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
```

自定义域名 `zhouz.dev` 必须在 Cloudflare 控制台配置，仓库里的 `CNAME` 仅作为项目元数据保留。`public/_headers` 配置缓存和基础安全响应头，`public/_redirects` 将旧的 `.html` 链接跳转到新路由。

`/DeCoOp/`、`/FTTA/`、`/RPC/` 和 `/TTA-Learnability/` 四个外部项目页已经从各自公开 GitHub 仓库复制到 `public/`，因此迁移到 Cloudflare 后这些路径仍可访问。上游项目页更新后，请按照 `public/project-routes.md` 同步本地副本。
