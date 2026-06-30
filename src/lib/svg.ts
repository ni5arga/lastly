import type { NextApiResponse } from 'next';

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

export interface Theme {
  /** solid color, or [from, to] for a diagonal gradient */
  bg: string | [string, string];
  title: string;
  section: string;
  item: string;
  index: string;
  subtitle: string;
  stats: string;
}

export const THEMES: Record<string, Theme> = {
  default:    { bg: ['#1a2a3a', '#3d6073'], title: '#ffffff', section: '#ffd700', item: '#f5f5f5', index: '#ff6b6b', subtitle: '#e0e0e0', stats: '#f5f5f5' },
  dark:       { bg: '#0d1117', title: '#ffffff', section: '#58a6ff', item: '#c9d1d9', index: '#f778ba', subtitle: '#8b949e', stats: '#c9d1d9' },
  light:      { bg: '#ffffff', title: '#24292f', section: '#0969da', item: '#24292f', index: '#cf222e', subtitle: '#57606a', stats: '#1a7f37' },
  dracula:    { bg: '#282a36', title: '#f8f8f2', section: '#bd93f9', item: '#f8f8f2', index: '#ff79c6', subtitle: '#6272a4', stats: '#50fa7b' },
  gruvbox:    { bg: '#282828', title: '#fbf1c7', section: '#fabd2f', item: '#ebdbb2', index: '#fe8019', subtitle: '#a89984', stats: '#b8bb26' },
  tokyonight: { bg: '#1a1b27', title: '#70a5fd', section: '#bf91f3', item: '#a9b1d6', index: '#38bdae', subtitle: '#565f89', stats: '#9ece6a' },
  radical:    { bg: '#141321', title: '#fe428e', section: '#f8d847', item: '#a9fef7', index: '#fe428e', subtitle: '#a9fef7', stats: '#a9fef7' },
  nord:       { bg: '#2e3440', title: '#eceff4', section: '#88c0d0', item: '#e5e9f0', index: '#bf616a', subtitle: '#81a1c1', stats: '#a3be8c' },
  catppuccin: { bg: '#1e1e2e', title: '#cdd6f4', section: '#cba6f7', item: '#cdd6f4', index: '#f38ba8', subtitle: '#9399b2', stats: '#a6e3a1' },
};

export function getTheme(name: unknown): Theme {
  const key = (Array.isArray(name) ? name[0] : name);
  if (typeof key === 'string' && THEMES[key.toLowerCase()]) return THEMES[key.toLowerCase()];
  return THEMES.default;
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

export function escapeXML(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Truncate long names so they don't overflow the card width. */
export function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 1).trimEnd() + '…';
}

export function formatNumber(n: string | number): string {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString('en-US') : String(n);
}

/* ------------------------------------------------------------------ */
/* SVG building blocks                                                 */
/* ------------------------------------------------------------------ */

export function svgDefs(theme: Theme): string {
  if (!Array.isArray(theme.bg)) return '';
  return `<defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg[0]}"/>
      <stop offset="100%" stop-color="${theme.bg[1]}"/>
    </linearGradient>
  </defs>`;
}

export function bgFill(theme: Theme): string {
  return Array.isArray(theme.bg) ? 'url(#grad)' : theme.bg;
}

export function svgStyle(theme: Theme): string {
  const f = `'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif`;
  return `<style>
    .title { font: bold 22px ${f}; fill: ${theme.title}; }
    .section-title { font: bold 18px ${f}; fill: ${theme.section}; }
    .item { font: 14px ${f}; fill: ${theme.item}; }
    .index { font: bold 14px ${f}; fill: ${theme.index}; }
    .subtitle { font: italic 12px ${f}; fill: ${theme.subtitle}; }
    .stats { font: bold 12px ${f}; fill: ${theme.stats}; }
  </style>`;
}

/** Circular avatar. Returns '' when there is no avatar so the card still renders. */
export function avatarCircle(base64: string | null, cx: number, cy: number, r: number): string {
  if (!base64) return '';
  const id = `clip-${cx}-${cy}`;
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>
    <image href="${base64}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`;
}

/** Wrap inner SVG content with the shared frame (background + defs + styles). */
export function card(width: number, height: number, theme: Theme, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img">
  ${svgDefs(theme)}
  ${svgStyle(theme)}
  <rect width="${width}" height="${height}" rx="10" fill="${bgFill(theme)}"/>
  ${inner}
</svg>`;
}

export function errorCard(message: string, theme: Theme): string {
  const w = 500, h = 120;
  const inner = `<text x="24" y="48" class="title">⚠ Lastly</text>
    <text x="24" y="82" class="item">${escapeXML(message)}</text>`;
  return card(w, h, theme, inner);
}

/* ------------------------------------------------------------------ */
/* Response senders (with CDN caching)                                 */
/* ------------------------------------------------------------------ */

/**
 * @param maxAge seconds the CDN may serve this card before revalidating.
 *  Cuts Last.fm calls + latency dramatically vs. the old no-cache version.
 */
export function sendSvg(res: NextApiResponse, svg: string, maxAge = 21600): void {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}`,
  );
  res.status(200).send(svg);
}

/** Errors return 200 + an SVG card so the README shows a readable message, not a broken image. Cached only briefly. */
export function sendError(res: NextApiResponse, message: string, theme: Theme): void {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
  res.status(200).send(errorCard(message, theme));
}
