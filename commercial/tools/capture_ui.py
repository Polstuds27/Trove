"""Capture real Trove screens from the local demo stack for the commercial.

Requires: commercial/tools/demo_api.py running on :8000 and the web app on :5174
(VITE_API_URL=http://localhost:8000/api/v1). Writes PNGs to commercial/public/ui/.
Usage: python commercial/tools/capture_ui.py [mobile|desktop|all]
"""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "public" / "ui"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:5174"
EMAIL, PASSWORD = "demo@trove.test", "TroveDemo!2026"
ROUTES = ["overview", "transactions", "budgets", "accounts", "goals", "statistics"]

PROFILES = {
    "mobile": dict(viewport={"width": 390, "height": 844}, device_scale_factor=3,
                   is_mobile=True, has_touch=True),
    "desktop": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2),
}


def run(profile: str, dark: bool) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        ctx = browser.new_context(color_scheme="dark" if dark else "light",
                                  timezone_id="Asia/Manila", locale="en-PH",
                                  **PROFILES[profile])
        page = ctx.new_page()
        page.goto(f"{BASE}/login")
        page.fill("input[type=email]", EMAIL)
        page.fill("input[type=password]", PASSWORD)
        page.click("button[type=submit]")
        page.wait_for_url("**/overview", timeout=20000)
        page.wait_for_timeout(4000)  # let the first sync pull land
        for route in ROUTES:
            page.goto(f"{BASE}/{route}")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1800)
            suffix = "-dark" if dark else ""
            page.screenshot(path=str(OUT / f"{profile}-{route}{suffix}.png"))
            print("captured", profile, route, flush=True)
        browser.close()


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    for prof in (["mobile", "desktop"] if which == "all" else [which]):
        run(prof, dark=False)
