const path      = require('path');
const fs        = require('fs');
const util      = require('util');
const axios     = require('axios');

class Util {
  static async removeAllFiles(directory) {
    const readdir  = util.promisify(fs.readdir);
    const unlink   = util.promisify(fs.unlink);

    const files    = await readdir(directory);
    const promises = files.map(filename => unlink(`${directory}/${filename}`));
    return await Promise.all(promises);
  }

  static async wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  static baseName(url) {
    return path.basename(url.split('?')[0]);
  }

  static async downloadImages(directoryName, imageURLs) {
    for(let i=0; i<imageURLs.length; i++) {
      await this.downloadImage(directoryName, imageURLs[i]);
    }
  }

  static async downloadImage(directoryName, imageURL) {
    const mkdir     = util.promisify(fs.mkdir);
    await mkdir(directoryName, { recursive: true });

    const imageName = path.basename(imageURL).split('?')[0];
    const imagePath = path.resolve(__dirname, `../${directoryName}`, imageName);

    // axios image download with response type "stream"
    const response = await axios({
      method: 'GET',
      url: imageURL,
      responseType: 'stream'
    });

    // pipe the result stream into a file on disc
    response.data.pipe(fs.createWriteStream(imagePath));

    // return a promise and resolve when download finishes
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        resolve();
      });

      response.data.on('error', () => {
        reject();
      });
    });
  }
}

module.exports = Util;
