import { renderToString } from 'react-dom/server';
import App from './App';
import {SUPPORTED_FORMATS, normalizeFormat, type SupportedFormat} from './formats';

const ROUTE_PATTERN = /^\/(.+?)-to-(.+?)\/?$/;

const FORMAT_PAIRS = SUPPORTED_FORMATS.flatMap((from) =>
  SUPPORTED_FORMATS.filter((to) => to !== from).map((to) => `/${from}-to-${to}`),
);

function parseRoute(url: string): {
  source: SupportedFormat | null;
  target: SupportedFormat | null;
} {
  const pathname = new URL(url, 'http://localhost').pathname;
  const match = pathname.match(ROUTE_PATTERN);
  if (!match) return { source: null, target: null };
  const [, rawFrom, rawTo] = match;
  const source = normalizeFormat(rawFrom);
  const target = normalizeFormat(rawTo);
  if (!source || !target || source === target) return { source: null, target: null };
  return { source, target };
}

function buildHeadTitle(source: SupportedFormat | null, target: SupportedFormat | null): string {
  if (source && target) {
    return `Convert ${source.toUpperCase()} to ${target.toUpperCase()} | LocalMorph`;
  }
  return 'LocalMorph | Offline image converter';
}

export function render(url: string) {
  const { source, target } = parseRoute(url);
  const appHtml = renderToString(
    <App initialTargetFormat={target} initialSourceFormat={source} />,
  );

  const description = 'Convert images locally between PNG, JPG, GIF, WEBP, BMP, ICO, TIFF, TGA, and Farbfeld without uploads.';
  const head = `
    <title>${buildHeadTitle(source, target)}</title>
    <meta name="description" content="${description}">
  `;

  return {
    appHtml,
    head,
    initialState: {
      target,
      source,
    },
  };
}

export const routesToPrerender = ['/', ...FORMAT_PAIRS];
