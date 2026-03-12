const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "/assets/posters/" with "assets/posters/"
    content = content.replace(/"\/assets\/posters\//g, '"assets/posters/');
    
    // Also handle possible single quotes
    content = content.replace(/'\/assets\/posters\//g, "'assets/posters/");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed paths in ${filePath}`);
}

fixFile('d:/univibe/data/movieData.js');
fixFile('d:/univibe/backend/baseMovies.json');
