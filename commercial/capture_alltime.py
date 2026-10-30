"""Capture the full-range ledger. Credentials from env vars only."""
import os
from playwright.sync_api import sync_playwright

EMAIL = os.environ["FT_EMAIL"]
PASSWORD = os.environ["FT_PASSWORD"]
BASE = "http://localhost:5173"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.get_by_role("textbox", name="Email").fill(EMAIL)
    pg.get_by_role("textbox", name="Password").fill(PASSWORD)
    pg.get_by_role("button", name="Sign in").click()
    pg.wait_for_url("**/overview", timeout=30000)
    pg.wait_for_timeout(2000)
    pg.goto(f"{BASE}/transactions", wait_until="networkidle")
    pg.wait_for_timeout(1500)
    pg.get_by_role("radio", name="All time").click()
    pg.wait_for_timeout(2000)
    pg.screenshot(path="shots/app-transactions-all.png")
    print("captured all-time ledger")
    b.close()
print("done")
