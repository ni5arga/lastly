# Lastly

Lastly is a Next.js project that generates dynamic SVG images showcasing your Last.fm listening statistics. These SVGs are designed to be embedded directly into GitHub READMEs, profiles, or any markdown-supported platform.

It supports multiple endpoints to visualize artists, tracks, albums, and recent activity for any Last.fm user — all rendered server-side as SVGs, with CDN caching and multiple color themes.

## API Endpoints

| Endpoint           | Description                               |
| ------------------ | ----------------------------------------- |
| `/api/overall`     | Fetches and visualizes overall statistics |
| `/api/top-artists` | Fetches and visualizes top artists        |
| `/api/top-tracks`  | Fetches and visualizes top tracks         |
| `/api/top-albums`  | Fetches and visualizes top albums         |
| `/api/recent`      | Fetches and visualizes recent tracks      |

## Embedding in README

Use markdown:

```
![Overall Statistics](https://lastly.nisarga.me/api/overall?username=USERNAME&period=overall&theme=default)
```

Or HTML for more control (e.g. centering):

```
<img src="https://lastly.nisarga.me/api/overall?username=USERNAME&theme=dracula" alt="Overall Statistics" align="center">
```

Replace `USERNAME` with your Last.fm username.

### Query Options

- **`username`** *(required)*: Your [Last.fm](https://www.last.fm) username.
- **`period`**: Time range for stats. Applies to `overall`, `top-artists`, `top-tracks`, `top-albums`.
  - `overall` (default), `7day`, `1month`, `3month`, `6month`, `12month`
- **`theme`**: Color theme. Defaults to `default`.
  - `default`, `dark`, `light`, `dracula`, `gruvbox`, `tokyonight`, `radical`, `nord`, `catppuccin`

If `period` or `theme` is omitted, sensible defaults are used. Invalid values fall back to defaults.

### Examples

```
![Top Artists](https://lastly.nisarga.me/api/top-artists?username=USERNAME&period=7day&theme=tokyonight)
![Recent](https://lastly.nisarga.me/api/recent?username=USERNAME&theme=nord)
```

## Caching

Responses are served with `Cache-Control` headers so the CDN can serve cards without re-hitting Last.fm on every render:

- `overall`, `top-*` → cached ~6 hours
- `recent` → cached ~5 minutes (activity changes often)

Errors (e.g. unknown user) return a readable SVG error card with a short cache, so your README never shows a broken image.

## Self-Hosting Guide

1. **Clone the repository**:

```
git clone https://github.com/ni5arga/lastly.git
cd lastly
```

2. **Install dependencies**:

```
npm install
```

3. **Configure environment**: Create a `.env.local` in the root and add your Last.fm API key:

```
LASTFM_API_KEY=your_lastfm_api_key
```

4. **Run the development server**:

```
npm run dev
```

Open <http://localhost:3000> with your browser to view the project.

## Deploy with Vercel

Deploy to Vercel and set the `LASTFM_API_KEY` environment variable during setup.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fni5arga%2FLastly&env=LASTFM_API_KEY)

## Project Structure

```
src/
├── lib/
│   ├── lastfm.ts   # Last.fm API client: typed fetchers, validation, timeouts, avatar handling
│   └── svg.ts      # Themes, SVG building blocks, error cards, cached response senders
└── pages/
    ├── index.tsx   # Redirects to the GitHub repo
    └── api/
        ├── overall.ts
        ├── recent.ts
        ├── top-albums.ts
        ├── top-artists.ts
        └── top-tracks.ts
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
