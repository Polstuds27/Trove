# Trove UI Redesign Spec

Source: 20 approved desktop mockups and 18 mobile mockups, read by Claude and written out as text so a coding agent that cannot see images can build from it. Place this file at `docs/redesign-spec.md`.

How to read it:
- Pixel values were measured on mockups roughly 1265–1280 px wide. Treat them as proportions, and build everything fluid.
- Hex values are close estimates. Where the repo already defines the same token (forest `#294737`, sage `#9BA78A`, warm gray `#D9D3C9`, cream `#F7F0E5`, sand `#DFC5AD`), use the repo token.
- All names, amounts and dates in the mockups are sample data. Use live app data, calculations and APIs. Never hardcode them.
- Mobile mockups are covered in section 7. Anything marked "derived" had no mockup.

## 0. Ignore these capture artifacts

The mockup exports contain rendering glitches that are not part of the design:
- Page titles look clipped on the left ("ccounts", "udget", "ookmarks"). The real titles are the full words.
- Sharp-edged rectangles of blur or fog appear around glass panels. They come from backdrop-filter bleeding in the screenshot. Do not reproduce them. Glass panels are plain rounded rectangles.
- A phantom 314 px-wide layer cuts across the top-left of many screens. Ignore it.
- The mobile mockups show the same artifacts: titles hidden under a blur band, fog around glass cards.
- On the Sign in and Create account screens the mascot appears hard-cropped at the top of the leaves and the bottom of the feet. Render the mascot uncropped, overlapping its circle.

## 1. Themes

Two themes, driven by the same tokens and the app's existing theme switch (Settings has an "Appearance" row).
- **Light**: the main mockup set. Every screen below is described in light unless it says otherwise.
- **Dark**: the same design in dark colours. See "Dark theme rules" below.

### Dark theme rules
- **The design does not change in dark mode.** Layouts, grids, spacing, radii, type sizes, component structure, nav structure, mascot placement and responsive behaviour are identical to light. Do not build separate dark layouts. Dark mode is a colour-token swap only: colours, borders, shadows and glass tints.
- **Take the colours from the two dark mockups** (the desktop Overview and the mobile Home) and use the values in the dark tokens below as the reference. For every screen and component the dark mockups don't show, improvise from those colours. Map each light token to its dark counterpart by the same role, for example:
  - Page background: near-black. Cards: slightly lighter than the page. Hero and glass panels: deep forest, lighter again. Each step up in elevation gets a step lighter.
  - Borders: 1 px, low-contrast (`#222B25`), used in place of most of the light theme's soft shadows.
  - Text: cream for primary, muted grey-sage for secondary. Hero and stat numbers are cream.
  - Primary button and active nav pill: cream with dark text. The add button on mobile is cream with a dark "+".
  - Progress bars: sage fill, amber when near the limit, and a terracotta variant (lightened, around `#E39A74`) for over-limit or error. The track is dark (`#1F2622`).
  - Avatars: dark-tinted circles (deep forest `#2A3A2F`, warm brown `#4A3629`, and similar) with a cream initial.
  - Toggles: on = sage track with a cream knob. Off = dark grey track.
  - Inputs: surface fill (`#161A17`) with a 1 px border (`#2A332D`), cream text and muted placeholder. Error state: terracotta border and a faint warm-dark tint.
  - Badges and chips: dark-tinted fills with lighter text of the same hue (Paid sage, Next amber or terracotta, Upcoming grey). Inactive filter pills use the dark surface fill.
  - Charts: keep the same hue order (sage, sand, cream, moss, clay) but lighten as needed so every slice and bar has enough contrast on the dark background. The current-month emphasis uses cream or bright sage in place of forest.
  - Glass panels: translucent forest or charcoal gradient, the same blur, and a 1 px border at about 8% white.
  - Mascot: the same sprites, never recoloured. In hero panels the circle behind it is a lighter forest than the card.
  - Landing and auth: the same layouts. The sage left panel becomes a deep-forest gradient, the form side is near-black, and the headline is cream.
- Keep text and icon contrast at WCAG AA or better. Check amber and terracotta on dark specifically.
- The theme switch, default theme and persistence stay as the app already has them.

