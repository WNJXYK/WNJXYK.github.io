import { setupPublicationMedia } from './publication-media';

const $ = <T extends Element>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(selector));

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));
const rootUrl = (value: string) => /^(?:https?:|mailto:|#|\/)/i.test(value) ? value : `/${value.replace(/^\.?\//, '')}`;
const isExternal = (value: string) => /^https?:\/\//i.test(value);
const enhanceAuthors = (value: string) => escapeHtml(value)
  .replace(/†/g, '<sup class="corr" title="Corresponding author">✉</sup>')
  .replace(/\*+/g, (match) => `<sup>${match}</sup>`)
  .replace(/Zhi Zhou/g, '<span class="me">Zhi Zhou</span>');
const slug = (value: string) => String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
const yearOf = (publication: Publication) => publication.venue.match(/\b(20\d{2})\b/)?.[1] || 'Other';

interface Link { label: string; url: string }
interface Publication { id: string; type: string; topic?: string; venue: string; cite?: string; img?: string; aiImg?: string; title: string; authors: string; tags?: string[]; links: Link[] }
interface PublicationData { publications: Publication[]; topics: string[] }

function externalizeLinks(root: ParentNode = document) {
  $$<HTMLAnchorElement>('a[href^="http://"],a[href^="https://"]', root).forEach((anchor) => {
    if (anchor.href.includes('resources/bibtex/')) return;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  });
}

function linkHtml(links: Link[]) {
  return links.map((link, index) => {
    const href = rootUrl(link.url);
    const attrs = isExternal(link.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${attrs}>${escapeHtml(link.label)}</a>${index < links.length - 1 ? ' <span class="sep">·</span> ' : ''}`;
  }).join('');
}

function publicationMediaHtml(publication: Publication) {
  const source = publication.img || publication.aiImg;
  if (!source) return '';
  const src = rootUrl(source);
  const video = /\.(?:mp4|webm|ogv|mov|m4v)(?:[?#]|$)/i.test(src);
  const thumbnailSrc = video && !src.includes('#') ? `${src}#t=0.1` : src;
  const title = escapeHtml(publication.title || publication.venue);
  const media = video
    ? `<video src="${escapeHtml(thumbnailSrc)}" muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>`
    : `<img src="${escapeHtml(src)}" alt="${title}" loading="lazy" decoding="async">`;
  const hint = video
    ? '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M5 2.5 13 8l-8 5.5Z" fill="currentColor" /></svg>'
    : '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6V2h4m4 0h4v4M2 10v4h4m4 0h4v-4" /></svg>';
  return `<button type="button" class="thumb pub-media" data-media-preview data-media-src="${escapeHtml(src)}" data-media-kind="${video ? 'video' : 'image'}" data-media-title="${title}" aria-label="Preview ${video ? 'video' : 'image'}: ${title}" aria-haspopup="dialog">${media}<span class="pub-media__hint" aria-hidden="true">${hint}</span></button>`;
}

function publicationRow(publication: Publication, index: number) {
  const tags = (publication.tags || []).map((tag) => `<span class="tag ${/^(CCF|CAAI)-[ABC]$/.test(tag.trim()) ? 'rank' : 'note'}">${escapeHtml(tag)}</span>`).join('');
  const media = publicationMediaHtml(publication);
  return `<div class="pub-row${media ? ' pub-row--media' : ''}" id="${escapeHtml(publication.id)}" data-pub-id="${escapeHtml(publication.id)}"><span class="idx">${index}.</span>${media ? `<div class="pub-row-media">${media}</div>` : ''}<div class="pub-body"><div class="pub-meta"><span class="venue-badge">${escapeHtml(publication.venue)}</span>${tags}</div><b class="ttl">${escapeHtml(publication.title)}</b><span class="au">${enhanceAuthors(publication.authors)}</span><span class="lk">${linkHtml(publication.links)}</span></div></div>`;
}

function setupPublicationFilters() {
  const list = $('#pub-list');
  const dataElement = $('#publication-data');
  if (!list || !dataElement?.textContent) return;
  let data: PublicationData;
  try { data = JSON.parse(dataElement.textContent); } catch { return; }
  const state = { rank: 'all', role: 'all', group: 'venue' };
  const toc = $('#pub-toc');
  const count = $('#pub-count');
  const pass = (publication: Publication) => {
    if (state.rank !== 'all' && !(publication.tags || []).includes(state.rank)) return false;
    if (state.role === 'first' && !/^\s*Zhi Zhou/.test(publication.authors) && !/Zhi Zhou\s*\*/.test(publication.authors)) return false;
    if (state.role === 'corr' && !/Zhi Zhou\s*†/.test(publication.authors)) return false;
    return true;
  };
  const sectionId = (title: string) => `pub-${state.group}-${slug(title)}`;

  function render() {
    const publications = data.publications.filter(pass);
    let groups: Array<[string, Publication[]]> = [];
    if (state.group === 'venue') {
      groups = [
        ['Conference Papers', publications.filter((paper) => paper.type === 'conference')],
        ['Journal Papers', publications.filter((paper) => paper.type === 'journal')],
        ['Workshop Papers', publications.filter((paper) => paper.type === 'workshop')],
      ];
      const other = publications.filter((paper) => !['conference', 'journal', 'workshop'].includes(paper.type));
      if (other.length) groups.push(['Other', other]);
    } else if (state.group === 'year') {
      const years: string[] = [];
      publications.forEach((paper) => { const year = yearOf(paper); if (!years.includes(year)) years.push(year); });
      groups = years.map((year) => [year, publications.filter((paper) => yearOf(paper) === year)]);
    } else {
      const topicOrder = [...data.topics];
      publications.forEach((paper) => { const topic = paper.topic || 'Other'; if (!topicOrder.includes(topic)) topicOrder.push(topic); });
      groups = topicOrder.map((topic) => [topic, publications.filter((paper) => (paper.topic || 'Other') === topic)]);
    }
    const visible = groups.filter((group) => group[1].length);
    list.innerHTML = visible.length ? visible.map(([title, papers]) => `<h3 class="pub-h3" id="${sectionId(title)}">${escapeHtml(title)}</h3>${papers.map((paper, index) => publicationRow(paper, index + 1)).join('')}`).join('') : '<p class="hint">No papers match the current filters.</p>';
    if (count) count.textContent = `${publications.length} paper${publications.length === 1 ? '' : 's'}`;
    if (toc) {
      toc.innerHTML = visible.length ? `<span class="pub-toc-label">TOC</span>${visible.map(([title]) => `<a href="#${sectionId(title)}">${escapeHtml(title)}</a>`).join('')}` : '';
      toc.hidden = !visible.length;
    }
    externalizeLinks(list);
  }

  $$('.pubfilters .seg[data-facet]').forEach((segment) => {
    const facet = segment.dataset.facet as keyof typeof state;
    $$<HTMLButtonElement>('button', segment).forEach((button) => button.addEventListener('click', () => {
      $$('button', segment).forEach((candidate) => candidate.classList.remove('active'));
      button.classList.add('active');
      state[facet] = button.dataset.val || 'all';
      render();
    }));
  });
}

let bibElement: HTMLElement | undefined;
function bibModal() {
  if (bibElement) return bibElement;
  const modal = document.createElement('div');
  modal.className = 'bib-modal'; modal.hidden = true;
  modal.innerHTML = '<div class="bib-box" role="dialog" aria-modal="true" aria-label="BibTeX"><div class="bib-head"><span>BibTeX</span><div class="bib-actions"><button class="bib-copy" type="button">Copy</button><button class="bib-close" type="button" aria-label="Close">✕</button></div></div><pre class="bib-pre"></pre></div>';
  document.body.appendChild(modal); bibElement = modal;
  const close = () => { modal.hidden = true; };
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  $('.bib-close', modal)?.addEventListener('click', close);
  $('.bib-copy', modal)?.addEventListener('click', () => {
    const button = $('.bib-copy', modal) as HTMLButtonElement;
    const text = $('.bib-pre', modal)?.textContent || '';
    const done = () => { button.textContent = 'Copied ✓'; window.setTimeout(() => { button.textContent = 'Copy'; }, 1400); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  return modal;
}
function fallbackCopy(text: string, done: () => void) {
  const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(textarea); textarea.select();
  try { document.execCommand('copy'); } catch { /* best effort */ }
  textarea.remove(); done();
}

let pdfElement: HTMLElement | undefined;
function pdfModal() {
  if (pdfElement) return pdfElement;
  const modal = document.createElement('div'); modal.className = 'pdf-modal'; modal.hidden = true;
  modal.innerHTML = '<div class="pdf-box" role="dialog" aria-modal="true" aria-label="PDF preview"><div class="pdf-head"><span class="pdf-title">PDF Preview</span><button class="pdf-close" type="button" aria-label="Close">✕</button></div><iframe class="pdf-frame" title="PDF preview"></iframe></div>';
  document.body.appendChild(modal); pdfElement = modal;
  const close = () => { modal.hidden = true; $('.pdf-frame', modal)?.removeAttribute('src'); };
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  $('.pdf-close', modal)?.addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) close(); });
  return modal;
}

function setupDocumentLinks() {
  document.addEventListener('click', (event) => {
    const anchor = (event.target as Element).closest?.('a') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (href.includes('resources/bibtex/')) {
      event.preventDefault();
      fetch(href, { cache: 'no-cache' }).then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.text(); }).then((text) => { const modal = bibModal(); $('.bib-pre', modal)!.textContent = text.trim(); modal.hidden = false; }).catch(() => window.open(href, '_blank', 'noopener'));
      return;
    }
    const clean = href.split('#')[0].split('?')[0].toLowerCase();
    if (clean.endsWith('.pdf') || clean.includes('/pdf/')) {
      event.preventDefault(); const modal = pdfModal(); ($('.pdf-title', modal) as HTMLElement).textContent = anchor.textContent?.trim() || 'PDF Preview'; ($('.pdf-frame', modal) as HTMLIFrameElement).src = href; modal.hidden = false;
    }
  });
}

function setupBackToTop() {
  const news = $('.news');
  if (news) {
    const host = news;
    if (host && !$('.news-top', host)) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'news-top'; button.setAttribute('aria-label', 'Back to top'); button.textContent = '↑'; host.appendChild(button);
      button.addEventListener('click', () => news.scrollTo({ top: 0, behavior: 'smooth' }));
      news.addEventListener('scroll', () => button.classList.toggle('show', news.scrollTop > 24));
    }
  }
  const button = document.createElement('button'); button.type = 'button'; button.className = 'page-top'; button.setAttribute('aria-label', 'Back to top'); button.textContent = '↑'; document.body.appendChild(button);
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const update = () => { const max = document.documentElement.scrollHeight - window.innerHeight; button.classList.toggle('show', max > 420 && window.scrollY > Math.max(180, max - 360)); };
  window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
}

function fitNewsBox() {
  const box = $('.news'); if (!box) return;
  const items = $$('li', box); if (!items.length || !items[0].getBoundingClientRect().height) return;
  const top = items[0].getBoundingClientRect().top; let cut = items[0].getBoundingClientRect().bottom - top;
  for (let index = 1; index < items.length; index += 1) { const bottom = items[index].getBoundingClientRect().bottom - top; if (bottom > 208) break; cut = bottom; }
  box.style.maxHeight = `${Math.ceil(cut + 10)}px`;
}

document.addEventListener('DOMContentLoaded', () => {
  setupPublicationFilters(); setupPublicationMedia(); setupDocumentLinks(); setupBackToTop(); externalizeLinks(); fitNewsBox();
  let timer: number | undefined;
  window.addEventListener('resize', () => { window.clearTimeout(timer); timer = window.setTimeout(fitNewsBox, 120); });
});
