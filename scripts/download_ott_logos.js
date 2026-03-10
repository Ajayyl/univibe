const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = 'd:/univibe/assets/ott';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const logos = {
  'netflix': 'netflix.com',
  'prime-video': 'amazonprime.com',
  'disney-plus': 'disneyplus.com',
  'hbo-max': 'max.com',
  'apple-tv': 'tv.apple.com',
  'hulu': 'hulu.com',
  'paramount-plus': 'paramountplus.com',
  'peacock': 'peacocktv.com'
};

const entries = Object.entries(logos);
let done = 0;

entries.forEach(([name, domain]) => {
  const file = path.join(dir, name + '.png');
  const fileStream = fs.createWriteStream(file);
  // Using Wikipedia/clearbit or any reliable source...
  // clearbit is best for crisp original square/rectangle PNG logos of domains
  https.get('https://logo.clearbit.com/' + domain + '?size=200', res => {
    res.pipe(fileStream);
    res.on('end', () => {
      console.log('Downloaded', name, 'status', res.statusCode);
      done++;
      if (done === entries.length) checkDimensions();
    });
  }).on('error', e => console.error('Error on', name, e.message));
});

function checkDimensions() {
   console.log('Finished downloading all logos to', dir);
}