### Light tokens (approximate)
- Page background: cream `#F7F0E5` with a soft diagonal gradient and a faint sage-gray wash toward the top-right (`~#E4E1D3`).
- Card surface: warm white `#FDFBF6`, 1px border `rgba(217,211,201,.5)`.
- Text: forest `#294737` for titles and hero numbers, near-black `#1F2420` for row text, muted gray `#6B6F66` for secondary text.
- Track (progress, off toggles, inactive pills): `#E9E3D8`.
- Warning / over-budget / error accent: terracotta `~#B5582F`, bar fill `~#C0845B`, tint `#F8E6DA`.
- Avatar tints: sage-light `#E2E9DC`, sand `#DFC5AD`, peach `#F2DDD0`, warm gray `#D9D3C9`, sage `#9BA78A`.
- Chart colors: forest `#294737`, sage `#9BA78A`, sand `#E0C5AD`, warm gray `#D9D3C9`, moss `#6E8B5A`, clay `#C9A080`.

### Dark tokens (from the dark Overview and mobile Home, approximate)
- Page background: near-black `#0D0E0D`.
- Surfaces: `#141815` (panels, cards), `#161A17` (stat cards), border `#222B25`.
- Hero card: deep forest `#1F2F26`, border `#2D4136`.
- Text: cream `#F4EEDF`, muted `#A9ADA3`.
- Positive accent: sage-green `#9BB587`. Warning accent: amber `#E3B35C`.
- Progress track `#1F2622`, normal fill sage `#9BA78A`, warning fill amber.
- Active nav pill: cream `#EFE7D6` with dark text. Primary button: cream pill with dark text.

## 2. Global design language

- **Type:** Inter. Page title 32/38 semibold, tight tracking, forest. Subtitle 13–14 muted. Card title 16 semibold. Row title 15 semibold, row subtitle 13 muted. Amounts semibold with tabular numerals. Hero amount 56–64 bold. Stat amount 28–32 bold. Big card number 40–44.
- **Money format:** `₱` prefix, thousands separators. Negatives use a true minus `−₱2,345.00`. Positives in lists use `+₱62,500.00`. Transfers show the amount with no sign.
- **Radii:** sidebar 32, hero and glass panels 28–32, cards 24–28, buttons 14–16, inputs 16, pills fully round, avatars full circle, progress bars full round.
- **Shadows:** soft and low. Data cards: `0 1px 2px rgba(41,71,55,.04), 0 8px 24px rgba(41,71,55,.06)`. Active nav pill and primary form button get a slightly stronger forest-tinted shadow.
- **Spacing:** generous. Card padding about 22–24. Gaps between cards about 17–18. Calm, not dense.
- **Two surface kinds:**
  - *Solid cards* for data lists and tables.
  - *Glass panels* for sidebar, hero, mascot and insight panels. They use a diagonal gradient from translucent white to pale sage (or pale peach on some), a 1px white-ish border, and `backdrop-filter: blur(16px)`. Use glass only on these. Never on every card.
- **Card header pattern:** title on the left, small muted summary on the right (for example "Total ₱184,620.50"), and a thin hairline divider under the header row. Rows are separated by hairlines, not boxes.
- **Avatars:** 38 px circles with the initial of the payee or account, in rotating pastel tints.
- **Primary button:** forest fill, white 13–14 semibold text, height about 39, radius 14. Secondary button: warm-gray `#E9E3D8` fill with dark text. Destructive secondary: same fill with terracotta text.
- **Pills and badges:**
  - Filter pill active: forest fill, white text. Inactive: warm-gray fill, dark text.
  - Status badges: Paid (sage-light fill, forest text), Next (peach fill, terracotta text), Upcoming (warm-gray fill, gray text), Expense tag (peach fill, terracotta text).
- **Toggles:** on = forest track with white knob. Off = warm-gray track with white knob.
- **Progress bars:** 8 px high, rounded, track `#E9E3D8`, fill forest. Over 90% turns terracotta, and its "left" text turns terracotta.
- **Mascot:** appears as a free-standing figure with no frame, about 130–180 px tall, placed in the lower-right of the page content just below the last card, or inside a glass panel. It never covers text. Mascot poses and where they go are in section 6.

