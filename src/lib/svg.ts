import type { NextApiResponse } from 'next';

export interface Theme {
  bg: string | [string, string];
  title: string;
  section: string;
  item: string;
  index: string;
  subtitle: string;
  stats: string;
}

export const themes: Record<string, Theme> = {
  default: { bg: ['#1a2a3a', '#3d6073'], title: '#ffffff', section: '#ffd700', item: '#f5f5f5', index: '#ff6b6b', subtitle: '#e0e0e0', stats: '#f5f5f5' },
  dark: { bg: '#0d1117', title: '#ffffff', section: '#58a6ff', item: '#c9d1d9', index: '#f778ba', subtitle: '#8b949e', stats: '#c9d1d9' },
  light: { bg: '#ffffff', title: '#24292f', section: '#0969da', item: '#24292f', index: '#cf222e', subtitle: '#57606a', stats: '#1a7f37' },
  dracula: { bg: '#282a36', title: '#f8f8f2', section: '#bd93f9', item: '#f8f8f2', index: '#ff79c6', subtitle: '#6272a4', stats: '#50fa7b' },
  gruvbox: { bg: '#282828', title: '#fbf1c7', section: '#fabd2f', item: '#ebdbb2', index: '#fe8019', subtitle: '#a89984', stats: '#b8bb26' },
  tokyonight: { bg: '#1a1b27', title: '#70a5fd', section: '#bf91f3', item: '#a9b1d6', index: '#38bdae', subtitle: '#565f89', stats: '#9ece6a' },
  radical: { bg: '#141321', title: '#fe428e', section: '#f8d847', item: '#a9fef7', index: '#fe428e', subtitle: '#a9fef7', stats: '#a9fef7' },
  nord: { bg: '#2e3440', title: '#eceff4', section: '#88c0d0', item: '#e5e9f0', index: '#bf616a', subtitle: '#81a1c1', stats: '#a3be8c' },
  catppuccin: { bg: '#1e1e2e', title: '#cdd6f4', section: '#cba6f7', item: '#cdd6f4', index: '#f38ba8', subtitle: '#9399b2', stats: '#a6e3a1' },
};

export function getTheme(name: unknown): Theme {
  const key = Array.isArray(name) ? name[0] : name;
  return (typeof key === 'string' && themes[key.toLowerCase()]) || themes.default;
}

export function escapeXML(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

export function formatNumber(n: string | number): string {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString('en-US') : `${n}`;
}

const FONT = `'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif`;

function styleBlock(t: Theme): string {
  return `<style>
    .title { font: bold 22px ${FONT}; fill: ${t.title}; }
    .section-title { font: bold 18px ${FONT}; fill: ${t.section}; }
    .item { font: 14px ${FONT}; fill: ${t.item}; }
    .index { font: bold 14px ${FONT}; fill: ${t.index}; }
    .subtitle { font: italic 12px ${FONT}; fill: ${t.subtitle}; }
    .stats { font: bold 12px ${FONT}; fill: ${t.stats}; }
  </style>`;
}

function resolveBackground(t: Theme): { defs: string; fill: string } {
  if (!Array.isArray(t.bg)) return { defs: '', fill: t.bg };
  return {
    defs: `<defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.bg[0]}"/>
        <stop offset="100%" stop-color="${t.bg[1]}"/>
      </linearGradient>
    </defs>`,
    fill: 'url(#grad)',
  };
}

export function avatar(base64: string | null, cx: number, cy: number, r: number): string {
  if (!base64) return '';
  const id = `clip_${cx}_${cy}`;
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>
    <image href="${base64}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`;
}

export function card(width: number, height: number, t: Theme, body: string): string {
  const { defs, fill } = resolveBackground(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img">
  ${defs}
  ${styleBlock(t)}
  <rect width="${width}" height="${height}" rx="10" fill="${fill}"/>
  ${body}
</svg>`;
}

export function errorCard(message: string, t: Theme): string {
  return card(500, 120, t, `<text x="24" y="48" class="title">⚠ Lastly</text>
    <text x="24" y="82" class="item">${escapeXML(message)}</text>`);
}

export function sendSvg(res: NextApiResponse, svg: string, maxAge = 21600): void {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}`);
  res.status(200).send(svg);
}

export function sendError(res: NextApiResponse, message: string, t: Theme): void {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
  res.status(200).send(errorCard(message, t));
}
