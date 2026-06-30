import type { NextApiRequest, NextApiResponse } from 'next';
import { getTheme, escapeXML, truncate, avatar, card, sendSvg, sendError } from '@/lib/svg';
import { parseUsername, getUserInfo, getRecentTracks, fetchAvatar, pickImage, LastfmError } from '@/lib/lastfm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const theme = getTheme(req.query.theme);
  try {
    const user = parseUsername(req.query.username);
    if (!user) return sendError(res, 'username query param is required', theme);

    const [info, recent] = await Promise.all([getUserInfo(user), getRecentTracks(user)]);
    const pic = await fetchAvatar(pickImage(info.image));

    const rows = recent
      .map((t, i) => {
        const artist = t.artist?.['#text'] || 'Unknown Artist';
        const live = t['@attr']?.nowplaying ? '  ♫' : '';
        const label = truncate(`${t.name || 'Unknown Track'} - ${artist}`, 50);
        return `
      <text x="20" y="${100 + i * 18}" class="index">${i + 1}.</text>
      <text x="50" y="${100 + i * 18}" class="item">${escapeXML(label)}${live}</text>`;
      })
      .join('');

    const body = `${avatar(pic, 440, 55, 40)}
      <text x="20" y="40" class="title">Recent Tracks for ${escapeXML(user)}</text>
      <text x="20" y="80" class="section-title">Recent 5 Tracks</text>${rows}`;

    sendSvg(res, card(500, 200, theme, body), 300);
  } catch (err) {
    sendError(res, err instanceof LastfmError ? err.message : 'Error fetching data from Last.fm', theme);
  }
}
