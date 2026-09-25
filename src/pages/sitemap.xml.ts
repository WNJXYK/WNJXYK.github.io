import type { APIRoute } from 'astro';

const pages = [
  ['/', '1.0'],
  ['/publications/', '0.9'],
  ['/projects/', '0.7'],
  ['/academics/', '0.7'],
] as const;

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([pathname, priority]) => `  <url><loc>https://zhouz.dev${pathname}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority></url>`).join('\n')}
</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
