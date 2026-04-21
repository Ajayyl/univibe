import json
import os
import random
import hashlib

# Paths
BASE_MOVIES = r'd:\mrs\backend\baseMovies.json'
FRONTEND_DATA = r'd:\mrs\data\movieData_v63.js'

# Top 50+ Real Release Dates (Indian/Global)
REAL_DATES = {
    "Sinners": "Mar 07, 2025",
    "Animal": "Dec 01, 2023",
    "Kalki 2898 AD": "Jun 27, 2024",
    "Maharaja": "Jun 14, 2024",
    "12th Fail": "Oct 27, 2023",
    "Leo": "Oct 19, 2023",
    "Vikram": "Jun 03, 2022",
    "Jailer": "Aug 10, 2023",
    "Pathaan": "Jan 25, 2023",
    "Jawan": "Sep 07, 2023",
    "RRR": "Mar 25, 2022",
    "Salaar": "Dec 22, 2023",
    "Premalu": "Feb 09, 2024",
    "Manjummel Boys": "Feb 22, 2024",
    "Bramayugam": "Feb 15, 2024",
    "Hanu Man": "Jan 12, 2024",
    "Varshangalkku Shesham": "Apr 11, 2024",
    "Aavesham": "Apr 11, 2024",
    "Guruvayoor Ambalanadayil": "May 16, 2024",
    "The Goat Life": "Mar 28, 2024",
    "Captain Miller": "Jan 12, 2024",
    "Thangalaan": "Aug 15, 2024",
    "Indian 2": "Jul 12, 2024",
    "Game Changer": "Jan 10, 2025",
    "Pushpa 2: The Rule": "Dec 05, 2024",
    "Devara: Part 1": "Sep 27, 2024",
    "Stree 2": "Aug 15, 2024",
    "Baby John": "Dec 25, 2024",
    "Singham Again": "Nov 01, 2024",
    "Kanguva": "Nov 14, 2024",
    "Lucky Baskhar": "Oct 31, 2024",
    "Amaran": "Oct 31, 2024",
    "Vettaiyan": "Oct 10, 2024",
    "GOAT": "Sep 05, 2024",
    "Kottukkaali": "Aug 23, 2024",
    "Raayan": "Jul 26, 2024",
    "Pepe": "Aug 30, 2024",
    "Lubber Pandhu": "Sep 20, 2024",
    "Vazhai": "Aug 23, 2024",
    "Meiyazhagan": "Sep 27, 2024",
}

MONTH_MAP = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def add_full_release_dates():
    with open(BASE_MOVIES, 'r', encoding='utf-8') as f:
        movies = json.load(f)

    for m in movies:
        title = m.get('title', 'Unknown')
        year = m.get('year', 2024)
        
        # Priority 1: REAL DATES Audit
        if title in REAL_DATES:
            m['release_date'] = REAL_DATES[title]
        else:
            # Priority 2: Deterministic Generation (so it doesn't change on restart)
            # Use hash of title to pick a month and day
            hash_val = int(hashlib.md5(title.encode()).hexdigest(), 16)
            month_idx = hash_val % 12
            day = (hash_val % 28) + 1 # Use 1-28 to be safe for all months
            m['release_date'] = f"{MONTH_MAP[month_idx]} {day:02d}, {year}"

    # Save
    with open(BASE_MOVIES, 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2)
    with open(FRONTEND_DATA, 'w', encoding='utf-8') as f:
        f.write(f"const MOVIES = {json.dumps(movies, indent=2)};")

    print(f"Set full release dates for {len(movies)} movies.")

if __name__ == "__main__":
    add_full_release_dates()
