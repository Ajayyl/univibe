import json
import os

# Paths
BASE_MOVIES = r'd:\mrs\backend\baseMovies.json'
FRONTEND_DATA = r'd:\mrs\data\movieData.js'

# Google Favicon Service (Extremely Reliable & Fast)
PLATFORM_DOMAINS = {
    "Netflix": "netflix.com",
    "Amazon Prime Video": "primevideo.com",
    "Disney+ Hotstar": "hotstar.com",
    "HBO Max": "max.com",
    "SonyLIV": "sonyliv.com",
    "ZEE5": "zee5.com",
    "Crunchyroll": "crunchyroll.com",
    "JioCinema": "jiocinema.com"
}

def update_to_google_icons():
    with open(BASE_MOVIES, 'r', encoding='utf-8') as f:
        movies = json.load(f)

    for m in movies:
        if 'ottPlatforms' in m:
            for p in m['ottPlatforms']:
                name = p['name']
                domain = PLATFORM_DOMAINS.get(name, "google.com")
                p['icon'] = f"https://www.google.com/s2/favicons?sz=64&domain={domain}"

    # Save
    with open(BASE_MOVIES, 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2)
    with open(FRONTEND_DATA, 'w', encoding='utf-8') as f:
        f.write(f"const MOVIES = {json.dumps(movies, indent=2)};")

    print(f"Updated all icons to Google Favicon Service for {len(movies)} movies.")

if __name__ == "__main__":
    update_to_google_icons()
