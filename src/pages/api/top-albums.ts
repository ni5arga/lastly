import type { NextApiRequest, NextApiResponse } from 'next';
import { getTheme, escapeXML, truncate, avatar, card, sendSvg, sendError } from '@/lib/svg';
import { parseUsername, parsePeriod, getUserInfo, getTopAlbums, fetchAvatar, pickImage, LastfmError } from '@/lib/lastfm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const theme = getTheme(req.query.theme);
  try {
    const user = parseUsername(req.query.username);
    if (!user) return sendError(res, 'username query param is required', theme);
    const period = parsePeriod(req.query.period);

    const [info, albums] = await Promise.all([getUserInfo(user), getTopAlbums(user, period)]);
    const pic = await fetchAvatar(pickImage(info.image));

    const rows = albums
      .map((a, i) => {
        const label = truncate(`${a.name} - ${a.artist?.name ?? 'Unknown Artist'}`, 52);
        return `
      <text x="20" y="${100 + i * 18}" class="index">${i + 1}.</text>
      <text x="50" y="${100 + i * 18}" class="item">${escapeXML(label)}</text>`;
      })
      .join('');

    const body = `${avatar(pic, 440, 55, 40)}
      <text x="20" y="40" class="title">Top Albums for ${escapeXML(user)}</text>
      <text x="20" y="80" class="section-title">Top 5 Albums</text>${rows}`;

    sendSvg(res, card(500, 200, theme, body));
  } catch (err) {
    sendError(res, err instanceof LastfmError ? err.message : 'Error fetching data from Last.fm', theme);
  }
}
