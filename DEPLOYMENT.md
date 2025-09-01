# 🚀 GitHub Pages Deployment Guide

This guide shows you how to deploy the VPN Dashboard to GitHub Pages with automatic data updates every 6 hours.

## 📋 Prerequisites

- GitHub account
- Basic knowledge of Git/GitHub

## 🎯 Quick Setup (5 minutes)

### Step 1: Create GitHub Repository

1. **Create a new repository** on GitHub:
   - Repository name: `vpn-dashboard` (or your preferred name)
   - Set to **Public** (required for free GitHub Pages)
   - Don't initialize with README (we'll push existing code)

2. **Update package.json** with your repository details:
   ```json
   {
     "homepage": "https://YOUR_USERNAME.github.io/REPO_NAME",
     "repository": {
       "type": "git",
       "url": "git+https://github.com/YOUR_USERNAME/REPO_NAME.git"
     },
     "bugs": {
       "url": "https://github.com/YOUR_USERNAME/REPO_NAME/issues"
     }
   }
   ```

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "🚀 Initial commit - VPN Dashboard"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to main branch
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Select **main** branch and **/ (root)** folder
6. Click **Save**

### Step 4: Configure GitHub Actions

1. Go to **Actions** tab in your repository
2. You should see the workflow **"Update VPN App Data"**
3. If prompted, enable Actions for this repository

### Step 5: Manual First Run (Optional)

To populate initial data immediately:

1. Go to **Actions** tab
2. Click on **Update VPN App Data** workflow
3. Click **Run workflow** button
4. Select **main** branch and click **Run workflow**

## 🎉 You're Done!

Your dashboard will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME`

## 🔧 How It Works

### Automatic Updates
- **Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Process**: GitHub Actions runs the scraper, updates data, and commits changes
- **Data Source**: Real-time from Google Play Store and Apple App Store

### File Structure
```
your-repo/
├── .github/workflows/update-data.yml  # GitHub Actions workflow
├── config/apps.json                   # VPN apps configuration
├── data/apps-data.json               # Generated data (auto-updated)
├── static-index.html                 # Static version template
├── index.html                        # GitHub Pages file (auto-generated)
├── scrape-data.js                    # Data scraping script
└── package.json                      # Dependencies
```

## 🎨 Customization

### Add/Remove Apps

Edit `config/apps.json`:

```json
{
  "vpnApps": [
    {
      "id": "unique-id",
      "name": "App Display Name",
      "playStoreId": "com.example.android",
      "appStoreId": 123456789
    }
  ]
}
```

### Change Update Frequency

Edit `.github/workflows/update-data.yml`:

```yaml
schedule:
  # Every 3 hours instead of 6
  - cron: '0 */3 * * *'
  
  # Daily at 9 AM UTC
  - cron: '0 9 * * *'
  
  # Every Monday at 8 AM UTC
  - cron: '0 8 * * 1'
```

### Customize Appearance

Modify the CSS in `static-index.html` to match your branding.

## 🔍 Finding App Store IDs

### Google Play Store
- Go to app's Play Store page
- Look in URL: `https://play.google.com/store/apps/details?id=COM.EXAMPLE.APP`
- The ID is: `com.example.app`

### Apple App Store
- Go to app's App Store page
- Look in URL: `https://apps.apple.com/us/app/app-name/id123456789`
- The ID is: `123456789`

## 🚨 Troubleshooting

### Actions Not Running
1. Check if Actions are enabled in repository Settings → Actions
2. Verify the workflow file syntax in `.github/workflows/update-data.yml`
3. Check Actions tab for error logs

### Data Not Updating
1. Check Actions logs for errors
2. Verify app store IDs are correct
3. Some apps might return 404 if not available in all regions

### GitHub Pages Not Loading
1. Ensure repository is public
2. Check Pages settings point to main branch and root folder
3. Wait a few minutes for changes to propagate

### 404 Errors for Apps
- Normal for some apps that might not be available
- Check and update app store IDs in `config/apps.json`
- Look at Actions logs for specific error messages

## 📊 Monitoring

### View Action Runs
- Go to **Actions** tab to see all workflow runs
- Click individual runs to see detailed logs and summaries

### Check Data Freshness
- The dashboard shows "Last updated" timestamp
- Data file timestamp available at: `https://YOUR_USERNAME.github.io/REPO_NAME/data/apps-data.json`

## 🔐 Security

- No API keys required (uses public app store data)
- Actions run in isolated GitHub environment
- Only commits generated data files to repository

## 💡 Pro Tips

1. **Star the repo** to easily find it later
2. **Watch releases** to get notified of updates
3. **Fork and customize** for different app categories
4. **Check Actions logs** if something seems wrong
5. **Manual triggers** available via Actions tab for immediate updates

---

**Need help?** Open an issue in the repository or check the main README.md for more details.