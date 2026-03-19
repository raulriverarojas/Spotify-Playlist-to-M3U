# Spotify Playlist to M3U/M3U8 Converter

Convert Spotify playlists to M3U/M3U8 files for use with media players.

## Requirements

- **Spotify Premium account** - This app requires Spotify OAuth authentication, which is only available to Spotify Premium users.

## Setup

### 1. Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create App**
4. Fill in the details:
   - App name: `Playlist to M3U` (or your choice)
   - App description: `Convert Spotify playlists to M3U files`
5. Click **Create**

### 2. Configure Redirect URIs

1. In your app settings, find **Redirect URIs**
2. Add one of the following:
   
   **For local development with ngrok:**
   ```
   https://YOUR_NGROK_ID.ngrok-free.app/callback
   ```
   Replace `YOUR_NGROK_ID` with your actual ngrok subdomain.
   
   **For production deployment:**
   ```
   https://yourdomain.com/callback
   ```

3. Click **Save**

### 3. Get Your Credentials

1. In your app, click **Settings** (or view the app details)
2. Copy your **Client ID**
3. Click **View Client Secret** and copy it

### 4. Set Up Environment Variables

Copy `.env.example` to `.env` (or create a new `.env` file):

```bash
cp .env .env.example  # if .env.example doesn't exist
```

Edit `.env` with your values:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=https://YOUR_NGROK_ID.ngrok-free.app/callback
SESSION_SECRET=your_random_session_secret
PORT=3000
```

### 5. Set Up ngrok (Local Development)

Spotify requires HTTPS for redirect URIs. For local development:

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://xxxx.ngrok-free.app`)
4. Add this URL as a redirect URI in your Spotify Developer Dashboard
5. Update `SPOTIFY_REDIRECT_URI` in your `.env` file

### 6. Install and Run

```bash
npm install
npm start
```

Visit `http://localhost:3000` (or your ngrok URL if using ngrok).

## Usage

1. Click **Login with Spotify** and authorize the app
2. Go to the **My Playlists** tab to see your playlists
3. Select a name format for the tracks
4. Click **Download M3U** or **Download M3U8**

You can also convert playlists by link using the **Convert by Link** tab.

## Important Notes

- **Spotify Premium Required**: OAuth authentication only works with Spotify Premium accounts. Free accounts cannot authenticate with this app.
- **Client Credentials Flow Removed**: The app previously used client credentials for public playlist access. Due to Spotify API changes (February 2026), playlist contents now require user authentication.
- **Track Availability**: For non-owned playlists, you may only see metadata (name, images) but not track contents if the playlist owner hasn't made it public.

## API Changes (February 2026)

Spotify made breaking changes to their Web API:

| Old Endpoint/Field | New Endpoint/Field |
|-------------------|-------------------|
| `GET /playlists/{id}/tracks` | `GET /playlists/{id}/items` |
| `item.track` | `item.item` |
| `tracks.total` | `items.total` |

This app has been updated to use the new API structure and requires user authentication via OAuth.