## 3. App shell (desktop)

**Light.**
- Floating glass sidebar, inset about 14 px from the left, top and bottom of the viewport. Width about 240. Full height minus the inset. Radius 32. Translucent cream fill with soft shadow.
- Top: logo tile (34 px, radius 10, cream fill with a dark sprout icon) plus "Trove" in 24 semibold forest.
- Under the logo: a **balance card** (radius 24, near-white). "Total balance" in 12 muted, amount in 22 semibold, "5 accounts" in 12 muted. Live data.
- Nav items, in order and groups:
  - (no heading) Overview, Transactions, Accounts, Budget, Statistics
  - PLANNING: Savings goals, Debts, Credit cards, Recurring, Installments, Calendar
  - ORGANISE: Categories, Search, Bookmarks, Settings
- Item: height about 37, 8 px gap, small 8 px sage dot at the left, 14–15 medium text. Section headings are 11 px uppercase, letter-spaced, muted.
- Active item: forest pill (radius 16), white semibold text, white dot, light shadow.
- Content area starts about 40 px to the right of the sidebar and has about 40 px right padding. Header row: page title and subtitle on the left, one primary action button on the right (for example "+ New account").

**Dark (same structure, dark colours).**
- The sidebar is a solid dark panel (`#141815`, 1px `#222B25` border, radius 24, inset 24) instead of glass.
- Logo tile is cream with a dark sprout. Balance card is a darker inset.
- Active item is a cream pill with dark text and a dark dot.
- Content begins about 24 px right of the sidebar. Primary action is a cream pill.

Header actions per page: Overview "+ Add transaction", Transactions "+ Add transaction", Accounts "+ New account", Budget "+ New budget", Savings goals "+ New goal", Debts "+ New debt", Credit cards "+ Add card", Recurring "+ New recurring", Installments "+ New installment", Categories "+ New category". Statistics, Calendar, Search, Bookmarks and Settings have none.

## 4. Screen specs

Subtitles shown in quotes are the text under each title.

### Overview
Light header: "Overview", subtitle is the current date ("Monday, October 26, 2026"). Dark is identical.
1. **Hero (glass panel, about 330 high):** "Good morning!" 30 semibold. Under it "Here's how your money is doing this month." Then "Total balance" label, the balance at about 56–64 bold, then "+2.4% vs. last month" in 12 semibold. Waving mascot at the right, tall, sitting slightly over the edge of the text block. In dark the hero is deep forest and the mascot sits inside a lighter circle (about 184 px).
2. **Three stat cards** in one row, equal width: Income, Expenses, Left over. Label 13 muted, amount 28–32 bold. Left over is shown positive (`+₱23,760`) and in the positive accent colour.
3. **Two-column row:**
   - Left, about two thirds: "October budget" card. Header with "6 days left". Large "₱34,550" with "of ₱42,000" small beside it. Overall progress bar. Then up to three category rows (Groceries, Dining, Bills): name left, "₱8,200 of ₱10,000" right, progress bar under. A category near its limit uses the warning colour and shows "₱100 left". The light mockup also shows a one-line caption ("Dining is nearly at its limit, with ₱100 left.").
   - Right, about one third: mascot glass panel (peach-cream). "More came in than went out this month" and "+₱23,760", with the piggy-bank mascot at the right.
4. **Recent transactions card:** header with "See all" link (dark: sage-green link). Rows: avatar, payee, "Category · Today/Oct 25", account name in a middle column, amount right-aligned and bold. Show 3–4 rows.

### Transactions
Subtitle: "Income, expenses and transfers". Master-detail, two columns (about 63% / 37%).
- **Left card:** search input at the top (rounded, white, "Search transactions…"). Filter pills: All, Income, Expense, Transfer, with the current month ("October 2026") right-aligned in muted text. Rows: avatar, payee with category underneath, account in a middle column (BPI Checking, GCash, Cash, Credit Card), amount right. A transfer row reads "Maya → GCash" with a ↔ icon avatar and a neutral amount.
- **Right card (details of the selected row):** "Transaction" label, payee name, amount at about 40 bold forest, "Expense" badge (peach). Then label/value rows: Category, Account, Date (with time), Note. Labels muted on the left, values semibold on the right, hairlines between. Buttons: Edit (forest) and Delete (warm gray, terracotta text).
- Mascot (hands on cheeks, surprised) free-standing below the detail card.

