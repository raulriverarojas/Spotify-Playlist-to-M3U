// Common name format options
const NAME_FORMATS = [
  { value: 'artist-title', label: 'Artist - Title' },
  { value: 'title-artist', label: 'Title - Artist' },
  { value: 'title-album', label: 'Title - Album' },
  { value: 'artist-title-album', label: 'Artist - Title - Album' },
  { value: 'artist-title-album-year', label: 'Artist - Title - Album - Year' },
  { value: 'title-artist-album-year', label: 'Title - Artist - Album - Year' },
  { value: 'title-album-year', label: 'Title - Album - Year' },
  { value: 'artist-title-year', label: 'Artist - Title - Year' }
];
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const session = require('express-session');
const querystring = require('querystring');
const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'spotify_secret',
  resave: false,
  saveUninitialized: false
}));

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken() {
  const resp = await axios.post('https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return resp.data.access_token;
}

function extractPlaylistId(url) {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

app.get('/', async (req, res) => {
  let userPlaylists = null;
  let playlistError = null;
  if (req.session && req.session.access_token) {
    try {
      const resp = await axios.get('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: 'Bearer ' + req.session.access_token }
      });
      userPlaylists = resp.data.items;
    } catch (e) {
      playlistError = 'Failed to fetch your playlists.';
    }
  }
  res.render('index', { error: null, tracks: null, m3u: null, m3u8: null, userPlaylists, playlistError, nameFormats: NAME_FORMATS });
});
// Spotify OAuth login
app.get('/login', (req, res) => {
  const redirect_uri = process.env.REDIRECT_URI || 'http://localhost:3000/callback';
  const scope = 'playlist-read-private playlist-read-collaborative';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: redirect_uri
    });
  res.redirect(authUrl);
});

// Spotify OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const redirect_uri = process.env.REDIRECT_URI || 'http://localhost:3000/callback';
  try {
    const tokenResp = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    req.session.access_token = tokenResp.data.access_token;
    res.redirect('/?tab=playlists');
  } catch (e) {
    res.send('Login failed.');
  }
});

app.post('/convert', async (req, res) => {
  const playlistUrl = req.body.playlistUrl;
  const format = req.body.format || 'artist-title';
  const isM3u8 = req.body.m3u8 === '1';
  const playlistId = extractPlaylistId(playlistUrl);
  // Always pass userPlaylists and playlistError for EJS
  let userPlaylists = null;
  let playlistError = null;
  if (req.session && req.session.access_token) {
    try {
      const resp = await axios.get('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: 'Bearer ' + req.session.access_token }
      });
      userPlaylists = resp.data.items;
    } catch (e) {
      playlistError = 'Failed to fetch your playlists.';
    }
  }
  if (!playlistId) {
    return res.render('index', { error: 'Invalid Spotify playlist link.', tracks: null, m3u: null, m3u8: null, userPlaylists, playlistError, nameFormats: NAME_FORMATS });
  }
  try {
    const token = await getSpotifyAccessToken();
    // Fetch playlist name for filename
    let playlistName = 'playlist';
    try {
      const nameResp = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      playlistName = nameResp.data.name ? nameResp.data.name.replace(/[^a-zA-Z0-9-_ ]/g, '') : 'playlist';
    } catch {}
    let tracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    while (nextUrl) {
      const resp = await axios.get(nextUrl, {
        headers: { Authorization: 'Bearer ' + token }
      });
      tracks = tracks.concat(resp.data.items);
      nextUrl = resp.data.next;
    }
    const trackList = tracks.map(item => {
      const artist = item.track.artists.map(a => a.name).join(', ');
      const title = item.track.name;
      const album = item.track.album ? item.track.album.name : '';
      const year = item.track.album && item.track.album.release_date ? item.track.album.release_date.substring(0, 4) : '';
      switch (format) {
        case 'title-artist':
          return `${title} - ${artist}`;
        case 'title-album':
          return `${title} - ${album}`;
        case 'artist-title-album':
          return `${artist} - ${title} - ${album}`;
        case 'artist-title-album-year':
          return `${artist} - ${title} - ${album} - ${year}`;
        case 'title-artist-album-year':
          return `${title} - ${artist} - ${album} - ${year}`;
        case 'title-album-year':
          return `${title} - ${album} - ${year}`;
        case 'artist-title-year':
          return `${artist} - ${title} - ${year}`;
        case 'artist-title':
        default:
          return `${artist} - ${title}`;
      }
    });
    const m3u = '#EXTM3U\n' + trackList.map(t => `#EXTINF:-1,${t}\n`).join('');
    const m3u8 = '#EXTM3U\n' + trackList.map(t => `#EXTINF:-1,${t}\n`).join('');
    if (isM3u8) {
      res.setHeader('Content-Disposition', `attachment; filename="${playlistName}.m3u8"`);
      res.setHeader('Content-Type', 'audio/x-mpegurl');
      return res.send(m3u8);
    }
    // If request is from My Playlists tab (has a hidden field 'directDownload'), send file directly
    if (req.body.directDownload === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${playlistName}.m3u"`);
      res.setHeader('Content-Type', 'audio/x-mpegurl');
      return res.send(m3u);
    }
  res.render('index', { error: null, tracks: trackList, m3u, m3u8, userPlaylists, playlistError, nameFormats: NAME_FORMATS, playlistName });
  } catch (e) {
  res.render('index', { error: 'Failed to fetch playlist. Check credentials and playlist link.', tracks: null, m3u: null, m3u8: null, userPlaylists, playlistError, nameFormats: NAME_FORMATS });
  }
});

// Place this at the end, after all other app setup and route definitions
app.get('/playlist-tracks/:id', async (req, res) => {
  if (!(req.session && req.session.access_token)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const playlistId = req.params.id;
    const token = req.session.access_token;
    const format = req.query.format || 'artist-title';
    let tracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    while (nextUrl) {
      const resp = await axios.get(nextUrl, {
        headers: { Authorization: 'Bearer ' + token }
      });
      tracks = tracks.concat(resp.data.items);
      nextUrl = resp.data.next;
    }
    const nameResp = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const playlistName = nameResp.data.name;
    const trackList = tracks.map(item => {
      const artist = item.track.artists.map(a => a.name).join(', ');
      const title = item.track.name;
      const album = item.track.album ? item.track.album.name : '';
      switch (format) {
        case 'title-artist':
          return `${title} - ${artist}`;
        case 'title-album':
          return `${title} - ${album}`;
        case 'artist-title-album':
          return `${artist} - ${title} - ${album}`;
        case 'artist-title':
        default:
          return `${artist} - ${title}`;
      }
    });
    res.json({ name: playlistName, tracks: trackList });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
