const https = require('https');

https.get('https://raw.githubusercontent.com/simple-icons/simple-icons/develop/_data/simple-icons.json', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const db = JSON.parse(data);
      const targets = ['netflix', 'prime', 'disney', 'hbo', 'apple', 'hulu', 'paramount', 'peacock', 'max'];
      targets.forEach(t => {
        const found = db.icons.filter(i => i.title.toLowerCase().includes(t));
        const names = found.map(i => i.title + ' -> ' + (i.slug || i.title.replace(/[\s\+]/g,'').toLowerCase()));
        console.log('Search ' + t + ': ' + names.join(', '));
      });
    } catch(err) {
      console.log('Error parsing JSON:', err.message);
    }
  });
});