### Accounts
Subtitle: "Where your money lives". Two columns (about 63% / 37%).
- **Left card:** header "5 accounts" and "Total ₱184,620.50". Rows 60+ px tall: initial avatar, account name, type underneath (Cash, Savings, Checking, E-wallet), balance right.
- **Right card (selected account):** account name label, balance at about 40 bold forest, buttons Transfer (forest) and Edit (warm gray). "Recent activity" list with 3 rows (avatar, name, date, signed amount).
- Waving mascot free-standing below the right card.

### Budget
Subtitle: "Category allocations for October". Two columns.
- **Left card:** big "₱34,550" with "of ₱42,000" small, and a "Month · Week" toggle at the top-right. Total progress bar. Then one block per category: name 17 semibold on the left, "₱8,200 of ₱10,000 · ₱1,800 left" on the right (the last amount bold forest), progress bar underneath. A category at about 98% (Dining) uses a terracotta bar and a terracotta "₱100 left".
- **Right column:** a mascot glass panel ("Groceries is on track", "₱1,800 left for the next 6 days.", mascot hugging a leaf) and, under it, a small solid card "Not in a budget", "₱4,190", "Other spending this month".

### Statistics
Subtitle: "Spending breakdown and trends". Two columns.
- **Left card "Spending by category"** with the total spend on the right. Donut chart (about 170 px, thick ring) on the left and a legend list on the right: swatch, category name, "₱14,200 · 37%". Colours in the order forest, sage, sand, warm gray, moss, clay.
- **Right card "Income vs. expenses"** with "Last 6 months" on the right. Paired rounded vertical bars per month. Income bar in sage and expense bar in sand. The current month is emphasised (income forest, expense clay). Month labels under. One-line footnote ("October: ₱62,500 in · ₱38,740 out · +₱23,760 left over").
- Mascot with tablet below the right card.

### Savings goals
Subtitle clipped in the mockup ("…little by little" style). Use a short line consistent with the hero copy.
- **Hero glass panel (about 320 high):** "Little by little" 30 semibold, "Every peso you set aside counts.", "Total saved", the total at about 56 bold, "across 3 goals" in small bold. Piggy-bank mascot at the right.
- **Three goal cards in a row:** goal name, "Target Dec 31", saved amount at about 36 bold forest, "of ₱60,000 · 70%", progress bar, "₱18,000 to go".

### Debts
Subtitle: "Money owed to you and by you". Two equal columns, then a full-width card.
- "Owed to you" card (total on the right) and "You owe" card. Rows: initial avatar, name, note with due or borrowed date, amount right.
- Full-width "Payment history · {person}" card with "Remaining ₱3,500" on the right. Rows: a round icon avatar (down arrow in sage-light for payment received, up arrow in peach for lent), label and date, amount right (`+₱1,000.00`).

### Credit cards
Subtitle: "Balances and due dates".
- **Left column:** a card visual in forest with a soft green glow. Card name top-left ("BPI Rewards"), "Credit" top-right, "Balance" and the amount at about 44 bold white, and masked digits at the bottom ("•••• •••• •••• 4417"). Under it a solid card "Credit used" with "17% of ₱50,000" and a progress bar.
- **Right column:** a glass panel "Payment due", the date at about 36 bold forest, "In 5 days · ₱8,600.00", with the coin-holding mascot at the right. Under it a "Card activity" card with rows (avatar, merchant, "Category · date", negative amount).

### Recurring
Subtitle: "Repeating income and bills".
- No card around the two summary figures. "Monthly income" and "Monthly bills" are large numbers (about 36 bold forest) directly on the page background, side by side. The lounging, sleepy mascot sits at the top-right.
- **"Upcoming" card** with "Next 30 days" on the right. Rows: avatar, name, "Monthly · Nov 15", a category column ("Income", "Bills"), signed amount right.

