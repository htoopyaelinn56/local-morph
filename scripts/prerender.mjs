import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import * as fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const ssrOutDir = path.resolve(projectRoot, 'dist-ssr');
const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://localmorph.web.app';

async function buildClientAndServer() {
  const base = { root: projectRoot, logLevel: 'info' };
  await build(base);
  await build({
    ...base,
    build: {
      ssr: path.resolve(projectRoot, 'src/entry-ssr.tsx'),
      outDir: ssrOutDir,
      rollupOptions: { input: path.resolve(projectRoot, 'src/entry-ssr.tsx') },
    },
  });
}

function injectHtml(template, appHtml, head, initialState) {
  const withHead = template.replace('<!--app-head-->', head ?? '');
  const stateScript = `<script>window.__LOCAL_MORPH_SSR__=${JSON.stringify(initialState ?? {})};</script>`;
  return withHead.replace(/<div id="root"><\/div>/, `<div id="root">${appHtml}</div>${stateScript}`);
}

function writeSitemap(routes) {
  const normalizedBase = SITE_BASE_URL.endsWith('/') ? SITE_BASE_URL : `${SITE_BASE_URL}/`;
  const today = new Date().toISOString().split('T')[0];
  const urlEntries = routes.map((route) => {
    const pathname = route === '/' ? '' : route.replace(/^\//, '');
    const loc = new URL(pathname, normalizedBase).toString();
    const priority = route === '/' ? '1.0' : '0.8';
    return `    <url>\n      <loc>${loc}</loc>\n      <lastmod>${today}</lastmod>\n      <changefreq>weekly</changefreq>\n      <priority>${priority}</priority>\n    </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urlEntries.join('\n')}\n` +
    `</urlset>\n`;

  const sitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf-8');
}

async function run() {
  await buildClientAndServer();

  const templatePath = path.join(distDir, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf-8');
  const ssrEntryPath = path.join(ssrOutDir, 'entry-ssr.js');
  const { render, routesToPrerender } = await import(ssrEntryPath);

  const routes = routesToPrerender ?? ['/'];
  for (const url of routes) {
    const { appHtml, head = '', initialState } = await render(url);
    const html = injectHtml(template, appHtml, head, initialState);
    const routePath = url === '/' ? '' : url.replace(/^\//, '');
    const filePath = path.join(distDir, routePath, 'index.html');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html, 'utf-8');
  }

  writeSitemap(routes);

  fs.rmSync(ssrOutDir, { recursive: true, force: true });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
