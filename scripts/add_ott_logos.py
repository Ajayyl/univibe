import json
import os

# Paths
BASE_MOVIES = r'd:\mrs\backend\baseMovies.json'
FRONTEND_DATA = r'd:\mrs\data\movieData.js'

# Logo Mapping
PLATFORM_LOGOS = {
    "Netflix": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg",
    "Amazon Prime Video": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png",
    "Disney+ Hotstar": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Disney%2B_Hotstar_logo.svg",
    "HBO Max": "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg",
    "SonyLIV": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Sony_LIV_logo.svg",
    "ZEE5": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Zee5_logo.svg",
    "Crunchyroll": "https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.svg",
    "JioCinema": "https://upload.wikimedia.org/wikipedia/commons/1/10/JioCinema_Logo.svg"
}

def add_logos():
    with open(BASE_MOVIES, 'r', encoding='utf-8') as f:
        movies = json.load(f)

    for m in movies:
        if 'ottPlatforms' in m:
            for p in m['ottPlatforms']:
                name = p['name']
                # Add logo icon if in mapping, otherwise use generic logo
                p['icon'] = PLATFORM_LOGOS.get(name, "https://upload.wikimedia.org/wikipedia/commons/c/c8/Play_button_icon.png")

    # Save
    with open(BASE_MOVIES, 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2)
    with open(FRONTEND_DATA, 'w', encoding='utf-8') as f:
        f.write(f"const MOVIES = {json.dumps(movies, indent=2)};")

    print(f"Successfully added branding icons to {len(movies)} movies.")

if __name__ == "__main__":
    add_logos()
