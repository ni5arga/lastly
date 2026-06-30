import type { NextApiRequest, NextApiResponse } from 'next';
import * as svg from '@/lib/svg';
import * as lfm from '@/lib/lastfm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const theme = svg.getTheme(req.query.theme);
  try {
    const username = lfm.parseUsername(req.query.username);
    if (!username) return svg.sendError(res, 'username query param is required', theme);
    const period = lfm.parsePeriod(req.query.period);

    const [info, artists, tracks, albums, recent] = await Promise.all([
      lfm.getUserInfo(username),
      lfm.getTopArtists(username, period),
      lfm.getTopTracks(username, period),
      lfm.getTopAlbums(username, period),
      lfm.getRecentTracks(username),
    ]);
    const avatar = await lfm.fetchAvatar(lfm.pickImage(info.image));

    const col = (
      items: string[],
      x: number,
      y0: number,
      labelX: number,
    ) =>
      items
        .map((label, i) => `
        <text x="${x}" y="${y0 + i * 25}" class="index">${i + 1}.</text>
        <text x="${labelX}" y="${y0 + i * 25}" class="item">${svg.escapeXML(label)}</text>`)
        .join('');

    const artistLines = col(artists.map((a) => svg.truncate(a.name, 30)), 20, 210, 40);
    const trackLines = col(
      tracks.map((t) => svg.truncate(`${t.name} - ${t.artist?.name ?? 'Unknown'}`, 32)),
      320, 210, 340,
    );
    const albumLines = col(
      albums.map((a) => svg.truncate(`${a.name} - ${a.artist?.name ?? 'Unknown'}`, 30)),
      20, 400, 40,
    );
    const recentLines = col(
      recent.map((t) => svg.truncate(`${t.name} - ${t.artist?.['#text'] || 'Unknown'}`, 32)),
      320, 400, 340,
    );

    const inner = `
      <text x="20" y="40" class="title">Music Stats for ${svg.escapeXML(username)}</text>
      <text x="20" y="60" class="subtitle">Top Artists, Tracks, and Albums (${period})</text>

      ${svg.avatarCircle(avatar, 600, 65, 40)}

      <text x="20" y="120" class="stats">Total Scrobbles: ${svg.formatNumber(info.playcount)}</text>
      <text x="20" y="140" class="stats">Total Artists: ${svg.formatNumber(info.artist_count)}</text>

      <text x="20" y="180" class="section-title">Top 5 Artists</text>
      ${artistLines}
      <text x="320" y="180" class="section-title">Top 5 Tracks</text>
      ${trackLines}
      <text x="20" y="370" class="section-title">Top 5 Albums</text>
      ${albumLines}
      <text x="320" y="370" class="section-title">Recent 5 Tracks</text>
      ${recentLines}`;

    return svg.sendSvg(res, svg.card(660, 550, theme, inner), 21600);
  } catch (e) {
    return svg.sendError(res, e instanceof lfm.LastfmError ? e.message : 'Error fetching data from Last.fm', theme);
  }
}
