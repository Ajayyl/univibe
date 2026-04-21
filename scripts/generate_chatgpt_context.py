import os

# Configuration
PROJECT_ROOT = r'd:\mrs'
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'mrs_chatgpt_context.md')

# Files to include (ordered by importance)
CORE_FILES = [
    ('README.md', 'Project Overview & Setup'),
    ('backend/main.py', 'Machine Learning API (FastAPI)'),
    ('backend/server.js', 'Core Backend API (Node.js)'),
    ('js/recommendationEngine.js', 'Frontend Recommendation Logic'),
    ('js/api.js', 'Frontend API Layer'),
    ('backend/database.js', 'Database Schema & Queries'),
    ('data/movieData.js', 'Movie Database (Sample/Head)'),
    ('scripts/fixed_movie_data.py', 'Data Integrity Script'),
]

def generate_context():
    print(f"Generating consolidated context file: {OUTPUT_FILE}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        outfile.write("# Movie Recommendation System 2.0 - Consolidated System Context\n")
        outfile.write("This file contains the core code of the Movie Recommendation System project for documentation and analysis.\n\n")
        outfile.write("## Table of Contents\n")
        
        for file_path, description in CORE_FILES:
            outfile.write(f"- [{file_path}](#{file_path.replace('/', '').replace('.', '')})\n")
        
        outfile.write("\n---\n\n")
        
        for file_path, description in CORE_FILES:
            full_path = os.path.join(PROJECT_ROOT, file_path)
            if not os.path.exists(full_path):
                print(f"Warning: File not found {file_path}")
                continue
                
            outfile.write(f"## {file_path}\n")
            outfile.write(f"**Description:** {description}\n\n")
            outfile.write("```" + (file_path.split('.')[-1] if '.' in file_path else '') + "\n")
            
            # Special handling for large data files
            if 'movieData.js' in file_path:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read(5000) # Only take first 5000 chars of data
                    outfile.write(content + "\n... [truncated for brevity] ...\n")
            else:
                with open(full_path, 'r', encoding='utf-8') as f:
                    outfile.write(f.read())
            
            outfile.write("\n```\n\n")
            outfile.write("---\n\n")
            
    print("Done! You can now upload 'mrs_chatgpt_context.md' to ChatGPT.")

if __name__ == "__main__":
    generate_context()
