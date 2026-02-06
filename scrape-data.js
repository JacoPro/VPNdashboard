#!/usr/bin/env node

// Node.js compatibility fixes for GitHub Actions
try {
  if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File extends Blob {
      constructor(chunks, name, options) {
        super(chunks, options);
        this.name = name;
        this.lastModified = Date.now();
      }
    };
  }
  if (typeof globalThis.fetch === 'undefined') {
    const fetch = require('node-fetch');
    globalThis.fetch = fetch;
  }
} catch (error) {
  console.warn('Compatibility fix warning:', error.message);
}

const gplay = require('google-play-scraper');
const store = require('app-store-scraper');
const fs = require('fs').promises;
const path = require('path');

class StaticDataGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.existingData = null;
  }

  async loadExistingData() {
    try {
      const outputPath = path.join(this.dataDir, 'apps-data.json');
      const raw = await fs.readFile(outputPath, 'utf8');
      this.existingData = JSON.parse(raw);
      console.log(`Loaded existing data with ${(this.existingData.feed || []).length} historical feed entries\n`);
    } catch (error) {
      this.existingData = null;
      console.log('No existing data found, starting fresh\n');
    }
  }

  async loadAppsConfig() {
    try {
      const configPath = path.join(__dirname, 'config/apps.json');
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load apps config:', error.message);
      process.exit(1);
    }
  }

  async getPlayStoreAppInfo(appId) {
    try {
      const app = await gplay.app({ appId });
      return {
        platform: 'android',
        version: app.version,
        lastUpdated: this.formatDate(app.updated),
        notes: app.recentChanges || 'No update notes available',
        rating: app.score,
        downloads: app.installs,
        size: app.size,
        developer: app.developer,
        url: app.url,
        icon: app.icon || null,
        price: app.price || 0,
        free: app.free !== false,
        offersIAP: app.offersIAP || false,
        iapRange: app.IAPRange || null,
        contentRating: app.contentRating || null,
        genre: app.genre || null
      };
    } catch (error) {
      console.warn(`  Play Store - ${appId}: ${error.message}`);
      return null;
    }
  }

  async getAppStoreAppInfo(appId) {
    try {
      const app = await store.app({ id: appId });
      return {
        platform: 'ios',
        version: app.version,
        lastUpdated: this.formatDate(app.updated),
        notes: app.releaseNotes || 'No update notes available',
        rating: app.score,
        downloads: 'N/A',
        size: app.size,
        developer: app.developer,
        url: app.url,
        icon: app.icon || null,
        price: app.price || 0,
        free: app.free !== false,
        offersIAP: false,
        iapRange: null,
        contentRating: app.contentRating || null,
        genre: app.primaryGenre || null
      };
    } catch (error) {
      console.warn(`  App Store - ${appId}: ${error.message}`);
      return null;
    }
  }

  formatDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }

  async getAppData(app) {
    const results = {};

    console.log(`Fetching data for ${app.name}...`);

    if (app.playStoreId) {
      const androidData = await this.getPlayStoreAppInfo(app.playStoreId);
      if (androidData) {
        results.android = androidData;
        console.log(`  Android: v${androidData.version}`);
      }
      await this.delay(1500);
    }

    if (app.appStoreId) {
      const iosData = await this.getAppStoreAppInfo(app.appStoreId);
      if (iosData) {
        results.ios = iosData;
        console.log(`  iOS: v${iosData.version}`);
      }
      await this.delay(1500);
    }

    return results;
  }

  async getRankings(trackedAppIds) {
    const rankings = { android: {}, ios: {} };

    console.log('\nFetching category rankings...');

    // Google Play - Top Free in Tools category
    try {
      const androidList = await gplay.list({
        collection: gplay.collection.TOP_FREE,
        category: gplay.category.TOOLS,
        num: 200,
        country: 'us'
      });
      androidList.forEach((app, index) => {
        const matchedId = trackedAppIds.find(t => t.playStoreId === app.appId);
        if (matchedId) {
          rankings.android[matchedId.id] = index + 1;
        }
      });
      console.log(`  Android: found ${Object.keys(rankings.android).length} ranked apps in Tools/Top Free`);
    } catch (error) {
      console.warn(`  Android rankings failed: ${error.message}`);
    }

    await this.delay(2000);

    // App Store - Top Free in Utilities category
    try {
      const iosList = await store.list({
        collection: store.collection.TOP_FREE_IOS,
        category: store.category.UTILITIES,
        num: 200,
        country: 'us'
      });
      iosList.forEach((app, index) => {
        const matchedId = trackedAppIds.find(t => t.appStoreId === app.id);
        if (matchedId) {
          rankings.ios[matchedId.id] = index + 1;
        }
      });
      console.log(`  iOS: found ${Object.keys(rankings.ios).length} ranked apps in Utilities/Top Free`);
    } catch (error) {
      console.warn(`  iOS rankings failed: ${error.message}`);
    }

    return rankings;
  }

  async getAllAppsData() {
    const config = await this.loadAppsConfig();
    const allAppsData = [];

    console.log(`Starting data collection for ${config.vpnApps.length} VPN apps...\n`);

    for (const app of config.vpnApps) {
      try {
        const platforms = await this.getAppData(app);

        const appInfo = {
          id: app.id,
          name: app.name,
          platforms: platforms
        };

        allAppsData.push(appInfo);
        console.log(`  Done: ${app.name}\n`);
      } catch (error) {
        console.error(`  Failed: ${app.name}: ${error.message}`);
        allAppsData.push({
          id: app.id,
          name: app.name,
          platforms: {}
        });
      }
    }

    return { appsData: allAppsData, config };
  }

  generateAppIcons(appsData) {
    const appIcons = {};
    appsData.forEach(app => {
      let appIcon = null;
      if (app.platforms.ios && app.platforms.ios.icon) {
        appIcon = app.platforms.ios.icon;
      } else if (app.platforms.android && app.platforms.android.icon) {
        appIcon = app.platforms.android.icon;
      }
      if (appIcon) {
        appIcons[app.id] = appIcon;
      }
    });
    return appIcons;
  }

  generateFeedData(appsData) {
    // Build a map of existing historical entries keyed by appId_platform_version
    const historyMap = new Map();
    if (this.existingData && this.existingData.feed) {
      this.existingData.feed.forEach(entry => {
        const key = `${entry.appId}_${entry.platform}_${entry.version}`;
        historyMap.set(key, entry);
      });
    }

    // Add current entries (will overwrite if same version exists, add if new)
    let newVersions = 0;
    appsData.forEach(app => {
      Object.entries(app.platforms).forEach(([platform, data]) => {
        if (data) {
          const version = data.version || 'Unknown';
          const key = `${app.id}_${platform}_${version}`;
          const isNew = !historyMap.has(key);
          if (isNew) newVersions++;

          historyMap.set(key, {
            id: `${app.id}_${platform}_${version}`,
            appId: app.id,
            appName: app.name,
            platform: platform,
            version: version,
            lastUpdated: data.lastUpdated,
            notes: data.notes || 'No update notes available',
            rating: data.rating,
            downloads: data.downloads,
            size: data.size,
            developer: data.developer,
            url: data.url,
            icon: data.icon
          });
        }
      });
    });

    console.log(`Feed: ${historyMap.size} total entries (${newVersions} new versions detected)`);

    const feedData = Array.from(historyMap.values());
    feedData.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    return feedData;
  }

  generateIAPData(appsData) {
    const iapData = [];
    appsData.forEach(app => {
      const entry = {
        id: app.id,
        name: app.name,
        android: null,
        ios: null
      };
      if (app.platforms.android) {
        entry.android = {
          free: app.platforms.android.free,
          price: app.platforms.android.price,
          offersIAP: app.platforms.android.offersIAP,
          iapRange: app.platforms.android.iapRange
        };
      }
      if (app.platforms.ios) {
        entry.ios = {
          free: app.platforms.ios.free,
          price: app.platforms.ios.price
        };
      }
      iapData.push(entry);
    });
    return iapData;
  }

  generateStats(feedData) {
    const totalApps = new Set(feedData.map(item => item.appId)).size;
    const recentUpdates = feedData.filter(item => {
      const updateDate = new Date(item.lastUpdated);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return updateDate > weekAgo;
    }).length;
    const androidApps = feedData.filter(item => item.platform === 'android').length;
    const iosApps = feedData.filter(item => item.platform === 'ios').length;

    return {
      totalApps,
      recentUpdates,
      androidApps,
      iosApps,
      lastUpdated: new Date().toISOString()
    };
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log('Created data directory');
    }
  }

  async saveData(data) {
    await this.ensureDataDirectory();
    const outputPath = path.join(this.dataDir, 'apps-data.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Data saved to ${outputPath}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    const startTime = Date.now();
    console.log('VPN Dashboard Data Scraper');
    console.log('================================\n');

    try {
      await this.loadExistingData();
      const { appsData, config } = await this.getAllAppsData();
      const feedData = this.generateFeedData(appsData);
      const stats = this.generateStats(feedData);
      const appIcons = this.generateAppIcons(appsData);
      const iapData = this.generateIAPData(appsData);
      const rankings = await this.getRankings(config.vpnApps);

      const finalData = {
        apps: appsData,
        feed: feedData,
        stats: stats,
        appIcons: appIcons,
        iap: iapData,
        rankings: rankings,
        totalApps: appsData.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalExecutionTime: Math.round((Date.now() - startTime) / 1000),
          successfulApps: appsData.filter(app => Object.keys(app.platforms).length > 0).length
        }
      };

      await this.saveData(finalData);

      console.log('\nSUMMARY');
      console.log('============');
      console.log(`Total Apps: ${stats.totalApps}`);
      console.log(`Recent Updates: ${stats.recentUpdates}`);
      console.log(`Android Apps: ${stats.androidApps}`);
      console.log(`iOS Apps: ${stats.iosApps}`);
      console.log(`Execution Time: ${finalData.metadata.totalExecutionTime}s`);
      console.log(`Data generation completed successfully`);

    } catch (error) {
      console.error('Data generation failed:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const generator = new StaticDataGenerator();
  generator.run();
}

module.exports = StaticDataGenerator;
