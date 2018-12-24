const puppeteer = require('puppeteer');

class BaseScraper {
  constructor(url, options={}) {
    this.url     = url;
    this.options = options;
  }

  async launch() {
    // 1. Launch the browser in headless mode and set up a page.
    this.browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1440,900',
        '--ignore-certificate-errors'
      ]
    });
    this.page    = await this.browser.newPage();

    // 2. Set the window size (optional, default is 800x600).
    // https://github.com/GoogleChrome/puppeteer/issues/1183#issuecomment-383722137
    await this.page._client.send('Emulation.clearDeviceMetricsOverride');

    // 3. Navigate the url
    await this.page.goto(this.url, { waitUntil: 'load' });
  }

  async login() {
    const EMAIL_SELECTOR    = '#email';
    const PASSWORD_SELECTOR = '#pass';
    const BUTTON_SELECTOR   = '#loginbutton';

    await this.page.click(EMAIL_SELECTOR);
    await this.page.keyboard.type(process.env.FACEBOOK_EMAIL);

    await this.page.click(PASSWORD_SELECTOR);
    await this.page.keyboard.type(process.env.FACEBOOK_PASSWORD);

    await this.page.click(BUTTON_SELECTOR);

    await this.page.waitForNavigation();

    // Navigate back to the intended url
    await this.page.goto(this.url, { waitUntil: 'load' });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = BaseScraper;
