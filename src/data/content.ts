import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();

export interface Link {
  label: string;
  url: string;
}

export interface Publication {
  id: string;
  type: string;
  topic?: string;
  venue: string;
  cite?: string;
  img?: string;
  /** Generated infographic used only when the publication has no manual media. */
  aiImg?: string;
  title: string;
  authors: string;
  tags?: string[];
  links: Link[];
}

export interface SiteData {
  brand: { name: string; name_cn?: string; href?: string };
  profile: { name: string; name_cn?: string; role?: string; avatar: string; location?: string };
  logos: Array<{ title: string; href: string; src: string; alt: string }>;
  nav: Array<{ label: string; href: string }>;
  contacts: Array<{ icon: string; label?: string; label_html?: string; href?: string }>;
  footer: string;
}

export interface AboutData {
  lead_html: string;
  education: Array<{ date: string; html: string }>;
}

export interface NewsData { items: Array<{ date: string; text: string }> }
export interface SelectedData { groups: Array<{ topic: string; papers: string[] }> }
export interface ProjectsData {
  software: Array<{ name: string; img?: string; badge?: string; description: string; links: Link[] }>;
  research: Array<{ date: string; text: string }>;
}
export interface AcademicsData {
  service: Array<{ title: string; items: string[] }>;
  talks: Array<{ date: string; text: string }>;
  teaching: Array<{ date: string; text: string }>;
  awards: Array<{ date: string; text: string }>;
}

function readText(file: string): string {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readYaml<T>(file: string): T {
  const value = parse(readText(file)) as T;
  if (value == null || typeof value !== 'object') throw new Error(`${file} must contain a YAML object`);
  return value;
}

function required(value: unknown, field: string, file: string): void {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${file}: ${field} must be a non-empty string`);
}

function validate(): void {
  const ids = new Set<string>();
  publications.papers.forEach((paper) => {
    required(paper.id, 'papers[].id', 'content/publications.yaml');
    required(paper.venue, `${paper.id}.venue`, 'content/publications.yaml');
    required(paper.title, `${paper.id}.title`, 'content/publications.yaml');
    required(paper.authors, `${paper.id}.authors`, 'content/publications.yaml');
    if (ids.has(paper.id)) throw new Error(`content/publications.yaml: duplicate publication id ${paper.id}`);
    ids.add(paper.id);
  });
  selected.groups.forEach((group) => group.papers.forEach((id) => {
    if (!ids.has(id)) throw new Error(`content/selected.yaml: unknown publication id ${id}`);
  }));
  const localPaths = new Set<string>();
  publications.papers.forEach((paper) => paper.links.forEach((link) => {
    if (!/^https?:\/\//i.test(link.url) && !/^mailto:/i.test(link.url)) localPaths.add(link.url.split(/[?#]/, 1)[0]);
  }));
  projects.software.forEach((project) => project.links.forEach((link) => {
    if (!/^https?:\/\//i.test(link.url) && !/^mailto:/i.test(link.url)) localPaths.add(link.url.split(/[?#]/, 1)[0]);
  }));
  [...academics.awards, ...projects.research].forEach((item) => {
    const matches = item.text.matchAll(/(?:href|src)=["']([^"']+)["']/g);
    for (const match of matches) if (!/^https?:\/\//i.test(match[1])) localPaths.add(match[1].split(/[?#]/, 1)[0]);
  });
  for (const localPath of localPaths) {
    if (localPath && !fs.existsSync(path.join(root, localPath))) throw new Error(`Missing local resource referenced by content: ${localPath}`);
  }
}

export function rootUrl(value: string | undefined): string {
  if (!value) return '';
  if (/^(?:https?:|mailto:|#|\/)/i.test(value)) return value;
  return `/${value.replace(/^\.?\//, '')}`;
}

export function trustedHtml(value: string): string {
  return String(value || '').replace(/(\s(?:href|src)=["'])(?!https?:|mailto:|\/|#)([^"']+)/gi, '$1/$2');
}

export const site = readYaml<SiteData>('content/site.yaml');
export const about = readYaml<AboutData>('content/about.yaml');
export const news = readYaml<NewsData>('content/news.yaml');
export const publications = (() => {
  const data = readYaml<{ papers: Publication[] }>('content/publications.yaml');
  return {
    ...data,
    papers: data.papers.map((paper) => {
      const aiImg = `images/paper-ai/${paper.id}.png`;
      return !paper.img && fs.existsSync(path.join(root, 'public', aiImg)) ? { ...paper, aiImg } : paper;
    }),
  };
})();
export const selected = readYaml<SelectedData>('content/selected.yaml');
export const projects = readYaml<ProjectsData>('content/projects.yaml');
export const academics = readYaml<AcademicsData>('content/academics.yaml');
export const research = readText('content/research.html');
export const topics = readText('content/topics.txt').split(/\r?\n/).map((line) => line.replace(/#.*/, '').trim()).filter(Boolean);

validate();
