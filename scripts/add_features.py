import json
import re

# Simple keyword extraction (just split synopsis by space and filter out common words)
STOP_WORDS = set(["the", "and", "a", "an", "is", "in", "it", "of", "to", "for", "with", "as", "by", "on", "that", "this", "from", "at"])

def add_features(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        is_js = filepath.endswith('.js')
        if is_js:
            json_str = content[content.find('['):]
            data = json.loads(json_str)
        else:
            data = json.loads(content)

        for movie in data:
            if 'synopsis' in movie:
                # Add overview as a slightly enriched version of synopsis
                movie['overview'] = movie['synopsis']
                
                # Extract simple keywords
                words = re.findall(r'\b[a-zA-Z]{4,}\b', movie['synopsis'].lower())
                keywords = [w for w in set(words) if w not in STOP_WORDS][:10]
                
                # Add some keywords based on genre
                genre = movie.get('genre', [])
                if isinstance(genre, list):
                    keywords.extend([g.lower() for g in genre])
                elif isinstance(genre, str):
                    keywords.extend([g.lower() for g in genre.split('|')])
                    
                movie['keywords'] = ", ".join(list(set(keywords)))
            else:
                movie['overview'] = ''
                movie['keywords'] = ''

        if is_js:
            new_content = 'const MOVIES = ' + json.dumps(data, indent=2) + ';\n\nif (typeof module !== "undefined") {\n  module.exports = MOVIES;\n}'
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
        else:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
        print(f"Added keywords and overview to {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

add_features('data/movieData.js')
add_features('backend/baseMovies.json')
