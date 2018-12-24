const BaseScraper = require('./base_scraper');
const Util        = require('./util');
const _           = require('lodash');
const util        = require('util');
const fs          = require('fs');

const readFile    = util.promisify(fs.readFile);
const writeFile   = util.promisify(fs.writeFile);

class AlbumScraper extends BaseScraper {
  async fetchFirstImageDateAndImageURLs(metadataFileName) {
    // Read metadata
    let previousFirstImageFileName  = null;
    try {
      previousFirstImageFileName = (await readFile(metadataFileName)).toString().trim();
    } catch {}

    const FIRST_IMAGE_SELECTOR      = '#content_container div[role="main"] div[role="presentation"]:nth-child(1)';
    const POPUP_SELECTOR            = '#photos_snowlift[aria-busy="false"]';
    const IMAGE_SPLOTLIGHT_SELECTOR = '#photos_snowlift img.spotlight';
    const NEXT_SPOTLIGHT_SELECTOR   = '#photos_snowlift a.snowliftPager.next';
    const waitFetchImageURL         = this.page.waitForFunction(
      (selector) => {
        let image    = document.querySelector(selector);
        if (!image) {
          return;
        }

        let imageURL = image.getAttribute('src');
        if (image && imageURL.match(/^https:\/\/scontent.\w{4}\d-\d.fna.fbcdn.net/)) {
          return imageURL;
        }
      }, {}, IMAGE_SPLOTLIGHT_SELECTOR);

    // Click the first image and wait until the popup appears with the image.
    this.page.click(FIRST_IMAGE_SELECTOR);
    this.page.waitForSelector(POPUP_SELECTOR);
    let firstImageURL = await (await waitFetchImageURL).jsonValue();

    // Get the first image filename
    this.firstImageFileName = Util.baseName(firstImageURL);

    let imageURLs = [];
    let imageURL  = firstImageURL;
    while (true) {

      // Don't fetch the images already fetched
      if (Util.baseName(imageURL) === previousFirstImageFileName) { break; }

      // Push it
      imageURLs.push(imageURL);

      // Click next
      await this.page.waitFor(100);
      const nextElement = await this.page.$(NEXT_SPOTLIGHT_SELECTOR);
      await nextElement.click();

      // Retreive imageURL
      const waitForNewImageURL = this.page.waitForFunction(
        (selector, currentImageURL) => {
          let newImageURL = document.querySelector(selector).getAttribute('src');
          if (newImageURL != currentImageURL) {
            return newImageURL;
          }
        }, {}, IMAGE_SPLOTLIGHT_SELECTOR, imageURL);

      // Quit if it's a loop
      imageURL = await (await waitForNewImageURL).jsonValue();
      if (imageURLs.indexOf(imageURL) !== -1) { break; }
    }

    this.imageURLs = imageURLs;
    return imageURLs;
  }

  async saveMetaData(directoryName) {
    await writeFile(`${directoryName}/metadata.txt`, this.firstImageFileName);
  }
}

module.exports = AlbumScraper;
