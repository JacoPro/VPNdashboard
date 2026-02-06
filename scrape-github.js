#!/usr/bin/env node

// Enhanced GitHub Actions compatibility script
console.log('GitHub Actions VPN Dashboard Data Scraper');
console.log('===============================================\n');

try {
  process.env.NODE_OPTIONS = '--no-experimental-fetch --no-warnings';

  if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File extends Blob {
      constructor(chunks, name, options = {}) {
        super(chunks, options);
        this.name = name;
        this.lastModified = options.lastModified || Date.now();
        this.webkitRelativePath = '';
      }
    };
  }

  if (typeof globalThis.FormData === 'undefined' && typeof require !== 'undefined') {
    try {
      const { FormData } = require('formdata-node');
      globalThis.FormData = FormData;
    } catch (e) {
      console.warn('FormData polyfill not available');
    }
  }

  console.log('Environment compatibility fixes applied');
} catch (error) {
  console.error('Compatibility setup failed:', error.message);
  console.log('Attempting to continue anyway...\n');
}

async function runScraper() {
  try {
    const StaticDataGenerator = require('./scrape-data.js');

    if (require.main === module) {
      console.log('Starting GitHub Actions scraper...\n');
      const generator = new StaticDataGenerator();
      await generator.run();
    }
  } catch (error) {
    console.error('Scraper execution failed:');
    console.error(error);

    try {
      const fs = require('fs').promises;
      const path = require('path');

      const fallbackData = {
        apps: [],
        feed: [],
        stats: { totalApps: 0, recentUpdates: 0, androidApps: 0, iosApps: 0, lastUpdated: new Date().toISOString() },
        appIcons: {},
        iap: [],
        rankings: { android: {}, ios: {} },
        totalApps: 0,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalExecutionTime: 0,
          successfulApps: 0,
          error: error.message
        }
      };

      const dataDir = path.join(__dirname, 'data');
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(path.join(dataDir, 'apps-data.json'), JSON.stringify(fallbackData, null, 2));

      console.log('Created fallback data structure');
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError.message);
    }

    process.exit(1);
  }
}

runScraper();
