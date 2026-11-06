"""Throwaway local Trove API for capturing commercial screenshots.

Never touches the configured database: DATABASE_URL is pinned to a SQLite file
under commercial/tools/.demo-db before Django loads settings, and outgoing
email is disabled. Seeds one verified demo user with PHP data through the app's
own sync push protocol so the web client pulls it like any other device.

Run from repo root:  python commercial/tools/demo_api.py
Then the web app:    (in web/) VITE_API_URL=http://localhost:8000/api/v1 npx vite --port 5174
Demo login (local only): demo@trove.test / TroveDemo!2026
"""

import os
import sys
import uuid
from datetime import date, datetime, timedelta
from datetime import timezone as tz
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = ROOT / "api"
DB_DIR = Path(__file__).resolve().parent / ".demo-db"
DB_DIR.mkdir(exist_ok=True)
DB_FILE = DB_DIR / "demo.sqlite3"
if DB_FILE.exists():
    DB_FILE.unlink()

sys.path.insert(0, str(API))
os.chdir(API)
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
os.environ["DATABASE_URL"] = "sqlite:///" + DB_FILE.as_posix()

import django  # noqa: E402

django.setup()
from django.conf import settings  # noqa: E402

# Settings read DATABASE_URL from os.environ first; double-check before touching anything.
assert settings.DATABASES["default"]["ENGINE"].endswith("sqlite3"), settings.DATABASES
settings.CORS_ALLOWED_ORIGINS = ["http://localhost:5174", "http://127.0.0.1:5174"]
settings.CSRF_TRUSTED_ORIGINS = settings.CORS_ALLOWED_ORIGINS
settings.ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

import apps.common.emails as emails  # noqa: E402
import apps.users.views as user_views  # noqa: E402


def _no_email(*_a, **_k):
    return None


emails.send_email = _no_email
emails.send_verification_email = _no_email
user_views.send_email = _no_email
user_views.send_verification_email = _no_email

from django.core.management import call_command  # noqa: E402

call_command("migrate", verbosity=0)

from rest_framework.test import APIClient  # noqa: E402

from apps.finance.models import Category  # noqa: E402
from apps.users.models import User  # noqa: E402

EMAIL, PASSWORD = "demo@trove.test", "TroveDemo!2026"
user = User.objects.create_user(
    email=EMAIL, password=PASSWORD, first_name="Paula", last_name="Reyes"
)
user.is_verified = True
user.preferred_currency = "PHP"
user.save()

cat = {c.name: str(c.id) for c in Category.objects.filter(user=user)}
client = APIClient()
client.force_authenticate(user)
muts: list[dict] = []


def add(entity: str, payload: dict) -> str:
    eid = str(uuid.uuid4())
    muts.append(
        {
            "client_mutation_id": str(uuid.uuid4()),
            "entity": entity,
            "entity_id": eid,
            "op": "create",
            "base_version": 0,
            "payload": payload,
        }
    )
    return eid


acc: dict[str, str] = {}
for name, bank, kind, opening in [
    ("BDO Savings", "BDO Unibank", "savings", "48500.00"),
    ("BPI Payroll", "BPI (Bank of the Philippine Islands)", "bank", "22150.00"),
    ("GCash", "GCash", "ewallet", "3820.00"),
    ("Maya", "Maya e-wallet", "ewallet", "1640.00"),
    ("Cash", "Cash", "cash", "9500.00"),
]:
    acc[name] = add(
        "accounts",
        {"name": name, "bank_name": bank, "type": kind, "currency": "PHP",
         "opening_balance": opening},
    )
acc["UnionBank Card"] = add(
    "accounts",
    {"name": "UnionBank Card", "bank_name": "UnionBank", "type": "credit", "currency": "PHP",
     "opening_balance": "0", "credit_limit": "60000", "statement_day": 15, "due_day": 5},
)

goal = add(
    "savings_goals",
    {"name": "Emergency fund", "target_amount": "60000", "currency": "PHP",
     "target_date": "2027-06-30", "linked_account_id": acc["BDO Savings"]},
)
japan = add("savings_goals", {"name": "Japan trip", "target_amount": "45000", "currency": "PHP",
                      "target_date": "2027-04-01"})

for name, amount in [("Groceries", "8000"), ("Dining", "4000"), ("Transport", "3000"),
                     ("Shopping", "5000"), ("Utilities", "4500"), ("Entertainment", "2000")]:
    add("budgets", {"category_id": cat[name], "amount": amount, "period": "monthly",
                    "start_date": "2026-09-01", "alert_threshold": 80})

