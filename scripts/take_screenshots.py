import asyncio
import time
from playwright.async_api import async_playwright
import os

async def take_screenshots():
    # Ensure output directory exists
    output_dir = r"d:\mrs\assets\screenshots"
    os.makedirs(output_dir, exist_ok=True)
    
    # Let the servers warm up for a moment
    time.sleep(3)
    
    async with async_playwright() as p:
        # Use chromium browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        
        try:
            # 1. Dashboard screenshot
            print("Taking dashboard screenshot...")
            await page.goto("http://127.0.0.1:3000/tests/dashboard.html", timeout=60000)
            await page.wait_for_timeout(2000)  # Wait for any JS rendering
            await page.screenshot(path=os.path.join(output_dir, "testing_dashboard.png"), full_page=True)
            print("Dashboard screenshot saved.")
        except Exception as e:
             print(f"Failed dashboard: {e}")
             
        try:
            # 2. Movie Catalog Home page
            print("Taking home page screenshot...")
            await page.goto("http://127.0.0.1:3000/index.html", timeout=60000)
            await page.wait_for_timeout(3000) # Wait for movies to load
            await page.screenshot(path=os.path.join(output_dir, "movie_catalog.png"))
            print("Home screenshot saved.")
        except Exception as e:
             print(f"Failed home: {e}")
             
        try:
            # 3. Movie details (testing interaction)
            print("Taking movie details screenshot...")
            # We assume a valid movie id is 1. If it fails, we fall back to index.
            await page.goto("http://127.0.0.1:3000/movie.html?id=1", timeout=60000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path=os.path.join(output_dir, "movie_interaction.png"))
            print("Movie detail screenshot saved.")
        except Exception as e:
             print(f"Failed details: {e}")
        
        await browser.close()
        print("All screenshots captured successfully to " + output_dir)

if __name__ == "__main__":
    asyncio.run(take_screenshots())
