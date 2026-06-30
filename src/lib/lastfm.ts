import axios from 'axios';

const BASE = 'https://ws.audioscrobbler.com/2.0/';
const TIMEOUT = 8000; // ms — prevents the serverless function from hanging on slow Last.fm

/** Thrown for any Last.fm / network failure with a user-readable message. */
export class LastfmError extends Error {}

function apiKey(): string {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new LastfmError('Server is missing LASTFM_API_KEY');
  return key;
}

/* ------------------------------------------------------------------ */
/* Query param parsing                                                 */
/* ------------------------------------------------------------------ */

export type Period = 'overall' | '7day' | '1month' | '3month' | '6month' | '12month';
const VALID_PERIODS: Period[] = ['overall', '7day', '1month', '3month', '6month', '12month'];

export function parsePeriod(p: unknown): Period {
  const val = Array.isArray(p) ? p[0] : p;
  return VALID_PERIODS.includes(val as Period) ? (val as Period) : 'overall';
}

export function parseUsername(u: unknown): string | null {
  const name = Array.isArray(u) ? u[0] : u;
  if (!name || typeof name !== 'string' || !name.trim()) return null;
  return name.trim();
}

/* ------------------------------------------------------------------ */
/* Core request                                                        */
/* ------------------------------------------------------------------ */

async function call(method: string, params: Record<string, string>): Promise<any> {
  const url = new URL(BASE);
  url.searchParams.set('method', method);
  url.searchParams.set('api_key', apiKey());
  url.searchParams.set('format', 'json');
  // URL-encodes usernames with spaces / special chars (old code didn't)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const { data } = await axios.get(url.toString(), { timeout: TIMEOUT });
    // Last.fm returns 200 with { error, message } for bad users etc.
    if (data && data.error) throw new LastfmError(data.message || 'Last.fm API error');
    return data;
  } catch (e) {
    if (e instanceof LastfmError) throw e;
    if (axios.isAxiosError(e) && e.response?.data?.message) {
      throw new LastfmError(e.response.data.message);
    }
    throw new LastfmError('Could not reach Last.fm');
  }
}

/* ------------------------------------------------------------------ */
/* Typed responses (only the fields we use)                            */
/* ------------------------------------------------------------------ */

export interface LfmImage { '#text': string; size: string }

export interface UserInfo {
  name: string;
  playcount: string;
  artist_count: string;
  track_count?: string;
  album_count?: string;
  image: LfmImage[];
}

export interface TopArtist { name: string; playcount: string }
export interface TopTrack { name: string; playcount: string; artist: { name: string } }
export interface TopAlbum { name: string; playcount: string; artist: { name: string } }
export interface RecentTrack {
  name: string;
  artist: { '#text': string };
  '@attr'?: { nowplaying?: string };
}

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

export async function getUserInfo(user: string): Promise<UserInfo> {
  const d = await call('user.getinfo', { user });
  return d.user as UserInfo;
}

export async function getTopArtists(user: string, period: Period, limit = 5): Promise<TopArtist[]> {
  const d = await call('user.gettopartists', { user, period, limit: String(limit) });
  return (d.topartists?.artist ?? []) as TopArtist[];
}

export async function getTopTracks(user: string, period: Period, limit = 5): Promise<TopTrack[]> {
  const d = await call('user.gettoptracks', { user, period, limit: String(limit) });
  return (d.toptracks?.track ?? []) as TopTrack[];
}

export async function getTopAlbums(user: string, period: Period, limit = 5): Promise<TopAlbum[]> {
  const d = await call('user.gettopalbums', { user, period, limit: String(limit) });
  return (d.topalbums?.album ?? []) as TopAlbum[];
}

export async function getRecentTracks(user: string, limit = 5): Promise<RecentTrack[]> {
  const d = await call('user.getrecenttracks', { user, limit: String(limit + 1) });
  const tracks = (d.recenttracks?.track ?? []) as RecentTrack[];
  return tracks.slice(0, limit); // hard cap at 5
}


/* ------------------------------------------------------------------ */
/* Avatar helpers                                                      */
/* ------------------------------------------------------------------ */

/** Pick the best non-empty image URL from a Last.fm image array. */
export function pickImage(images: LfmImage[] | undefined): string | undefined {
  if (!Array.isArray(images)) return undefined;
  const large = images[2]?.['#text'];
  if (large) return large;
  for (let i = images.length - 1; i >= 0; i--) {
    if (images[i]?.['#text']) return images[i]['#text'];
  }
  return undefined;
}

/** Download an avatar and inline it as base64. Returns null on any failure. */
export async function fetchAvatar(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: TIMEOUT });
    return `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;
  } catch {
    return null; // missing avatar should never break the card
  }
}