### Installments
Subtitle: "Schedules and progress".
- **Two cards side by side:** plan name, "12 months · ₱60,000", monthly amount at about 44 bold forest with "/ month" small, progress bar, "2 of 12 paid · ₱50,000 remaining".
- **Schedule card ("Personal loan schedule"):** one row per instalment: date left, a centred status badge (Paid, Next, Upcoming), amount right.
- Tablet-holding mascot free-standing at the lower right.

### Calendar
Subtitle: "Due dates and paydays".
- **Left card:** month title, a weekday header row, and a grid of rounded squares (radius about 14, 1px border, about 74×64). Day number top-left of each cell. Event dots under the number: forest, sage, sand and terracotta, by event type. Today is filled pale sage with a forest border and a bold number.
- **Right card "Coming up":** rows with name, date, amount (income signed `+`).
- Cheering mascot (arms up) below the right card.
- Respect the Settings "Week starts on" value. The mockup grid starts on Sunday but Settings shows Monday, so do not hardcode either.

### Categories
Subtitle: "How your money is sorted". Two cards: "Expense" and "Income". Rows: colour square swatch, name in semibold, transaction count in muted ("4 transactions", "No activity"), total right-aligned in bold.

### Search
Subtitle: "Find any transaction".
- Full-width search input at the top (white, rounded, taller than the Transactions search).
- Below, two columns: results card ("3 results" left, active filter summary right, then transaction rows) and a "Filters" card with groups "Type" (All, Expense) and "Date" (This month, Any time) as pills.
- Tablet-holding mascot below the Filters card.

### Bookmarks (empty state)
One large glass card, almost full width and about 600 high, with a diagonal gradient from white to pale sage. Centered: mascot holding a card, "Nothing bookmarked yet" at about 30 semibold forest, "Bookmark a transaction to find it again quickly.", and a "Browse transactions" forest button. When bookmarks exist, use the Transactions list layout.

### Settings
Subtitle: "Profile and preferences". Two columns.
- **Left:** a profile card (large initial avatar in sage, name, email) and a "Preferences" card with label/value rows (Currency, Appearance, Week starts on).
- **Right:** "Notifications" card with three toggle rows (Bill reminders, Budget alerts, Weekly summary), a "Sync" card (Status, Offline changes), and a glass "Security" card with the "App lock" toggle, "Change password" secondary button and the shield-holding mascot.

### Sign in and Create account (50/50 split, no sidebar)
- **Left half:** vertical sage gradient (`~#C0CAB0` top to `~#9FAE92` bottom). Logo tile and "Trove" top-left. A large pale-sage circle (about 400 px) with the mascot in it, soft shadow below. Headline "Your money, clearly." at about 40 semibold forest, a 16 px paragraph, a hairline, then three short feature columns: "Offline-first / Record anywhere", "Multi-currency / Track it all", "Private / Your data, yours".
- **Right half:** cream with a faint gradient. A form block about 384 wide, vertically centred.
  - Sign in: "Welcome back" 36 semibold, subtitle, Email and Password fields, "Forgot password?" right-aligned bold, full-width "Sign in →" forest button (height about 46, radius 16, shadow), "New to Trove? Create an account".
  - Create account: "Create your account", subtitle, then Full name, Email, Base currency (select, helper "Totals and reports are shown in this currency."), Password, Confirm password, "Create account →" button, "Already have an account? Sign in". The mascot in the circle has both arms up.
  - Labels are 11 px uppercase, letter-spaced, with a red asterisk for required. Inputs are 46 high, radius 16, white, 1px sand border.
- **Sign-in error state:** a peach banner (`#F8E6DA`, radius 16) above the fields with a small sad mascot, bold "That email and password don't match." and a lighter second line "No worries, give it another try." Both input borders turn orange-terracotta and fill with a faint peach tint. Everything else is unchanged.

