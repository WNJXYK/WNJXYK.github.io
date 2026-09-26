# 论文 AI 配图规范

本规范记录用户已确认的风格与使用方式。以后新增论文时，默认同步生成配套 AI 图，并完成文件保存、页面接入和检查；无需重新询问是否需要配图。用户对当前任务的明确要求优先。

这里的“同步生成”是指维护主页的助手执行生成流程。Astro 构建只读取已有图片，不会调用生成服务；仅在 YAML 新增一条记录不会自动生成图片。

## 1. 图片必须讲清楚什么

每篇论文的图至少回答三个问题：

1. **研究问题**：处理什么输入、任务或环境？现有方案遇到什么具体困难？
2. **技术方案**：输入经过哪些模块、操作或推理步骤，产生什么中间表示与输出？
3. **核心 Idea**：关键机制是什么？它为什么能解决上述困难？

用表格、表达式树、浏览器界面、地图、证明树、数据流等与论文有关的具体对象表达。箭头应有明确含义，例如数据流、搜索、更新、检索或验证。

不能只放一个抽象隐喻、大树、网络云或装饰场景。也不能通过重复文字、堆满小字来制造信息密度。

## 2. 内容依据与准确性

- 先阅读用户提供的论文全文、摘要、方法图或官方项目页；若摘要不足以说明模块顺序，继续查阅方法部分。记录实际读过的来源。
- 为每篇论文先写内容提纲：问题、输入、方法模块与顺序、输出、核心贡献。图中的科学内容必须来自这些材料。
- 不根据论文 ID 或标题自行补全算法；旧 AI 图只可作为视觉风格参考，不能用来核实论文内容。
- 区分论文类型：方法论文展示方法；benchmark 展示任务构造、数据与评测协议；理论论文展示定义、假设和结论关系；综述展示分类与联系。不能把 benchmark 或综述画成并不存在的“我们提出的预测算法”。
- 禁止编造准确率、提升幅度、运行时间、步数、数据集规模、结果排名或经验曲线。默认用定性说明；只有核实过且确有必要的数字才可使用，并在记录中注明出处。
- 示例数据或示意公式应明确标为 `Illustrative example` 或 `Schematic`，并检查其内部一致性。示例不能冒充实验结果。
- 不要把未经核实的实现细节、模块名或夸大结论填进图里。资料不够时说明缺失内容，继续完成独立的主页更新。

## 3. 信息密度与版式

