
# 🎵 Lastly

Lastly is a **Next.js** project that generates **SVG images** displaying music statistics from [Last.fm](https://www.last.fm). The project offers several API endpoints to fetch and visualize data like top artists, tracks, albums, and recent listening history for any given user.

---

## 🎯 API Endpoints

The project provides the following API endpoints:

| Endpoint              | Description                                |
| --------------------- | ------------------------------------------ |
| `/api/overall`        | Fetches and visualizes overall statistics  |
| `/api/top-artists`    | Fetches and visualizes top artists         |
| `/api/top-tracks`     | Fetches and visualizes top tracks          |
| `/api/top-albums`     | Fetches and visualizes top albums          |
| `/api/recent`         | Fetches and visualizes recent tracks       |

---

## 🚀 Embedding in README

To embed these images in your GitHub README (or other markdown content):

1. Use the following markdown syntax to display the overall statistics for a user.

```md
![Overall Statistics](https://lastly.vercel.com/api/overall?username=USERNAME&period=PERIOD)
```

Replace `USERNAME` with your Last.fm username and `PERIOD` with the desired period (see options below).

2. Alternatively, you can use HTML for more control over formatting (e.g., centering the image):

```html
<img src="https://lastly.vercel.com/api/overall?username=USERNAME&period=PERIOD" alt="Overall Statistics" align="center">
```

---

### 🛠️ Options

- **`username`**: Your [Last.fm](https://www.last.fm) username.
- **`period`**: Can be set to:
  - `overall`: All-time statistics (default)
  - `7day`: Last 7 days
  - `1month`: Last month
  - `3month`: Last 3 months
  - `6month`: Last 6 months
  - `12month`: Last year

If `period` is not specified, the default is `overall`.

---

## 📖 Self-Hosting Guide

Follow the steps below to set up and run the project on your local machine:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/ni5arga/lastly.git
   cd lastly
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**:

   Create a `.env.local` file in the root directory and add your Last.fm API key.

   ```env
   LASTFM_API_KEY=your_lastfm_api_key
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to view the project.

---

## 🌍 Deploy with Vercel

Deploy the project to Vercel using the button below. Make sure to set up your environment variable (`LASTFM_API_KEY`) during the process.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fni5arga%2FLastly&env=LASTFM_API_KEY)

---


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

