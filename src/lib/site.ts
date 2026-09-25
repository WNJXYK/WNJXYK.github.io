import type { Publication, SiteData } from '../data/content';
import { rootUrl, site } from '../data/content';

export const SITE_URL = 'https://zhouz.dev';
export const CITE_HOST = 'https://wnjxyk-paper-citation-tracker.hf.space';

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}

export function enhanceAuthors(value: string): string {
  return escapeHtml(value)
    .replace(/†/g, '<sup class="corr" title="Corresponding author">✉</sup>')
    .replace(/\*+/g, (match) => `<sup>${match}</sup>`)
    .replace(/Zhi Zhou/g, '<span class="me">Zhi Zhou</span>');
}

export function trusted(value: string | undefined): string {
  return String(value || '').replace(/(\s(?:href|src)=["'])(?!https?:|mailto:|\/|#)([^"']+)/gi, '$1/$2');
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function citationBadge(cite: string): string {
  const endpoint = `${CITE_HOST}/badge/paper/${cite}?fmt=iconnum`;
  return `https://img.shields.io/endpoint?url=${encodeURIComponent(endpoint)}&style=flat&color=137b73&labelColor=eee7d4`;
}

export function totalCitationBadge(): string {
  return `https://img.shields.io/endpoint?url=${CITE_HOST}/badge/total&style=flat&labelColor=eee7d4&color=137b73&label=citations`;
}

export function pageUrl(pathname: string): string {
  return `${SITE_URL}${pathname === '/' ? '/' : pathname.endsWith('/') ? pathname : `${pathname}/`}`;
}

export function publicationYear(pub: Publication): string {
  return pub.venue.match(/\b(20\d{2})\b/)?.[1] || 'Other';
}

export function slug(value: string): string {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

export function scholarUrl(data: SiteData = site): string {
  return data.contacts.find((contact) => contact.icon === 'scholar')?.href || 'https://scholar.google.com/citations?user=VzvP5a8AAAAJ';
}

export function absoluteUrl(url: string): string {
  return isExternal(url) ? url : `${SITE_URL}${rootUrl(url)}`;
}

export function paperSchemaAuthors(authors: string): Array<{ '@type': 'Person'; name: string }> {
  return authors.replace(/[†*]/g, '').replace(/\.$/, '').split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({ '@type': 'Person', name }));
}