用户指定的信息组织参考：[NSI infographic](https://www.lamda.nju.edu.cn/guolz/paper-logo/NSI.png)。参考其层级、流程和局部机制说明；网站配色与插画语言沿用本项目风格。

默认采用以下结构，可按论文内容调整，不必生硬套用所有区域：

| 区域 | 内容 | 重点 |
| --- | --- | --- |
| 顶部窄标题区 | 论文简称或方法名、一句研究问题或副标题 | 标题清楚，少占高度 |
| 中部主图 | 通常 4–6 个有依据的流程节点，带输入、模块、中间表示和输出 | 是画面的主体，用具体对象和箭头说明关系 |
| 机制说明条 | 通常 3–5 个小图解及简短标签 | 解释关键机制，不重复主流程 |
| 底部总结区 | 现有局限与本方法的对照，或 benchmark 评测维度、理论关系、综述分类 | 按论文类型选择，不能编造“前后性能提升” |

保留短而可读的英文标题、模块名和必要公式。空间优先用于有意义的图解。避免只有三个大框、大面积空白、长段正文或占据主视觉的山水装饰。

## 4. 视觉风格

- **基调**：古朴、内敛的科研图解，与主页的纸色背景和学术气质统一。
- **背景**：暖象牙白或浅旧纸色，纸纹轻微，不能影响文字与线条的清晰度。
- **线条**：细致墨线、轻微版画感；用线条和局部阴影表达结构。
- **颜色**：深青绿、石墨灰为主，少量赭黄、陶土红、靛蓝区分模块。颜色承担语义，避免大面积饱和色块。
- **文字**：标题可用经典衬线字体；模块与说明优先保证可读性、对比度和拼写准确。
- **形式**：直接使用 AI 生成的位图。不要再转换成难辨认的像素图标。
- **避免**：机器人吉祥物、扫描线、霓虹、科幻发光、厚重渐变、抽象网络云、大面积装饰和无关口号。

## 5. 图内文字规则

只保留论文简称或方法名、内容副标题、流程标签、必要的机制说明。

以下信息由网页展示，**不写进 AI 图**：

- 会议或期刊名称，例如 ICLR、ICML、EMNLP、NeurIPS。
- 发表年份、录用状态、CCF 等级、citation 数。
- 作者、机构、arXiv 编号、DOI。
- 仓库内部 ID、文件名、路径、生成日志、模板占位符。

例如：文件可以叫 `ICLR26-formalml.png`，但图内标题应为 **FormalML**。生成提示词的标题字段应单独填写显示名称，不要直接传入文件 ID。

## 6. 生成与迭代

1. 阅读当前可用的 `imagegen` skill，使用内置图片生成工具；每篇论文单独提供内容提纲和提示词。
2. 画布默认横向 **16:10**。使用足以支持灯箱阅读的清晰原图；当前图库多为约 1600×1000，生成服务支持时可采用相近或更高分辨率。
3. 若使用参考图，明确其作用是版式或视觉参考；保留本文的内容与禁用元素约束。
4. 生成后亲自打开图片，检查内容、标题、流程、拼写、箭头、信息密度与边缘裁切。
5. 有错误时用图片生成工具针对性修正；例如去掉会议名、纠正模块顺序、删除虚构指标。不能仅凭“生成成功”判定完成。
6. 批量任务先检查一张样稿，再继续；已有明确偏好时由助手完成检查与迭代，不必再等用户批准样稿。
7. 生成服务失败时如实说明并保留已完成工作。不要擅自改用需要额外凭据的 CLI/API 路线，也不要把凭据写入仓库。

## 7. 可复用提示词

先填写花括号中的内容，再发送给图片生成工具。`VERIFIED CONTENT` 应包含读过的论文内容提纲，不要仅粘贴标题或原始网页导航。

```text
Use case: scientific-educational / infographic-diagram.
Asset: a dense academic paper infographic for an existing research homepage,
readable as a thumbnail and in a full-resolution lightbox.

DISPLAY TITLE (exact text): {paper acronym or short descriptive title}
SUBTITLE: {one concise statement of the research problem}
PAPER TYPE: {method / benchmark / theory / survey / toolkit}

VERIFIED CONTENT:
Problem and limitation: {specific task and bottleneck}
Input: {data, observations, assumptions, constraints}
Method and connections: {verified modules, ordering, arrows, and feedback}
Intermediate representations: {concrete artifacts to show}
Output: {actual output or assessment}
Core idea: {the mechanism that distinguishes this work}
Supported comparison or synthesis: {verified comparison or conceptual summary}
Exact labels to include: {short labels and essential formulas}
Illustrative example, if needed: {clearly marked schematic, not a measured result}

LAYOUT:
Landscape 16:10. A narrow title header, a substantial central diagram with
4–6 meaningful connected stages where appropriate, a strip of 3–5 mechanism
insets, and a compact comparison or synthesis section. Adapt this structure
to the paper type: benchmarks show task/data construction and evaluation;
theory shows assumptions, definitions, and conclusions; surveys show taxonomy.
Do not invent a method or improvement to fit a pipeline template.
Use concrete mini tables, expression trees, maps, browser views, proof states,
or other objects specified above. Make each arrow meaningful. High information
density through diagrams, not long paragraphs or decorative filler.

STYLE:
Warm ivory paper, subtle paper grain, fine engraved ink outlines, muted dark
teal and graphite with small ochre, terracotta and indigo accents. Restrained,
scholarly, clear lettering. Short English labels. Preserve contrast and leave
a small safe margin around important content. No pixel conversion, robot,
scanlines, neon, glow, generic network clouds, oversized scenery or watermark.

TEXT CONSTRAINTS:
Only the supplied display title, content subtitle, and scientific labels.
No conference or journal names, publication years, authors, affiliations,
rank badges, citations, arXiv IDs, DOI, internal identifiers or file names.

FACTUALITY:
Use only the verified content above. Do not invent modules, numerical results,
percentages, scores, dataset counts, rankings, empirical plots or claims.
Do not add decorative performance charts. Label schematic examples clearly.
Keep the distinction between examples and evidence, and preserve method order.
```

## 8. 保存与主页接入

### 文件位置

```text
content/publications.yaml                # 论文 id、标题、venue、img 等
public/images/paper-ai/<id>.png          # 最终 AI 图，必须与论文 id 一致
public/images/paper-logo/<filename>     # 用户手动选择的图片
docs/paper-ai/<id>.md                    # 来源、最终提示词、验收记录
```

- 只将可用成图放进 `public/images/paper-ai/`；草稿、失败版本和提示词不要放在 `public/` 下随网站发布。
- 内置生成工具的输出需要复制到项目路径，不能仅留在工具的生成目录或临时目录。
- PNG 是当前自动发现逻辑支持的文件格式。若以后改用 WebP 等格式，需要同时更新发现逻辑和页面引用。
- 新论文默认生成配套 AI 图；如果已设置手动 `img`，AI 图可作为备用素材保存，页面仍显示手动媒体。

### 当前显示优先级

```text
content/publications.yaml 的 img
    ↓ 未设置时
public/images/paper-ai/<id>.png
    ↓ 文件不存在时
原有无图展示
```

`src/data/content.ts` 在构建时按论文 ID 发现 AI 图并补充 `aiImg`；不需要在 YAML 手工填写 `aiImg`，也不要把 AI 图填入 `img` 来绕过优先级。`img` 支持本地图片、外部图片或直接视频地址；保留用户的手动设置。

新增或替换图片后，重新构建才能让静态部署生效。开发预览若没有发现新文件，重新启动开发服务。更改已有论文 ID 时同步处理 AI 文件名及相关引用。

### 当前 UI 约定

- Full Publications：桌面缩略图 **250×158**；窄屏（≤520px）**132×84**，保留序号、图片和文字三列。该尺寸用于平衡图片可辨识度与文字区域留白，不要因新增图片自行放大。
- 点击缩略图可打开灯箱，查看原图细节。图中的主要结构需要在列表中可辨认，细节文字在灯箱中可读。
- 初始 HTML 与切换 Venue / Year / Topic、作者或等级筛选后的渲染必须一致。有图行需保留 `pub-row--media` 类，避免新增第三个子元素后仍使用旧两列布局。
- Full Publications 只显示总 citation；每篇论文不显示 citation。首页精选卡片的 citation 逻辑独立保留。
- 检查入口：`src/components/Publication.astro`、`src/components/PublicationMedia.astro`、`src/scripts/interactions.ts`、`src/scripts/publication-media.ts`、`src/styles/publication-media.css`。

## 9. 每篇论文的生成记录模板

以后生成时创建 `docs/paper-ai/<id>.md`，使用下列结构记录实际操作；不追补虚构的历史提示词或“已检查”记录。

```markdown
# {论文显示标题} — AI 配图记录

- Publication ID: {id}
- Asset: public/images/paper-ai/{id}.png
- Generated with: 内置图片生成工具
- Generated on: {日期，仅记录在本文档中，不显示于图片}
- Sources: {实际读过的论文/官方项目页 URL、章节或图号}

## 核实的内容提纲

{问题、输入、技术方案与模块顺序、输出、核心 Idea、必要的证据}

## 最终提示词

{最终实际使用的完整提示词；包括内容、风格和文字约束}

## 检查与修订

{原图检查结果、修改原因、网页预览结果、尚未解决的问题}
```

## 10. 完成前检查

- [ ] 内容能明确讲出问题、方法和核心 Idea，且与读过的论文一致。
- [ ] 图内没有会议/期刊、发表年份、内部 ID；标题与关键术语拼写正确。
- [ ] 没有虚构实验数字、曲线、方法或结论；示意内容标识清楚。
- [ ] 原图清晰，颜色克制，信息密度达到参考层级，重要内容未被裁掉。
- [ ] 文件位于正确的 `public/` 路径，来源与最终提示词已记录。
- [ ] 手动 `img` 保持优先；无 `img` 的论文正确显示对应 AI 图。
- [ ] 本地桌面和手机预览可用，筛选后仍显示图片，灯箱可以打开与关闭，文字没有被图片挤出页面。
- [ ] 更新论文数据或代码后执行 `npm run check` 和 `npm run build`，确认 `dist/images/paper-ai/<id>.png` 存在。
- [ ] 完成说明区分本地保存、Git commit、推送 GitHub 和线上部署；仅在实际核实后报告相应状态。
