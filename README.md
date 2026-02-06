# VPN Apps Update Dashboard

Automated dashboard that tracks VPN application updates across Android and iOS app stores. Data refreshes every 6 hours.

## What it does

- Tracks version updates, release notes, ratings, and download counts for 28+ VPN apps
- Covers both Google Play Store and Apple App Store
- Filters by platform, app, and search terms
- Runs automatically with zero maintenance

## Configuration

Edit `config/apps.json` to add or remove tracked apps:

```json
{
  "vpnApps": [
    {
      "id": "app-id",
      "name": "App Name",
      "playStoreId": "com.example.android",
      "appStoreId": 123456789
    }
  ]
}
```

Both store IDs are optional -- apps can be tracked on one or both platforms.
