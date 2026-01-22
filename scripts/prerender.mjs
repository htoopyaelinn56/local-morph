import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import * as fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const ssrOutDir = path.resolve(projectRoot, 'dist-ssr');

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

  fs.rmSync(ssrOutDir, { recursive: true, force: true });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
