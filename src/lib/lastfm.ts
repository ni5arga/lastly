import axios from 'axios';

const API = 'https://ws.audioscrobbler.com/2.0/';
const TIMEOUT = 8000;

export class LastfmError extends Error {}

const PERIODS = ['overall', '7day', '1month', '3month', '6month', '12month'] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(p: unknown): Period {
  const v = Array.isArray(p) ? p[0] : p;
  return PERIODS.includes(v as Period) ? (v as Period) : 'overall';
}

export function parseUsername(u: unknown): string | null {
  const name = Array.isArray(u) ? u[0] : u;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

function apiKey() {
  const k = process.env.LASTFM_API_KEY;
  if (!k) throw new LastfmError('Server is missing LASTFM_API_KEY');
  return k;
}

async function request(method: string, params: Record<string, string>) {
  const url = new URL(API);
  url.searchParams.set('method', method);
  url.searchParams.set('api_key', apiKey());
  url.searchParams.set('format', 'json');
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  try {
    const { data } = await axios.get(url.toString(), { timeout: TIMEOUT });
    if (data?.error) throw new LastfmError(data.message || 'Last.fm API error');
    return data;
  } catch (err) {
    if (err instanceof LastfmError) throw err;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new LastfmError(err.response.data.message);
    }
    throw new LastfmError('Could not reach Last.fm');
  }
}

export interface LfmImage {
  '#text': string;
  size: string;
}

export interface UserInfo {
  name: string;
  playcount: string;
  artist_count: string;
  image: LfmImage[];
}

export interface TopArtist {
  name: string;
}

export interface TopTrack {
  name: string;
  artist: { name: string };
}

export interface TopAlbum {
  name: string;
  artist: { name: string };
}

export interface RecentTrack {
  name: string;
  artist: { '#text': string };
  '@attr'?: { nowplaying?: string };
}

export async function getUserInfo(user: string): Promise<UserInfo> {
  return (await request('user.getinfo', { user })).user;
}

export async function getTopArtists(user: string, period: Period, limit = 5): Promise<TopArtist[]> {
  const data = await request('user.gettopartists', { user, period, limit: `${limit}` });
  return data.topartists?.artist ?? [];
}

export async function getTopTracks(user: string, period: Period, limit = 5): Promise<TopTrack[]> {
  const data = await request('user.gettoptracks', { user, period, limit: `${limit}` });
  return data.toptracks?.track ?? [];
}

export async function getTopAlbums(user: string, period: Period, limit = 5): Promise<TopAlbum[]> {
  const data = await request('user.gettopalbums', { user, period, limit: `${limit}` });
  return data.topalbums?.album ?? [];
}

export async function getRecentTracks(user: string, limit = 5): Promise<RecentTrack[]> {
  const data = await request('user.getrecenttracks', { user, limit: `${limit + 1}` });
  const tracks: RecentTrack[] = data.recenttracks?.track ?? [];
  return tracks.slice(0, limit);
}

export function pickImage(images?: LfmImage[]): string | undefined {
  if (!Array.isArray(images)) return undefined;
  return images[2]?.['#text'] || [...images].reverse().find((i) => i['#text'])?.['#text'];
}

export async function fetchAvatar(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: TIMEOUT });
    return `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;
  } catch {
    return null;
  }
}
