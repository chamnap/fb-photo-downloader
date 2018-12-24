#!/usr/bin/env node

require('dotenv').config()
const program        = require('commander');
const Util           = require('./lib/util');
const AlbumScraper   = require('./lib/album_scraper');

program
  .version('0.1.0')
  .option('-u, --url [value]',        'URL')
  .option('-h, --headless [value]',   'Headless mode')
  .option('-l, --login [value]',      'Login required')
  .option('-d, --directory [value]',  'Directory to save')
  .option('-v, --verbose [value]',    'Verbose mode')
  .parse(process.argv);

let options = {
  url:       program.url || process.argv[2],
  headless:  program.headless || 'no',
  login:     program.login || 'no',
  directory: program.directory || './images',
  verbose:   program.verbose
};

(async () => {
  let scraper;
  try {
    // Delete all failed screenshots
    await Util.removeAllFiles('tmp/screenshots');

    // Launch
    scraper = new AlbumScraper(options.url);
    await scraper.launch();

    // Login
    if (program.login == 'yes') {
      await scraper.login();
    }

    // Fetch all images
    await scraper.fetchFirstImageDateAndImageURLs(`${options.directory}/metadata.txt`);

    // Download them
    await Util.downloadImages(options.directory, scraper.imageURLs);

    // Save metadata
    await scraper.saveMetaData(options.directory);
  } catch(err) {
    let date = new Date();
    await scraper.page.screenshot({ path: `tmp/screenshots/${date.toJSON()}.png` });
    console.log(`Unable to visit the url(${options.url})`, err)
  } finally {
    await scraper.close();
    process.exit();
  }
})()
