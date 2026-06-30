import type { NextApiRequest, NextApiResponse } from 'next';
import * as svg from '@/lib/svg';
import * as lfm from '@/lib/lastfm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const theme = svg.getTheme(req.query.theme);
  try {
    const username = lfm.parseUsername(req.query.username);
    if (!username) return svg.sendError(res, 'username query param is required', theme);
    const period = lfm.parsePeriod(req.query.period);

    const [info, tracks] = await Promise.all([
      lfm.getUserInfo(username),
      lfm.getTopTracks(username, period),
    ]);
    const avatar = await lfm.fetchAvatar(lfm.pickImage(info.image));

    const rows = tracks
      .map((t, i) => {
        const label = svg.truncate(`${t.name} - ${t.artist?.name ?? 'Unknown Artist'}`, 52);
        return `
        <text x="20" y="${100 + i * 18}" class="index">${i + 1}.</text>
        <text x="50" y="${100 + i * 18}" class="item">${svg.escapeXML(label)}</text>`;
      })
      .join('');

    const inner = `
      ${svg.avatarCircle(avatar, 440, 55, 40)}
      <text x="20" y="40" class="title">Top Tracks for ${svg.escapeXML(username)}</text>
      <text x="20" y="80" class="section-title">Top 5 Tracks</text>
      ${rows}`;

    return svg.sendSvg(res, svg.card(500, 200, theme, inner), 21600);
  } catch (e) {
    return svg.sendError(res, e instanceof lfm.LastfmError ? e.message : 'Error fetching data from Last.fm', theme);
  }
}
