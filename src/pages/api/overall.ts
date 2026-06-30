import type { NextApiRequest, NextApiResponse } from 'next';
import { getTheme, escapeXML, truncate, formatNumber, avatar, card, sendSvg, sendError } from '@/lib/svg';
import {
  parseUsername,
  parsePeriod,
  getUserInfo,
  getTopArtists,
  getTopTracks,
  getTopAlbums,
  getRecentTracks,
  fetchAvatar,
  pickImage,
  LastfmError,
} from '@/lib/lastfm';

function column(items: string[], x: number, labelX: number, top: number) {
  return items
    .map(
      (label, i) => `
    <text x="${x}" y="${top + i * 25}" class="index">${i + 1}.</text>
    <text x="${labelX}" y="${top + i * 25}" class="item">${escapeXML(label)}</text>`,
    )
    .join('');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const theme = getTheme(req.query.theme);
  try {
    const user = parseUsername(req.query.username);
    if (!user) return sendError(res, 'username query param is required', theme);
    const period = parsePeriod(req.query.period);

    const [info, artists, tracks, albums, recent] = await Promise.all([
      getUserInfo(user),
      getTopArtists(user, period),
      getTopTracks(user, period),
      getTopAlbums(user, period),
      getRecentTracks(user),
    ]);
    const pic = await fetchAvatar(pickImage(info.image));

    const body = `
      <text x="20" y="40" class="title">Music Stats for ${escapeXML(user)}</text>
      <text x="20" y="60" class="subtitle">Top Artists, Tracks, and Albums (${period})</text>
      ${avatar(pic, 600, 65, 40)}
      <text x="20" y="120" class="stats">Total Scrobbles: ${formatNumber(info.playcount)}</text>
      <text x="20" y="140" class="stats">Total Artists: ${formatNumber(info.artist_count)}</text>
      <text x="20" y="180" class="section-title">Top 5 Artists</text>
      ${column(artists.map((a) => truncate(a.name, 30)), 20, 40, 210)}
      <text x="320" y="180" class="section-title">Top 5 Tracks</text>
      ${column(tracks.map((t) => truncate(`${t.name} - ${t.artist?.name ?? 'Unknown'}`, 32)), 320, 340, 210)}
      <text x="20" y="370" class="section-title">Top 5 Albums</text>
      ${column(albums.map((a) => truncate(`${a.name} - ${a.artist?.name ?? 'Unknown'}`, 30)), 20, 40, 400)}
      <text x="320" y="370" class="section-title">Recent 5 Tracks</text>
      ${column(recent.map((t) => truncate(`${t.name} - ${t.artist?.['#text'] || 'Unknown'}`, 32)), 320, 340, 400)}`;

    sendSvg(res, card(660, 550, theme, body));
  } catch (err) {
    sendError(res, err instanceof LastfmError ? err.message : 'Error fetching data from Last.fm', theme);
  }
}
