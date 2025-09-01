#!/usr/bin/env node

const gplay = require('google-play-scraper');
const store = require('app-store-scraper');
const fs = require('fs').promises;
const path = require('path');

class StaticDataGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
  }

  async loadAppsConfig() {
    try {
      const configPath = path.join(__dirname, 'config/apps.json');
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ Failed to load apps config:', error.message);
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
        url: app.url
      };
    } catch (error) {
      console.warn(`⚠️  Play Store - ${appId}: ${error.message}`);
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
        url: app.url
      };
    } catch (error) {
      console.warn(`⚠️  App Store - ${appId}: ${error.message}`);
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
    
    console.log(`📱 Fetching data for ${app.name}...`);

    // Get Android data
    if (app.playStoreId) {
      const androidData = await this.getPlayStoreAppInfo(app.playStoreId);
      if (androidData) {
        results.android = androidData;
        console.log(`  ✅ Android: v${androidData.version}`);
      }
      await this.delay(1500); // Rate limiting
    }

    // Get iOS data
    if (app.appStoreId) {
      const iosData = await this.getAppStoreAppInfo(app.appStoreId);
      if (iosData) {
        results.ios = iosData;
        console.log(`  ✅ iOS: v${iosData.version}`);
      }
      await this.delay(1500); // Rate limiting
    }

    return results;
  }

  async getAllAppsData() {
    const config = await this.loadAppsConfig();
    const allAppsData = [];

    console.log(`🚀 Starting data collection for ${config.vpnApps.length} VPN apps...\n`);

    for (const app of config.vpnApps) {
      try {
        const platforms = await this.getAppData(app);
        
        const appInfo = {
          id: app.id,
          name: app.name,
          platforms: platforms
        };

        allAppsData.push(appInfo);
        console.log(`✅ Completed ${app.name}\n`);
      } catch (error) {
        console.error(`❌ Failed to fetch data for ${app.name}:`, error.message);
        allAppsData.push({
          id: app.id,
          name: app.name,
          platforms: {}
        });
      }
    }

    return allAppsData;
  }

  generateFeedData(appsData) {
    const feedData = [];
    
    appsData.forEach(app => {
      Object.entries(app.platforms).forEach(([platform, data]) => {
        if (data) {
          feedData.push({
            id: `${app.id}_${platform}`,
            appId: app.id,
            appName: app.name,
            platform: platform,
            version: data.version || 'Unknown',
            lastUpdated: data.lastUpdated,
            notes: data.notes || 'No update notes available',
            rating: data.rating,
            downloads: data.downloads,
            size: data.size,
            developer: data.developer,
            url: data.url
          });
        }
      });
    });

    // Sort by last updated date (newest first)
    feedData.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    return feedData;
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
      console.log('📁 Created data directory');
    }
  }

  async saveData(data) {
    await this.ensureDataDirectory();
    
    const outputPath = path.join(this.dataDir, 'apps-data.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Data saved to ${outputPath}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    const startTime = Date.now();
    console.log('🤖 VPN Dashboard Data Scraper');
    console.log('================================\n');

    try {
      // Fetch all app data
      const appsData = await this.getAllAppsData();
      
      // Generate feed data
      const feedData = this.generateFeedData(appsData);
      
      // Generate statistics
      const stats = this.generateStats(feedData);
      
      // Create final data structure
      const finalData = {
        apps: appsData,
        feed: feedData,
        stats: stats,
        totalApps: appsData.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalExecutionTime: Math.round((Date.now() - startTime) / 1000),
          successfulApps: appsData.filter(app => Object.keys(app.platforms).length > 0).length
        }
      };

      // Save to file
      await this.saveData(finalData);

      // Print summary
      console.log('\n📊 SUMMARY');
      console.log('============');
      console.log(`Total Apps: ${stats.totalApps}`);
      console.log(`Recent Updates: ${stats.recentUpdates}`);
      console.log(`Android Apps: ${stats.androidApps}`);
      console.log(`iOS Apps: ${stats.iosApps}`);
      console.log(`Execution Time: ${finalData.metadata.totalExecutionTime}s`);
      console.log(`✅ Data generation completed successfully!`);

    } catch (error) {
      console.error('❌ Data generation failed:', error);
      process.exit(1);
    }
  }
}

// Run the scraper if this file is executed directly
if (require.main === module) {
  const generator = new StaticDataGenerator();
  generator.run();
}

module.exports = StaticDataGenerator;