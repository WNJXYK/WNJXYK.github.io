/* =============================================================================
 * site.js — runtime renderer for a YAML-driven static homepage.
 * Content lives in content/*.yaml plus content/research.html; this file hydrates
 * the pre-rendered static pages and keeps interactive filters/modals working.
 * ========================================================================== */
(function () {
  "use strict";

  const CITE_HOST = "https://wnjxyk-paper-citation-tracker.hf.space";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const val = (v, fallback = "") => (v == null ? fallback : String(v));
  const esc = (s) => val(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const attrEsc = esc;

  /* 作者行小魔法：把 "Zhi Zhou" 自动加粗下划线，名字后的 * / † 自动变上标 */
  const enhance = (html) =>
    html.replace(/†/g, '<sup class="corr" title="Corresponding author">✉</sup>')
        .replace(/\*+/g, (m) => `<sup>${m}</sup>`)
        .replace(/Zhi Zhou/g, '<span class="me">Zhi Zhou</span>');

  /* ---- Small YAML subset parser ------------------------------------------------
   * Supports the structures used in content/*.yaml:
   * maps, lists, nested maps/lists, quoted/unquoted scalars, and inline arrays.
   * This keeps the site build-free and avoids a third-party runtime dependency.
   */
  function stripYamlComment(line) {
    let quote = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) {
        if (c === quote) {
          if (quote === "'" && line[i + 1] === "'") { i++; continue; }
          quote = null;
        } else if (quote === '"' && c === "\\") i++;
      } else if (c === "'" || c === '"') quote = c;
      else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
    }
    return line;
  }

  function splitInlineArray(s) {
    const items = [];
    let cur = "", quote = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (quote) {
        cur += c;
        if (c === quote) {
          if (quote === "'" && s[i + 1] === "'") { cur += s[++i]; continue; }
          quote = null;
        } else if (quote === '"' && c === "\\") cur += s[++i] || "";
      } else if (c === "'" || c === '"') { quote = c; cur += c; }
      else if (c === ",") { items.push(parseYamlScalar(cur.trim())); cur = ""; }
      else cur += c;
    }
    if (cur.trim()) items.push(parseYamlScalar(cur.trim()));
    return items;
  }

  function parseYamlScalar(s) {
    if (s === "") return "";
    if (s === "null" || s === "~") return null;
    if (s === "true") return true;
    if (s === "false") return false;
    if (s.startsWith("[") && s.endsWith("]")) return splitInlineArray(s.slice(1, -1));
    if (s.startsWith('"') && s.endsWith('"')) {
      try { return JSON.parse(s); } catch (e) { return s.slice(1, -1); }
    }
    if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
    return s;
  }

  function splitKeyValue(s) {
    const idx = s.indexOf(":");
    if (idx < 0) return null;
    return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
  }

  function parseYaml(text) {
    const lines = text.split(/\r?\n/).map((raw) => {
      const line = stripYamlComment(raw).replace(/\s+$/, "");
      if (!line.trim()) return null;
      return { indent: (line.match(/^ */) || [""])[0].length, text: line.trim() };
    }).filter(Boolean);

    function parseBlock(i, indent) {
      if (i >= lines.length || lines[i].indent < indent) return [null, i];
      return lines[i].text.startsWith("- ") ? parseList(i, lines[i].indent) : parseMap(i, lines[i].indent);
    }

    function parseMap(i, indent) {
      const out = {};
      while (i < lines.length && lines[i].indent === indent && !lines[i].text.startsWith("- ")) {
        const kv = splitKeyValue(lines[i].text);
        if (!kv) { i++; continue; }
        const [key, rest] = kv;
        if (rest === "") {
          if (i + 1 < lines.length && lines[i + 1].indent > indent) {
            const parsed = parseBlock(i + 1, lines[i + 1].indent);
            out[key] = parsed[0];
            i = parsed[1];
          } else { out[key] = null; i++; }
        } else { out[key] = parseYamlScalar(rest); i++; }
      }
      return [out, i];
    }

    function parseList(i, indent) {
      const out = [];
      while (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith("- ")) {
        const rest = lines[i].text.slice(2).trim();
        if (!rest) {
          const parsed = parseBlock(i + 1, indent + 2);
          out.push(parsed[0]); i = parsed[1];
        } else {
          const kv = splitKeyValue(rest);
          if (kv) {
            const [key, value] = kv;
            const item = {};
            item[key] = value === "" ? null : parseYamlScalar(value);
            i++;
            if (i < lines.length && lines[i].indent > indent) {
              const parsed = parseMap(i, lines[i].indent);
              Object.assign(item, parsed[0]);
              i = parsed[1];
            }
            out.push(item);
          } else { out.push(parseYamlScalar(rest)); i++; }
        }
      }
      return [out, i];
    }

    return lines.length ? parseBlock(0, lines[0].indent)[0] : {};
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(url + " -> " + res.status);
    return res.text();
  }

  async function fetchYaml(url) {
    return parseYaml(await fetchText(url));
  }

  /* 外链新窗口打开，站内相对链接保持本窗口；BibTeX/PDF 链接由弹窗处理 */
  function externalizeLinks(root) {
    (root.querySelectorAll ? root.querySelectorAll('a[href^="http://"],a[href^="https://"]') : []).forEach((a) => {
      if (a.dataset.ext || a.href.includes("resources/bibtex/")) return;
      a.dataset.ext = "1"; a.target = "_blank"; a.rel = "noopener noreferrer";
    });
  }

  /* 复制到剪贴板：https/localhost 用 Clipboard API，普通 http 回退到 execCommand */
  function copyText(t, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t, done));
    } else fallbackCopy(t, done);
  }

  function fallbackCopy(t, done) {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove(); done && done();
  }

  /* BibTeX 弹窗 */
  let bibEl;
  function bibModal() {
    if (bibEl) return bibEl;
    bibEl = document.createElement("div");
    bibEl.className = "bib-modal"; bibEl.hidden = true;
    bibEl.innerHTML =
      '<div class="bib-box" role="dialog" aria-modal="true" aria-label="BibTeX">' +
      '<div class="bib-head"><span>BibTeX</span><div class="bib-actions">' +
      '<button class="bib-copy" type="button">Copy</button>' +
      '<button class="bib-close" type="button" aria-label="Close">✕</button>' +
      '</div></div><pre class="bib-pre"></pre></div>';
    document.body.appendChild(bibEl);
    const close = () => { bibEl.hidden = true; };
    bibEl.addEventListener("click", (e) => { if (e.target === bibEl) close(); });
    $(".bib-close", bibEl).addEventListener("click", close);
    $(".bib-copy", bibEl).addEventListener("click", () => {
      const btn = $(".bib-copy", bibEl);
      copyText($(".bib-pre", bibEl).textContent, () => {
        btn.textContent = "Copied ✓"; setTimeout(() => { btn.textContent = "Copy"; }, 1400);
      });
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    return bibEl;
  }

  function openBib(url) {
    fetch(url, { cache: "no-cache" }).then((r) => r.text()).then((txt) => {
      const m = bibModal(); $(".bib-pre", m).textContent = txt.trim(); m.hidden = false;
    }).catch(() => window.open(url, "_blank", "noopener"));
  }

  /* PDF 预览弹窗 */
  let pdfEl;
  function pdfModal() {
    if (pdfEl) return pdfEl;
    pdfEl = document.createElement("div");
    pdfEl.className = "pdf-modal"; pdfEl.hidden = true;
    pdfEl.innerHTML =
      '<div class="pdf-box" role="dialog" aria-modal="true" aria-label="PDF preview">' +
      '<div class="pdf-head"><span class="pdf-title">PDF Preview</span>' +
      '<button class="pdf-close" type="button" aria-label="Close">✕</button></div>' +
      '<iframe class="pdf-frame" title="PDF preview"></iframe></div>';
    document.body.appendChild(pdfEl);
    const close = () => {
      pdfEl.hidden = true;
      $(".pdf-frame", pdfEl).removeAttribute("src");
    };
    pdfEl.addEventListener("click", (e) => { if (e.target === pdfEl) close(); });
    $(".pdf-close", pdfEl).addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pdfEl.hidden) close(); });
    return pdfEl;
  }

  function isPdfHref(href) {
    const clean = href.split("#")[0].split("?")[0].toLowerCase();
    return clean.endsWith(".pdf") || clean.includes("/pdf/");
  }

  function openPdf(url, label) {
    const m = pdfModal();
    $(".pdf-title", m).textContent = label || "PDF Preview";
    $(".pdf-frame", m).src = url;
    m.hidden = false;
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.includes("resources/bibtex/")) { e.preventDefault(); openBib(href); return; }
    if (href && isPdfHref(href)) {
      e.preventDefault();
      openPdf(href, (a.textContent || "PDF Preview").trim());
    }
  });

  function iconHtml(icon) {
    const icons = {
      email: '<i class="ic emoji" aria-hidden="true">📧</i>',
      scholar: '<i class="ic" aria-hidden="true">🎓</i>',
      huggingface: '<i class="ic" aria-hidden="true">🤗</i>',
      dblp: '<i class="ic emoji" aria-hidden="true">📚</i>',
      location: '<i class="ic" aria-hidden="true">⚲</i>',
      github: '<i class="ic brand-icon" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></i>',
      orcid: '<i class="ic brand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="10" fill="#A6CE39"/><text x="12" y="15.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="8.2" font-weight="700" fill="#fff">iD</text></svg></i>',
    };
    return icons[icon] || `<i class="ic" aria-hidden="true">${esc(icon)}</i>`;
  }

  async function injectLayout() {
    const data = await fetchYaml("content/site.yaml");
    const masthead = $("#masthead");
    const sidebar = $("#sidebar");
    const footer = $("#site-footer");
    const cur = location.pathname.split("/").pop() || "index.html";

    if (masthead) {
      masthead.innerHTML =
        '<nav class="navbar navbar-expand-lg masthead" data-bs-theme="dark"><div class="container">' +
        `<a class="navbar-brand" href="${attrEsc(data.brand && data.brand.href || "index.html")}">${esc(data.brand && data.brand.name)} <span class="cn">${esc(data.brand && data.brand.name_cn)}</span></a>` +
        '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu" aria-controls="navmenu" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>' +
        '<div class="collapse navbar-collapse" id="navmenu"><ul class="navbar-nav ms-auto">' +
        (data.nav || []).map((n) => `<li class="nav-item"><a class="nav-link${n.href === cur ? " active" : ""}" href="${attrEsc(n.href)}" data-match="${attrEsc(n.href)}">${esc(n.label)}</a></li>`).join("") +
        '</ul></div></div></nav>';
    }

    if (sidebar) {
      const p = data.profile || {};
      sidebar.innerHTML =
        '<div class="side-inner">' +
        `<img class="avatar" src="${attrEsc(p.avatar)}" alt="${esc(p.name)}">` +
        `<div class="s-name">${esc(p.name)}<br><span class="cn">${esc(p.name_cn)}</span></div>` +
        `<p class="s-role">${esc(p.role)}</p>` +
        '<div class="affil-logos">' +
        (data.logos || []).map((l) => `<a href="${attrEsc(l.href)}" title="${attrEsc(l.title)}"><img src="${attrEsc(l.src)}" alt="${attrEsc(l.alt)}"></a>`).join("") +
        '</div><ul class="contact">' +
        (data.contacts || []).map((c) => {
          const label = c.label_html != null ? String(c.label_html) : esc(c.label);
          const body = c.href ? `<a href="${attrEsc(c.href)}">${label}</a>` : `<span>${label}</span>`;
          return `<li>${iconHtml(c.icon)}${body}</li>`;
        }).join("") +
        '</ul></div>';
    }

    if (footer) footer.innerHTML = esc(data.footer || "");
  }

  function citeChip(pub) {
    if (!pub.cite) return "";
    const inner = `${CITE_HOST}/badge/paper/${pub.cite}?fmt=iconnum`;
    const src = `https://img.shields.io/endpoint?url=${encodeURIComponent(inner)}&style=flat&color=137b73&labelColor=eee7d4`;
    return `<img class="cites" src="${attrEsc(src)}" alt="citations" loading="lazy">`;
  }

  function linkHtml(links) {
    return (links || []).map((l) => `<a href="${attrEsc(l.url)}">${esc(l.label)}</a>`).join(' <span class="sep">·</span> ');
  }

  function metaAndBody(pub, withCite) {
    const tagsHtml = (pub.tags || []).map((t) => {
      const cls = /^(CCF|CAAI)-[ABC]$/.test(t.trim()) ? "rank" : "note";
      return `<span class="tag ${cls}">${esc(t)}</span>`;
    }).join("");
    const meta = `<div class="pub-meta"><span class="venue-badge">${esc(pub.venue)}</span>${tagsHtml}${withCite ? citeChip(pub) : ""}</div>`;
    return meta +
      `<b class="ttl">${esc(pub.title)}</b>` +
      `<span class="au">${enhance(esc(pub.authors))}</span>` +
      `<span class="lk">${linkHtml(pub.links)}</span>`;
  }

  function pubCard(pub) {
    const id = pub.id ? ` id="${attrEsc(pub.id)}"` : "";
    const thumb = pub.img
      ? `<div class="thumb"><img src="${attrEsc(pub.img)}" alt="${attrEsc(pub.title || pub.venue)}" loading="lazy"></div>`
      : `<div class="thumb thumb--text">${esc(pub.venue)}</div>`;
    return `<div class="pub-card"${id}>${thumb}<div class="pub-body">${metaAndBody(pub, true)}</div></div>`;
  }

  function pubRow(pub, n) {
    const id = pub.id ? ` id="${attrEsc(pub.id)}"` : "";
    return `<div class="pub-row"${id}><span class="idx">${n}.</span><div class="pub-body">${metaAndBody(pub, false)}</div></div>`;
  }

  function pubMap(pubs) {
    const map = {};
    (pubs || []).forEach((p) => { map[p.id] = p; });
    return map;
  }

  function buildSelected(groups, map, itemFn) {
    return (groups || []).map((g) => {
      const items = (g.papers || []).map((id) => map[id]).filter(Boolean);
      (g.papers || []).forEach((id) => { if (!map[id]) console.warn("[site] selected.yaml id missing:", id); });
      if (!items.length) return "";
      return `<h3 class="pub-h3">${esc(g.topic)}</h3>` + items.map((p, i) => itemFn(p, i + 1)).join("");
    }).join("");
  }

  const auText = (p) => p.authors || "";
  const isFirst = (p) => /^\s*Zhi Zhou/.test(auText(p)) || /Zhi Zhou\s*\*/.test(auText(p));
  const isCorr = (p) => /Zhi Zhou\s*†/.test(auText(p));
  const ranksOf = (p) => p.tags || [];
  const yearOf = (p) => {
    const m = val(p.venue).match(/\b(20\d{2})\b/);
    return m ? m[1] : "Other";
  };
  const slug = (s) => val(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

  async function loadTopicsOrder() {
    try {
      return (await fetchText("content/topics.txt"))
        .split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim()).filter(Boolean);
    } catch (e) { return []; }
  }

  function renderTimeline(items) {
    return `<ul class="tl">${(items || []).map((it) => `<li><span class="date">${esc(it.date)}</span><span>${it.text || ""}</span></li>`).join("")}</ul>`;
  }

  function renderPlain(items) {
    return `<ul class="plain">${(items || []).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`;
  }

  function renderSection(title, body) {
    return `<section><h2>${title}<span class="rule"></span></h2>${body}</section>`;
  }

  async function renderAbout() {
    const mount = $("#about-body");
    if (!mount) return;
    const data = await fetchYaml("content/about.yaml");
    mount.innerHTML =
      `<p class="lead">${data.lead_html || ""}</p>` +
      `<table class="bio">${(data.education || []).map((e) => `<tr><td>${esc(e.date)}</td><td>${e.html || ""}</td></tr>`).join("")}</table>`;
  }

  async function renderNews() {
    const mount = $("#news-list");
    if (!mount) return;
    const data = await fetchYaml("content/news.yaml");
    mount.innerHTML = (data.items || []).map((n) => `<li><span class="date">${esc(n.date)}</span><span>${n.text || ""}</span></li>`).join("");
  }

  async function renderResearch() {
    const mount = $("#research-body");
    if (!mount) return;
    try { mount.innerHTML = await fetchText("content/research.html"); }
    catch (e) { mount.remove(); console.error(e); }
  }

  async function renderHomeSelected() {
    const mount = $("#selected-list");
    if (!mount) return;
    try {
      const [pubData, selected] = await Promise.all([
        fetchYaml("content/publications.yaml"),
        fetchYaml("content/selected.yaml"),
      ]);
      mount.innerHTML = buildSelected(selected.groups, pubMap(pubData.papers), pubCard);
    } catch (e) {
      mount.innerHTML = '<p class="hint">无法加载论文列表（请通过 http 访问）。</p>';
      console.error(e);
    }
  }

  async function renderHome() {
    await Promise.all([renderAbout(), renderResearch(), renderNews(), renderHomeSelected()]);
    fitNewsBox();
    addNewsTopButton();
  }

  async function renderPublications() {
    const list = $("#pub-list");
    if (!list) return;
    const [pubData, topicsOrder] = await Promise.all([
      fetchYaml("content/publications.yaml"),
      loadTopicsOrder(),
    ]);
    const pubs = pubData.papers || [];
    const counter = $("#pub-count");
    const toc = $("#pub-toc");
    const state = { rank: "all", role: "all", group: "venue" };

    const passFilter = (p) => {
      if (state.rank !== "all" && !ranksOf(p).includes(state.rank)) return false;
      if (state.role === "first" && !isFirst(p)) return false;
      if (state.role === "corr" && !isCorr(p)) return false;
      return true;
    };
    const sectionId = (title) => `pub-${state.group}-${slug(title)}`;
    const section = (title, items) =>
      items.length ? `<h3 class="pub-h3" id="${attrEsc(sectionId(title))}">${esc(title)}</h3>` + items.map((p, i) => pubRow(p, i + 1)).join("") : "";

    function updateToc(groups) {
      if (!toc) return;
      const links = groups.filter((g) => g[1].length).map((g) =>
        `<a href="#${attrEsc(sectionId(g[0]))}">${esc(g[0])}</a>`
      ).join("");
      toc.innerHTML = links ? `<span class="pub-toc-label">TOC</span>${links}` : "";
      toc.hidden = !links;
    }

    function render() {
      const items = pubs.filter(passFilter);
      let groups = [];
      if (state.group === "venue") {
        const other = items.filter((p) => !["conference", "journal", "workshop"].includes(p.type));
        groups = [
          ["Conference Papers", items.filter((p) => p.type === "conference")],
          ["Journal Papers", items.filter((p) => p.type === "journal")],
          ["Workshop Papers", items.filter((p) => p.type === "workshop")],
        ];
        if (other.length) groups.push(["Other", other]);
      } else if (state.group === "year") {
        const years = [];
        items.forEach((p) => { const y = yearOf(p); if (!years.includes(y)) years.push(y); });
        groups = years.map((y) => [y, items.filter((p) => yearOf(p) === y)]);
      } else if (state.group === "topic") {
        const order = topicsOrder.slice();
        items.forEach((p) => { const t = p.topic || "Other"; if (!order.includes(t)) order.push(t); });
        groups = order.map((t) => [t, items.filter((p) => (p.topic || "Other") === t)]);
      }
      const html = groups.map((g) => section(g[0], g[1])).join("");
      updateToc(groups);
      list.innerHTML = html || '<p class="hint">No papers match the current filters.</p>';
      if (counter) counter.textContent = `${items.length} paper${items.length !== 1 ? "s" : ""}`;
    }

    $$(".pubfilters .seg[data-facet]").forEach((seg) => {
      const facet = seg.dataset.facet;
      $$("button", seg).forEach((b) => b.addEventListener("click", () => {
        $$("button", seg).forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        state[facet] = b.dataset.val;
        render();
      }));
    });
    render();
  }

  function projectCard(p) {
    const thumb = p.img ? `<div class="thumb"><img src="${attrEsc(p.img)}" alt="${attrEsc(p.name)}" loading="lazy"></div>` : "";
    return `<div class="pub-card">${thumb}<div class="pub-body">` +
      `<div class="proj-head"><b class="ttl proj-name">${esc(p.name)}</b>${p.badge ? ` <span class="tag">${esc(p.badge)}</span>` : ""}</div>` +
      `<span class="lk">${linkHtml(p.links)}</span>` +
      `<p class="proj-desc">${esc(p.description)}</p>` +
      '</div></div>';
  }

  async function renderProjects() {
    const mount = $("#projects-body");
    if (!mount) return;
    const data = await fetchYaml("content/projects.yaml");
    mount.innerHTML =
      renderSection("Software", (data.software || []).map(projectCard).join("")) +
      renderSection("Research Projects", renderTimeline(data.research || []));
  }

  async function renderAcademics() {
    const mount = $("#academics-body");
    if (!mount) return;
    const data = await fetchYaml("content/academics.yaml");
    const service = (data.service || []).map((g) => `<h3 class="pub-h3">${esc(g.title)}</h3>${renderPlain(g.items || [])}`).join("");
    mount.innerHTML =
      renderSection("Academic Service", service) +
      renderSection("Invited Talks", renderTimeline(data.talks || [])) +
      renderSection("Teaching", renderTimeline(data.teaching || [])) +
      renderSection("Awards &amp; Honors", renderTimeline(data.awards || []));
  }

  function fitNewsBox() {
    const box = $(".news");
    if (!box) return;
    const items = $$("li", box);
    if (!items.length || !items[0].getBoundingClientRect().height) return;
    const TARGET = 208;
    const CHROME = 10;
    const top0 = items[0].getBoundingClientRect().top;
    let cut = items[0].getBoundingClientRect().bottom - top0;
    for (let i = 1; i < items.length; i++) {
      const bottom = items[i].getBoundingClientRect().bottom - top0;
      if (bottom > TARGET) break;
      cut = bottom;
    }
    box.style.maxHeight = Math.ceil(cut + CHROME) + "px";
  }

  function addNewsTopButton() {
    const box = $(".news");
    if (!box) return;
    const host = box.closest("#news") || box.parentElement;
    if (!host || $(".news-top", host)) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "news-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.textContent = "↑";
    btn.addEventListener("click", () => box.scrollTo({ top: 0, behavior: "smooth" }));
    host.appendChild(btn);
    const toggle = () => btn.classList.toggle("show", box.scrollTop > 24);
    box.addEventListener("scroll", toggle);
    toggle();
  }

  function addPageTopButton() {
    if ($(".page-top")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "page-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.textContent = "↑";
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(btn);
    const toggle = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const nearBottom = window.scrollY > Math.max(180, maxScroll - 360);
      btn.classList.toggle("show", maxScroll > 420 && nearBottom);
    };
    window.addEventListener("scroll", toggle, { passive: true });
    window.addEventListener("resize", toggle);
    toggle();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) externalizeLinks(n); }));
    }).observe(document.body, { childList: true, subtree: true });
    externalizeLinks(document.body);

    try { await injectLayout(); } catch (e) { console.error("[site] layout failed:", e); }
    addPageTopButton();

    const page = document.body.dataset.page;
    try {
      if (page === "publications") await renderPublications();
      else if (page === "home") await renderHome();
      else if (page === "projects") await renderProjects();
      else if (page === "academics") await renderAcademics();
    } catch (e) { console.error("[site] render failed:", e); }
  });

  let newsResizeTimer;
  window.addEventListener("resize", () => {
    if (document.body.dataset.page !== "home") return;
    clearTimeout(newsResizeTimer);
    newsResizeTimer = setTimeout(fitNewsBox, 120);
  });
})();
