# VPN Dashboard Maintenance Guide

## 📅 Data Update Schedules

The VPN Dashboard uses different update frequencies for different types of data to optimize API usage and maintain fresh information:

### Daily Updates (Automated)
**Workflow:** `.github/workflows/update-data.yml`
**Schedule:** Every day at 06:00 UTC
**Updates:**
- App versions
- Release notes
- Ratings (Android & iOS)
- Download counts
- App metadata
- Rankings (included with daily run)

**Manual Trigger:** Available via GitHub Actions "Run workflow" button

### Weekly Updates (Automated)
**Workflow:** `.github/workflows/update-rankings-weekly.yml`
**Schedule:** Every Monday at 02:00 UTC
**Updates:**
- Category rankings (Android Tools, iOS Utilities)
- Top 200 positions for both platforms

**Note:** Rankings are also included in daily updates, but this weekly workflow can be disabled if you want to reduce API calls to app stores.

### Monthly Updates (Manual)
**File:** `config/subscriptions.json`
**Updates:**
- Subscription plan pricing
- Plan names and durations
- Feature lists for each tier

**How to Update:**
1. Research current pricing from VPN provider websites
2. Edit `config/subscriptions.json` with updated information
3. Commit and push changes to GitHub
4. GitHub Pages will automatically deploy the updated pricing

## 🔧 Maintenance Tasks

### Adding a New VPN App

1. **Add to config/apps.json:**
```json
{
  "id": "unique-id",
  "name": "VPN Name",
  "playStoreId": "com.package.name",
  "appStoreId": 123456789
}
```

2. **Add subscription plans to config/subscriptions.json:**
```json
{
  "id": "unique-id",
  "name": "VPN Name",
  "plans": [
    {
      "name": "Plan Name",
      "duration": "1 year",
      "price": "$4.99/mo",
      "billedAs": "$59.88 billed annually",
      "features": ["Feature 1", "Feature 2"]
    }
  ],
  "lastUpdated": "2026-02-09"
}
```

3. **Add text icon to static-index.html** (optional):
```javascript
const textIcons = {
  'unique-id': 'VN',  // Two-letter abbreviation
  // ... other icons
};
```

4. Commit changes and push to GitHub

### Updating Subscription Pricing

**Frequency:** Monthly (or when pricing changes are announced)

1. Navigate to `config/subscriptions.json`
2. Find the VPN app by `id`
3. Update the `plans` array with current pricing:
   - Update `price` (monthly equivalent)
   - Update `billedAs` (actual billing amount)
   - Update `features` if changed
   - Update `lastUpdated` to current date
4. Commit and push changes

**Example Update:**
```json
{
  "id": "nord",
  "name": "NordVPN",
  "plans": [
    {
      "name": "Complete",
      "duration": "2 years",
      "price": "$3.09/mo",  // ← Update this
      "billedAs": "$83.43 billed every 2 years",  // ← And this
      "features": ["VPN", "Password Manager", "Data Breach Scanner", "1TB Cloud Storage"]
    }
  ],
  "lastUpdated": "2026-02-09"  // ← Update date
}
```

### Updating App Store IDs

If an app changes its store ID (rare but can happen):

1. Update `config/apps.json` with new `playStoreId` or `appStoreId`
2. The next automated run will pick up the change
3. Historical data is preserved using the internal `id` field

## 📊 Data Flow

```
config/apps.json
    ↓
scrape-data.js (Node.js script)
    ↓
data/apps-data.json (generated)
    ↓
static-index.html (template)
    ↓
index.html (GitHub Pages)
```

```
config/subscriptions.json (manual)
    ↓
Loaded by frontend JavaScript
    ↓
Rendered in Pricing section
```

## 🔍 Monitoring

### Check Scraper Status
- Go to GitHub Actions tab
- View latest workflow runs
- Check for failures or warnings

### Common Issues

**"App not found" errors:**
- App may have been removed from store
- Store ID may have changed
- Regional availability issues

**Rankings showing as "Unranked":**
- App is outside top 200 in category
- Category mismatch
- Regional ranking differences

**Subscription data not showing:**
- Check `config/subscriptions.json` exists
- Verify JSON syntax is valid
- Check browser console for fetch errors

## 🚀 Performance Optimization

### Reduce API Calls

If you want to minimize requests to app stores:

1. **Disable weekly rankings workflow:**
   - Delete `.github/workflows/update-rankings-weekly.yml`
   - Rankings will still update daily with main workflow

2. **Reduce daily update frequency:**
   - Edit `.github/workflows/update-data.yml`
   - Change cron schedule (e.g., every 2 days: `0 6 */2 * *`)

3. **Disable automatic updates:**
   - Comment out the `schedule:` section in workflow files
   - Use manual triggers only

### Current Rate Limits
- Google Play Scraper: ~1.5s delay between requests
- App Store Scraper: ~1.5s delay between requests
- Total scrape time: ~100 seconds for 28 apps
- Rankings: ~2 seconds per platform

## 📝 Best Practices

1. **Always test locally before committing:**
   ```bash
   node scrape-data.js
   ```

2. **Verify subscription pricing from official sources**
   - Don't rely on third-party pricing sites
   - Check VPN provider's official website
   - Note any regional variations

3. **Keep historical data intact**
   - Don't manually edit `data/apps-data.json`
   - The scraper preserves version history automatically

4. **Document pricing changes**
   - Use clear commit messages
   - Note significant price increases/decreases

5. **Monitor for app removals**
   - Some apps may be delisted
   - Update `config/apps.json` if permanent

## 🔐 Security Notes

- No API keys required (public data only)
- No personal data collected
- All scraping respects rate limits
- Commits are signed by GitHub Actions

## 📞 Support

For issues with:
- **Scraper failures:** Check GitHub Actions logs
- **Incorrect data:** Verify app store IDs in config
- **Display issues:** Check browser console
- **Workflow problems:** Review `.github/workflows/` files

---

**Last Updated:** 2026-02-09
**Dashboard Version:** 2.0 (with sortable rankings and subscription pricing)
