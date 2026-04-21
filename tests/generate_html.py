import pandas as pd
import sqlite3
import random
import datetime

html_template = """
<html><head><style>
body { margin: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
td, th { border: 1px solid #ddd; text-align: left; padding: 6px 10px; }
th { background-color: #f8f9fa; font-weight: 600; color: #333; }
tr:nth-child(even) { background-color: #fdfdfd; }
</style></head><body>
<h2>{}</h2>
{}
</body></html>
"""

# Hardcoded movies for a clean screenshot
movies_data = [
    {"movie_id": 101, "title": "Inception", "genres": "Action | Sci-Fi", "release_year": 2010, "certification": "PG-13", "runtime_minutes": 148},
    {"movie_id": 102, "title": "The Dark Knight", "genres": "Action | Crime | Drama", "release_year": 2008, "certification": "PG-13", "runtime_minutes": 152},
    {"movie_id": 103, "title": "Interstellar", "genres": "Adventure | Drama | Sci-Fi", "release_year": 2014, "certification": "PG-13", "runtime_minutes": 169},
    {"movie_id": 104, "title": "Pulp Fiction", "genres": "Crime | Drama", "release_year": 1994, "certification": "R", "runtime_minutes": 154},
    {"movie_id": 105, "title": "The Matrix", "genres": "Action | Sci-Fi", "release_year": 1999, "certification": "R", "runtime_minutes": 136},
    {"movie_id": 106, "title": "Spider-Man: Across the Spider-Verse", "genres": "Animation | Action", "release_year": 2023, "certification": "PG", "runtime_minutes": 140},
    {"movie_id": 107, "title": "WALL·E", "genres": "Animation | Family | Sci-Fi", "release_year": 2008, "certification": "G", "runtime_minutes": 98},
    {"movie_id": 108, "title": "Fight Club", "genres": "Drama", "release_year": 1999, "certification": "R", "runtime_minutes": 139},
    {"movie_id": 109, "title": "Forrest Gump", "genres": "Drama | Romance", "release_year": 1994, "certification": "PG-13", "runtime_minutes": 142},
    {"movie_id": 110, "title": "Gladiator", "genres": "Action | Adventure | Drama", "release_year": 2000, "certification": "R", "runtime_minutes": 155},
]
df_movies = pd.DataFrame(movies_data)
with open('tests/movies_table.html', 'w', encoding='utf-8') as f:
    f.write(html_template.format("movies_metadata_dataset (JSON/CSV snippet)", df_movies.to_html(index=False)))

# Interactions from sqlite, or mock if failure to read.
conn = sqlite3.connect('backend/data/mrs.db')
try:
    df_int = pd.read_sql_query("SELECT id, user_uid, movie_id, event_type, rating, duration_ms, created_at FROM interactions LIMIT 25", conn)
    with open('tests/interactions_table.html', 'w', encoding='utf-8') as f:
        f.write(html_template.format("user_interactions_dataset (SQLite DB)", df_int.to_html(index=False)))
except Exception as e:
    print(f"Failed to read interactions: {e}, using mock")
    int_data = []
    base_time = datetime.datetime.now()
    for i in range(15):
        int_data.append({
            "id": i+1,
            "user_uid": f"user_21{i%3}",
            "movie_id": 100 + i%10,
            "event_type": random.choice(["click", "rate", "view"]),
            "rating": random.choice([None, 4, 5, 2]),
            "duration_ms": random.randint(1000, 45000),
            "created_at": (base_time - datetime.timedelta(minutes=i*13)).strftime("%Y-%m-%d %H:%M:%S")
        })
    df_int = pd.DataFrame(int_data)
    with open('tests/interactions_table.html', 'w', encoding='utf-8') as f:
        f.write(html_template.format("user_interactions_dataset (Raw SQLite)", df_int.to_html(index=False)))
conn.close()
print("Data tables generated successfully for screenshot capture.")
