"""Capture authenticated FinTrack screens. Credentials come from env vars only."""
import os
from playwright.sync_api import sync_playwright

EMAIL = os.environ["FT_EMAIL"]
PASSWORD = os.environ["FT_PASSWORD"]
BASE = "http://localhost:5173"
OUT = "shots"

ROUTES = ["overview", "transactions", "statistics", "accounts", "settings/sync"]

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.get_by_role("textbox", name="Email").fill(EMAIL)
    pg.get_by_role("textbox", name="Password").fill(PASSWORD)
    pg.get_by_role("button", name="Sign in").click()
    pg.wait_for_url("**/overview", timeout=30000)
    pg.wait_for_timeout(2500)
    for route in ROUTES:
        pg.goto(f"{BASE}/{route}", wait_until="networkidle")
        pg.wait_for_timeout(2500)
        name = route.replace("/", "-")
        pg.screenshot(path=f"{OUT}/app-{name}.png")
        print("captured", name)
    b.close()
print("done")
