const fs = require('fs');

// YouTube trailer video IDs for each movie (official trailers)
const trailers = {
  1: "YoHD9XEInc0",   // Inception
  2: "1Fg5iWmQjwk",   // The Grand Budapest Hotel
  3: "SPHfeNgogVs",   // Finding Nemo
  4: "gCcx85e7-sI",   // Blade Runner 2049
  5: "PLl99DlL6b4",   // The Shawshank Redemption
  6: "92a7Hj0ijLs",   // My Neighbor Totoro
  7: "s7EdQ4FqbhY",   // Pulp Fiction
  8: "Rvr68u6k5sI",   // Coco
  9: "KBiOF3y1W0Y",   // Drive
  10: "QD6cy4PBQPI",  // The Secret Life of Walter Mitty
  11: "zSWdZVtXT7E",  // Interstellar
  12: "ByXuk9QqQkk",  // Spirited Away
  13: "iszwuX1AK6A",  // The Wolf of Wall Street
  14: "ORFo8veHyGE",  // Up
  15: "9NJj12tiBzc",  // Moonlight
  16: "vKQi3bBA1y8",  // The Matrix
  17: "W6iVPCRflQM",  // Lost in Translation
  18: "hEJnMQG9ev8",  // Mad Max: Fury Road
  19: "dlnmQbPGuls",  // The Truman Show
  20: "HUECWi5pX7o",  // Amélie
  21: "qtRKdVHc-cE",  // Fight Club
  22: "yRUAzGQ3nSY",  // Inside Out
  23: "38A__WT3-o0",  // No Country for Old Men
  24: "alIq_wG9FNk",  // WALL-E
  25: "ne6p6MfLBxc",  // Her
  26: "EXeTwQWrcwY",  // The Dark Knight
  27: "sCMGPqeGD2k",  // Paddington 2
  28: "07-QBnEkgXU",  // Eternal Sunshine of the Spotless Mind
  29: "2AUmvWm5ZDQ",  // John Wick
  30: "NgsQ8mVkN8w",  // Ratatouille
  31: "iUJkwotOWCs",  // The Departed
  32: "iwROgK94ycU",  // Howl's Moving Castle
  33: "SEUXfv87Wpk",  // Parasite
  34: "6MUcuqbGTxc",  // Before Sunrise
  35: "7d_jQycdQGo",  // Whiplash
  36: "xOsLIiBStEs",  // Soul
  37: "2ilzidi_J8Q",  // Goodfellas
  38: "WNNUcHRiPS8",  // The Princess Bride
  39: "WR7cc5t7tv8",  // A Quiet Place
  40: "4sj1MT05lAA",  // The Lion King
  41: "8g18jFHCLXk",  // Dune (2021)
  42: "wxN1T1qdqzk",  // Everything Everywhere All at Once
  43: "mqqft2x_Aa4",  // The Batman
  44: "giXco2jaZ_4",  // Top Gun: Maverick
  45: "0pdqf4P9MB8",  // La La Land
  46: "g4Hbz2jLxvQ",  // Spider-Man: Into the Spider-Verse
  47: "qGqiHJTsRkQ",  // Knives Out
  48: "owK1qxDselE",  // Gladiator
  49: "tFMo3UJ4B4g",  // Arrival
  50: "EoQuVnKhxaM",  // Ex Machina
  51: "zAGVQLHvwOY",  // Joker
};

let content = fs.readFileSync('d:/univibe/data/movieData.js', 'utf8');

Object.entries(trailers).forEach(([id, ytId]) => {
  const movieId = parseInt(id);
  const pattern = new RegExp(
    '("movie_id": ' + movieId + ',[\\s\\S]*?"quote": "[^"]+",)'
  );
  
  content = content.replace(pattern, (match) => {
    return match + '\n        "trailer": "' + ytId + '",';
  });
});

fs.writeFileSync('d:/univibe/data/movieData.js', content, 'utf8');
console.log('Done adding trailers');

delete require.cache[require.resolve('d:/univibe/data/movieData.js')];
const m = require('d:/univibe/data/movieData.js');
console.log('Movies:', m.length);

let missing = m.filter(x => !x.trailer).map(x => x.title);
console.log('Missing trailers:', missing.length > 0 ? missing.join(', ') : 'NONE - all have trailers!');