### Landing page (single long scroll)
- **Nav:** logo left; centre links Features, How it works, Get the app; right "Sign in" (text) and "Get started" (forest pill).
- **Hero (two columns):** eyebrow pill "Offline-first personal finance" (sage-light fill). H1 "Your money, clearly." at about 72 semibold forest. Paragraph about 17 muted. Buttons: "Start tracking free →" (forest), "Sign in" (white, outlined), "Or install the app ↓" (text link). Right: large pale-sage circle with the phone-holding mascot.
- **WHAT YOU GET:** eyebrow, H2 "Everything a money manager should do — offline included" at about 44, a sentence below, then a 3×2 grid of white cards (radius 28): Every account in one place; Offline-first; Sync that heals itself; Budgets that warn early; Goals, debts & recurring; Reports without the wait. Each card has a title and a 3–4 line description. Cards carry a small mascot at the right (sleeping, piggy, tablet). Add a mascot to the ones the mockup left bare so the grid is even.
- **HOW IT WORKS:** eyebrow, H2 "Three steps, then it runs itself", three cards numbered 01, 02, 03 in large sage numerals, with a title, a short description and a small mascot at the right.
- **GET THE APP:** left, H2 "Install Trove on your phone", a paragraph, a ✓ list of four benefits, and "Free, on every platform you own" in small muted text. Right, a white card with an "Install Trove" forest button and three numbered steps. A waving mascot stands beside the card.

## 5. States to cover everywhere (not in the mockups)
Loading (skeletons on cards and rows), empty (mascot-led glass card like Bookmarks), error, and offline (a calm banner plus mascot). Keep each consistent with the tokens above.

## 6. Mascot poses and placement
The mockups use these poses. Match them to the 16 sprite files in `public/mascot/ultra-refined/` and keep one shared mapping module (state → sprite).
- Waving: Overview hero, Accounts, Sign in, Landing steps and install card
- Holding piggy bank: Overview side panel, Savings goals hero, Landing "Budgets that warn early"
- Holding tablet or card: Bookmarks, Search, Statistics, Installments, Transactions empty, Landing "Reports without the wait"
- Arms up, cheering: Calendar, Create account, Landing step 03
- Hands on cheeks, surprised: Transactions
- Sleeping or lounging: Recurring, Landing "Offline-first", offline state
- Hugging a leaf: Budget "on track" panel
- Holding a coin: Credit cards payment due panel
- Holding a shield: Settings security panel
- Sad or concerned: Sign-in error banner
- Holding a phone: Landing hero
Use all 16 sprites somewhere. Any sprite not shown above goes to loading, error and celebration states.

## 7. Mobile (390 × 844 baseline)

Eighteen mobile mockups were supplied: Home (dark only), Accounts, Transactions, Statistics, Savings goals, Debts, Credit cards, Recurring, Installments, Calendar, Categories, Search, Bookmarks, Settings, Landing, Sign in, Sign in error and Create account.

Gaps to fill from the tokens in section 1:
- There is no light Home mockup. Derive it from the dark Home using the light tokens. Dark mode for every other mobile screen follows the dark theme rules in section 1.
- Budget has no mobile mockup. Build it as one column from the desktop Budget spec using the patterns below.
- The mobile capture artifacts match section 0: titles hidden under a blur band (Accounts, Bookmarks, Credit cards, Recurring, Savings goals), fog rectangles around glass cards, and content cut off behind them. The titles are the same words as on desktop.

