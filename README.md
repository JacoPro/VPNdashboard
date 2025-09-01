# VPN Apps Update Dashboard

A real-time dashboard for tracking VPN application updates across Android and iOS app stores.

## Features

- **Real-time data**: Fetches actual app store data using app store scraper APIs
- **App-agnostic**: Easily configurable to track any apps, not just VPNs
- **Cross-platform**: Tracks both Android (Google Play Store) and iOS (Apple App Store) apps
- **Interactive filtering**: Filter by platform, app, and search terms
- **Auto-refresh**: Automatically updates data every hour
- **Responsive design**: Works on desktop and mobile devices

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access the dashboard**:
   - Frontend: http://localhost:3001
   - API: http://localhost:3001/api/apps

## API Endpoints

- `GET /api/apps` - Get all VPN apps with their latest data
- `GET /api/apps/:id` - Get specific app data
- `POST /api/refresh` - Manually trigger data refresh
- `GET /api/stats` - Get dashboard statistics
- `GET /api/health` - Health check endpoint

## Configuration

To add or modify tracked apps, edit `config/apps.json`:

```json
{
  "vpnApps": [
    {
      "id": "unique-app-id",
      "name": "App Display Name",
      "playStoreId": "com.example.android",
      "appStoreId": 123456789
    }
  ]
}
```

## How It Works

1. **Backend Service**: Node.js server with Express.js API
2. **App Store Scrapers**: Uses `google-play-scraper` and `app-store-scraper` npm packages
3. **Data Collection**: Fetches real version data, release notes, and update dates
4. **Caching**: Implements intelligent caching to avoid rate limiting
5. **Frontend**: Pure HTML/CSS/JavaScript that consumes the API

## Data Sources

- **Android**: Google Play Store via `google-play-scraper`
- **iOS**: Apple App Store via `app-store-scraper`

## Features

### Real-time Updates
- Hourly automatic data refresh
- Manual refresh capability
- Loading states and error handling

### Smart Filtering
- Platform filtering (Android/iOS)
- App-specific filtering
- Full-text search across app names and update notes

### Statistics Dashboard
- Total tracked apps
- Recent updates (within 7 days)
- Platform distribution

## Extending the Dashboard

To track different app categories (not just VPNs):

1. Update `config/apps.json` with your desired apps
2. Modify the dashboard title in `index.html`
3. Customize the app icons in the JavaScript `getAppIcon()` function

## Notes

- Some app store IDs in the default configuration may return 404 errors if the apps are no longer available
- The system includes rate limiting delays to be respectful to app store APIs
- Data is cached for 1 hour to minimize API requests

## Troubleshooting

- If apps show 404 errors, verify the app store IDs in `config/apps.json`
- Check the server logs for detailed error information
- Use the `/api/health` endpoint to verify the system status