today = date(2026, 11, 6)


def tx(days_ago, kind, amount, category=None, src=None, dst=None, notes="", hour=12, **extra):
    d = datetime.combine(today - timedelta(days=days_ago), datetime.min.time(),
                         tzinfo=tz.utc) + timedelta(hours=hour)
    p = {"type": kind, "amount": amount, "currency": "PHP", "date": d.isoformat(),
         "notes": notes}
    if category:
        p["category_id"] = cat[category]
    if src:
        p["from_account_id"] = acc[src]
    if dst:
        p["to_account_id"] = acc[dst]
    p.update(extra)
    add("transactions", p)


for m_ago in (0, 1, 2):
    base = 5 + 30 * m_ago
    tx(base, "income", "38500.00", "Salary", dst="BPI Payroll", notes="Payroll", hour=9)
    tx(base, "transfer", "6000.00", src="BPI Payroll", dst="BDO Savings",
       notes="Emergency fund", savings_goal_id=goal, hour=10)
    tx(base, "transfer", "5500.00", src="GCash", dst="BDO Savings",
       notes="Japan trip", savings_goal_id=japan, hour=11)
    tx(base + 2, "expense", "14000.00", "Rent", src="BPI Payroll", notes="Condo rent")
    tx(base + 8, "expense", "2380.00", "Utilities", src="GCash", notes="Meralco bill")
    tx(base + 12, "income", "7500.00", "Freelance", dst="GCash", notes="Logo project")

items = [
    (0, "Groceries", "1245.50", "GCash", "Puregold"),
    (0, "Dining", "285.00", "Cash", "Coffee"),
    (1, "Transport", "180.00", "Maya", "Grab ride"),
    (1, "Dining", "540.00", "GCash", "Ramen"),
    (2, "Shopping", "1899.00", "UnionBank Card", "Running shoes"),
    (3, "Groceries", "820.25", "Cash", "Market"),
    (3, "Subscriptions", "549.00", "UnionBank Card", "Spotify"),
    (4, "Entertainment", "450.00", "GCash", "Cinema"),
    (6, "Transport", "350.00", "Maya", "Fuel"),
    (7, "Dining", "760.00", "UnionBank Card", "Dinner out"),
    (9, "Groceries", "2210.00", "BPI Payroll", "S&R"),
    (10, "Health", "620.00", "Cash", "Pharmacy"),
    (12, "Transport", "220.00", "Maya", "MRT load"),
    (14, "Shopping", "1150.00", "GCash", "Shopee"),
    (16, "Dining", "390.00", "Cash", "Lunch"),
    (18, "Groceries", "1580.00", "GCash", "Puregold"),
    (21, "Education", "1200.00", "BPI Payroll", "Online course"),
    (24, "Transport", "260.00", "Maya", "Grab ride"),
    (27, "Dining", "480.00", "GCash", "Brunch"),
    (33, "Groceries", "2650.00", "BPI Payroll", "S&R"),
    (38, "Shopping", "2400.00", "UnionBank Card", "Jacket"),
    (41, "Dining", "920.00", "UnionBank Card", "Birthday dinner"),
    (45, "Entertainment", "780.00", "GCash", "Concert"),
    (49, "Groceries", "1890.00", "Cash", "Market"),
    (55, "Travel", "3200.00", "BPI Payroll", "Baguio trip"),
    (62, "Groceries", "2100.00", "GCash", "Puregold"),
    (68, "Health", "1500.00", "BPI Payroll", "Dental"),
    (75, "Dining", "650.00", "Cash", "Dinner"),
]
for i, (d, c, amt, a, note) in enumerate(items):
    tx(d, "expense", amt, c, src=a, notes=note, hour=8 + (i % 10))

r = client.post("/api/v1/sync/push/", {"client_id": "demo-seed", "mutations": muts},
                format="json")
if r.status_code != 200:
    raise SystemExit(f"seed push failed: {r.status_code} {r.content[:400]!r}")
bad = [x for x in r.json()["results"] if x["status"] != "applied"]
print(f"seeded {len(muts)} mutations, {len(bad)} not applied", bad[:3], flush=True)

print("serving demo api on http://localhost:8000 (sqlite only)", flush=True)
call_command("runserver", "127.0.0.1:8000", use_reloader=False)
