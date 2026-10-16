"""
Capture LinkedIn carousel slides as individual PNG images.
Each slide is 1080x1350 (4:5 portrait, optimal for LinkedIn).

Usage: python3 capture-carousel.py
Output: carousel-slides/slide-1.png through slide-7.png
"""

from playwright.sync_api import sync_playwright
from pathlib import Path
import os

SLIDE_COUNT = 7
SLIDE_WIDTH = 1080
SLIDE_HEIGHT = 1350
OUTPUT_DIR = Path(__file__).parent / "carousel-slides"

def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    html_path = Path(__file__).parent / "carousel.html"
    file_url = f"file://{html_path.resolve()}"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": SLIDE_WIDTH, "height": SLIDE_HEIGHT})
        page.goto(file_url, wait_until="networkidle")

        # Wait for fonts to load
        page.wait_for_timeout(2000)

        for i in range(1, SLIDE_COUNT + 1):
            selector = f"#slide-{i}"
            element = page.query_selector(selector)
            if element:
                out_path = OUTPUT_DIR / f"slide-{i}.png"
                element.screenshot(path=str(out_path))
                print(f"  Captured {out_path.name} ({SLIDE_WIDTH}x{SLIDE_HEIGHT})")
            else:
                print(f"  WARNING: {selector} not found")

        browser.close()

    print(f"\nAll slides saved to: {OUTPUT_DIR.resolve()}")
    print(f"Upload these as a PDF or multi-image post on LinkedIn.")

if __name__ == "__main__":
    main()
