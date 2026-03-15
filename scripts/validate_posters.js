const fs = require('fs');
const path = require('path');
const movies = require('../data/movieData.js');

let errors = 0;
movies.forEach(movie => {
    let poster = movie.poster;
    if (poster && !poster.startsWith('http')) {
        let p = path.join(__dirname, '..', poster);
        if (!fs.existsSync(p)) {
            console.log(`[Missing file] Movie ${movie.movie_id} (${movie.title}): ${poster}`);
            errors++;
        } else {
            let stat = fs.statSync(p);
            if (stat.size === 0) {
                console.log(`[Zero-byte file] Movie ${movie.movie_id} (${movie.title}): ${poster}`);
                errors++;
            }
        }
    }
});
if (errors === 0) console.log("All local posters exist and are valid!");
