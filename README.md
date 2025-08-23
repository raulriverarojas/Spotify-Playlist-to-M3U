# Spotify Playlist to M3U/M3U8 Converter

This project provides a user interface to input a Spotify playlist link, fetches all songs from the playlist, and allows users to download the playlist in M3U or M3U8 format.

## Features
- Enter a Spotify playlist link
- Fetch all songs from the playlist
- Download as M3U or M3U8 file

## Setup
1. Install dependencies: `npm install`
2. Start the app: `npm start`

## Environment Variables

Create a `.env` file in the project root with the following variables (see `.env.sample` for a template):

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=your_session_secret
```

- `SPOTIFY_CLIENT_ID`: Your Spotify app's client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app's client secret
- `SPOTIFY_REDIRECT_URI`: The redirect URI set in your Spotify app (should match this value)
- `SESSION_SECRET`: Any random string for session encryption
- `PORT`: Any port you want to run applicatio on

You will need to register your app at https://developer.spotify.com/dashboard to get your Client ID and Secret.

*** This is a test project using github copiot, this may or may not be updated in future ****