### 7.1 Mobile shell
- **Content padding:** 18 px at the sides, 14–16 px between cards. Leave at least 110 px at the bottom so the last card scrolls clear of the nav and the add button. Respect safe-area insets.
- **Page header:** a small muted subtitle sits above a 28–30 semibold forest title, both left-aligned. A 42 px avatar circle (the user's initial) sits at the top-right: sage fill with a white letter in light, cream fill with a dark letter in dark. Tapping it opens Settings. The header scrolls with the page.
- **Floating bottom nav:** a glass pill inset about 14 px from each side and about 20 px above the bottom, about 70 high with a fully rounded shape. Five items, each an icon over an 11 px semibold label: Home, Activity, Budget, Goals, More.
  - The active item is a forest pill with a white icon and label. In dark it is a cream pill with dark text.
  - The mockup's grey rounded squares are icon placeholders. Use real icons from the app's icon set.
  - Active mapping: Overview → Home, Transactions → Activity, Budget → Budget, Savings goals → Goals. Every other route (Accounts, Statistics, Debts, Credit cards, Recurring, Installments, Calendar, Categories, Search, Bookmarks, Settings) highlights More.
  - Tapping More opens a bottom sheet listing the remaining routes under the same three headings as the desktop sidebar (derived, not in the mockups).
- **Floating add button:** a 52 px circle with a white "+" on forest (a dark "+" on cream in dark), with a soft shadow. It sits at the right edge, about 16 px above the nav. It opens Add transaction. It appears on all in-app screens and not on the landing or auth screens. Keep free-standing mascots clear of it. The mockups let it cover the Calendar and Statistics mascots, which is a flaw to avoid.
- **Section headings:** on mobile the card title sits outside and above the card (16 semibold, about 22 px left inset), with its muted summary on the right ("Owed to you … ₱5,500"). Desktop puts the title inside the card, so do not carry that over.
- **Row pattern:** a 38 px initial avatar, a bold payee, a muted line "Category · Account" or "Category · date", and the amount right-aligned in bold. The account moves from its own desktop column into the subtitle line.
- **Money format:** the mockups mix whole-peso and two-decimal amounts. Use the app's single money formatter everywhere. Do not copy the mixture.

### 7.2 Screens
- **Home (dark):**
  1. Header: a small muted date ("Monday, October 26"), then "Good morning, {first name}" at about 28 bold cream, with the cream avatar at the right.
  2. Hero: a deep-forest card (radius 28, about 150 high). "Total balance", the balance at about 36 bold, "+2.4% vs. last month" in green. The waving mascot sits in a circle at the right.
  3. Insight card: an amber-tinted card (dark brown fill, amber border) with a worried mascot at the left. Bold "Dining is nearly at its limit." and "₱100 left this month, just a heads-up." with "₱100 left" in amber. The mascot and tone follow state: calm and positive when no category is near its limit.
  4. "October budget" card: "6 days left", "₱34,550" at about 36 bold with "of ₱42,000", a sage progress bar, and "₱7,450 left overall" in green.
  5. "Recent" heading with a green "See all" link, then a card of transaction rows.
  The mockup omits the Income / Expenses / Left over trio. Keep that data reachable with a compact three-up row after the budget card (derived).
- **Transactions:**
  - Search input and filter pills (All, Income, Expense, Transfer), then rows grouped by date with the group label ("Today", "Yesterday", "Oct 24", "Oct 22") above each card.
  - The transfer row reads "Maya → GCash" with a ↔ avatar, "Transfer" as its subtitle and an unsigned amount.
  - Tapping a row opens the details as a bottom sheet (Category, Account, Date, Note, Edit, Delete). Derived from the desktop detail card.
- **Accounts:** a glass hero card with "Total · 5 accounts", the total at about 36 bold forest, and the waving mascot inside it on the right, followed by one card of account rows. Tapping a row opens a detail screen (balance, Transfer and Edit buttons, recent activity), derived from the desktop right-hand card.
- **Statistics:**
  - A row of range pills: This month (active), 3M, 6M, 1Y.
  - Card "Spending by category" with the total on the right. A donut of about 110 px at the left and a legend at the right showing swatch, name and percentage only (no amounts).
  - Card "Income vs. expenses" with "6 months" on the right and paired bars.
  - A one-line summary under the cards ("October: ₱62,500 in · ₱38,740 out"), and a tablet mascot below.
- **Savings goals:** the title is "Savings goals" with the subtitle "Little by little". A glass hero card shows "Total saved", the amount at about 40 bold, "across 3 goals", and the piggy-bank mascot. Then one card per goal, stacked. Goal name on the left and "Target Mar 2027" on the right. The saved amount at about 28 bold with "of ₱55,000 · 34%" inline in small muted text. A progress bar and "₱36,500 to go".
- **Debts:** three stacked sections, each a heading with a card: "Owed to you" (total at right), "You owe" (total at right), and "Payment history · {person}" with "Remaining ₱3,500" at the right. When that heading is long it wraps to two lines and the "Remaining" text stays on the right.
- **Credit cards:** the forest card (radius 28, about 150 high) with "BPI Rewards" at the top-left, "Credit" at the top-right, "Balance" with the amount at about 40 bold white, and the masked digits at the bottom. Below it a "Credit used" card with "17% of ₱50,000" and a progress bar. Then the glass "Payment due" card ("Oct 31" at about 36 bold, "In 5 days · ₱8,600.00", coin-holding mascot at the right), then the card-activity rows.
- **Recurring:** a glass hero card holding "Monthly income" and "Monthly bills" side by side, with the lounging mascot at its right. Below it an "Upcoming" card of rows (avatar, name, "Monthly · Nov 15", signed amount). The desktop category column drops out.
- **Installments:** plan cards stacked (name, "12 months · ₱60,000", the monthly amount at about 36 bold with "/ month", progress bar, "2 of 12 paid · ₱50,000 remaining"), then the "Personal loan schedule" heading and a card of rows (date left, centered status badge, amount right).
- **Calendar:** a card with "October 2026" and a weekday header. The grid is plain day numbers (no bordered cells) with the event dot under the number. Today is a pale-sage rounded square with a forest border and a bold number. Under it a "Coming up" heading and a card of rows. Each row has a sage-light circle with a small dot as its icon, the name, the date, and the amount.
- **Categories:** "Expense" and "Income" headings, each over a card. Row: swatch, bold name, muted "4 txns" / "1 txn" / "No activity", amount at the right.
- **Search:** the search input, then two rows of pills (Type: All, Expense; Date: This month, Any time). Below that, "3 results" with the active filter summary on the right, a results card, and the tablet mascot free-standing at the right.
- **Bookmarks:** one tall glass card (about 560 high) with the mascot holding a card, "Nothing bookmarked yet" at about 24 semibold forest, the one-line hint, and a "Browse transactions" button.
- **Settings:**
  - A profile card, then the Preferences rows (label muted on the left, value bold on the right).
  - A Notifications card with larger toggle rows (about 17 px labels) for Bill reminders, Budget alerts and Weekly summary.
  - A glass Security card with the "App lock" toggle and the shield mascot.
  - The mockup hides part of this screen behind a fog artifact. Keep the Sync card and the "Change password" button from the desktop spec.
- **Landing:**
  - Top bar: logo at the left and a "Get started" forest pill at the right (no nav links).
  - Eyebrow pill, then the H1 "Your money, clearly." at about 44 semibold on two lines, a paragraph, and a button row ("Start tracking free →" filling the width, "Sign in" beside it). Then the phone-holding mascot in a pale-sage circle of about 260 px, centered.
  - "WHAT YOU GET" eyebrow, an H2 at about 28 ("Everything a money manager should do — offline included"), then four stacked feature cards with shorter copy: Every account in one place, Offline-first, Budgets that warn early, Reports without the wait. The last three carry a small mascot at the right.
  - "HOW IT WORKS" eyebrow, "Three steps, then it runs itself", then three stacked step cards written as "01 · Set up your accounts", with small mascots on steps 02 and 03.
  - The mockup ends here. Add a stacked "Get the app" install section (derived from the desktop landing page).
- **Sign in / Create account:** one column, no split panel. Logo at the top-left, then a centered mascot in a pale-sage circle (about 140–180 px), then the heading, subtitle, fields and button, then the switch link. Left-align the heading and fields with a 24 px side margin. The mascot is waving on Sign in and arms-up on Create account. Create account omits Base currency in the mockup. Keep that field, placed after Email.
- **Sign in error:** the same screen plus the peach banner with the sad mascot, bold "That email and password don't match.", then "No worries, give it another try." Both fields take the terracotta border and peach tint.

### 7.3 Breakpoints
- 1024 and up: the desktop shell and layouts from sections 3–4.
- Below 1024: the mobile shell, with page content capped at about 640 px wide and centered. Two-column desktop layouts collapse to one column in the order the mobile screens show.
- 1024–1279: the desktop layout with the sidebar narrowed to about 220.

## 8. Build order
1. Tokens and the shared surfaces (solid card, glass panel, pills, badges, toggles, progress bar, avatar, buttons).
2. App shell: desktop sidebar and header, plus the mobile header, bottom nav and add button, light and dark.
3. Overview, matched closely to the desktop and mobile Home mockups.
4. Transactions, Accounts, Budget, Statistics.
5. Savings goals, Debts, Credit cards, Recurring, Installments, Calendar.
6. Categories, Search, Bookmarks, Settings.
7. Landing, Sign in (with error state), Create account.
8. Remaining mobile layouts (section 7), then empty, loading, error and offline states.
