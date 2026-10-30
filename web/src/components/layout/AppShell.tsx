import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Bell,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Ellipsis,
  LayoutDashboard,
  Landmark,
  LayoutGrid,
  LogOut,
  PiggyBank,
  Plus,
  Repeat,
  Settings,
  Sprout,
  Target,
  Wallet,
  type LucideIcon,
  BarChart3,
  CalendarDays,
  Tags,
  Search,
  Bookmark,
} from "lucide-react";
import { isActive, ORGANISE_NAV, PLANNING_NAV, SETTINGS_ITEM, type NavItem } from "../../app/navigation";
import { editorBackgroundPath } from "../../app/modalRoutes";
import { useAuth } from "../../auth/AuthContext";
import { useLocalData } from "../../features/analytics/useLocalData";
import { portfolio } from "../../features/analytics/engine";
import { formatMoney } from "../../design/format";
import { useSync } from "../../sync/SyncContext";
import { db } from "../../db";
import { PROFILE_KEY } from "../../db/profile";
import { useLiveQuery } from "dexie-react-hooks";
import { Avatar } from "../ui/Primitives";
import { Dropdown } from "../ui/Controls";
import { Overlay } from "../ui/Overlay";
import { SyncIndicator } from "./SyncIndicator";

/* ------------------------------------------------------------------ sidebar */

function Brand() {
  return (
    <NavLink to="/overview" className="flex items-center gap-3 px-1" aria-label="Trove home">
      <span
        aria-hidden="true"
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white text-primary shadow-sm dark:bg-cream dark:text-primary-contrast"
      >
        <Sprout className="h-[19px] w-[19px]" />
      </span>
      <span className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-primary">Trove</span>
    </NavLink>
  );
}

function BalanceCard() {
  const { lookups, ready } = useLocalData();
  const totals = portfolio(lookups);
  const accountCount = lookups.dataset.accounts.filter((account) => !account.archived).length;
  return (
    <div className="mt-5 rounded-[24px] border border-white/70 bg-surface-raised/90 px-4 py-3.5 shadow-sm dark:border-line dark:bg-surface-raised">
      <p className="text-xs text-muted">Total balance</p>
      <p className="tabular mt-1.5 truncate text-[22px] font-semibold leading-none tracking-[-0.03em] text-primary">
        {ready ? formatMoney(totals.assets, lookups.dataset.baseCurrency) : "—"}
      </p>
      <p className="mt-2 text-xs text-muted">
        {ready ? `${accountCount} ${accountCount === 1 ? "account" : "accounts"}` : "Loading…"}
      </p>
    </div>
  );
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = isActive(item, pathname);
  return (
    <li>
       <NavLink
         to={item.to}
         end={!item.matchNested}
         onClick={onNavigate}
         aria-current={active ? "page" : undefined}
         className={`trove-nav-item ${active ? "trove-nav-active" : ""}`}
       >
         <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
         <span className="truncate">{item.label}</span>
       </NavLink>
    </li>
  );
}

function SidebarSection({ title }: { title: string }) {
  return (
    <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {title}
    </p>
  );
}

function SidebarFooter() {
  const { conflicts } = useSync();
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const cached = useLiveQuery(() => db.profile.get(PROFILE_KEY), []);
  const cachedName = cached ? `${cached.first_name} ${cached.last_name}`.trim() : "";
  const name = cachedName || email || "You";

  return (
    <div className="mt-auto border-t border-line/60 px-2 pt-3">
      <div className="flex items-center gap-1">
        <SyncIndicator compact />
        <NavLink to="/notifications" aria-label="Notifications" className="icon-btn">
          <Bell className="h-[18px] w-[18px]" />
        </NavLink>
        {conflicts.length > 0 && (
          <NavLink
            to="/sync/conflicts"
            aria-label={`${conflicts.length} sync conflicts need attention`}
            className="icon-btn text-expense"
          >
            <CircleAlert aria-hidden="true" className="h-[18px] w-[18px]" />
          </NavLink>
        )}
        <div className="ml-auto">
          <Dropdown
            label="Account menu"
            trigger={<Avatar name={name} size={34} className="bg-sage text-primary shadow-card dark:bg-cream dark:text-primary-contrast"/>}
            items={[
              {
                id: "settings",
                label: "Settings",
                icon: <Settings aria-hidden="true" className="h-4 w-4" />,
                onSelect: () => navigate("/settings"),
              },
              {
                id: "conflicts",
                label: conflicts.length > 0 ? `Conflicts (${conflicts.length})` : "Conflicts",
                icon: <CircleAlert aria-hidden="true" className="h-4 w-4" />,
                onSelect: () => navigate("/sync/conflicts"),
              },
              {
                id: "logout",
                label: "Sign out",
                tone: "danger",
                icon: <LogOut aria-hidden="true" className="h-4 w-4" />,
                onSelect: () => {
                  void logout();
                  navigate("/login");
                },
              },
            ]}
          />
        </div>
      </div>
      <p className="mt-2 truncate px-1 text-[11px] text-muted">{email ?? name}</p>
    </div>
  );
}

function Sidebar() {
  return (
    <aside
      aria-label="Main"
      className="trove-sidebar fixed bottom-[14px] left-[14px] top-[14px] z-30 hidden w-[220px] flex-col px-4 py-4 lg:flex xl:w-[240px] dark:bottom-6 dark:left-6 dark:top-6"
    >
      <Brand />
      <BalanceCard />
      <div className="scroll-area -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1">
        <ul className="space-y-[2px]">
          {PRIMARY_SIDEBAR.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>
        <SidebarSection title="Planning" />
        <ul className="space-y-[3px]">
          {PLANNING_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>
        <SidebarSection title="Organise" />
        <ul className="space-y-[3px]">
          {ORGANISE_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
          <SidebarLink item={SETTINGS_ITEM} />
        </ul>
      </div>
      <SidebarFooter />
    </aside>
  );
}

/** Sidebar's first group has no heading. */
const PRIMARY_SIDEBAR: NavItem[] = [
  { to: "/overview", label: "Overview", icon: LayoutGrid },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight, matchNested: true },
  { to: "/accounts", label: "Accounts", icon: Wallet, matchNested: true },
  { to: "/budgets", label: "Budget", icon: PiggyBank, matchNested: true },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
];

/* --------------------------------------------------------------- mobile nav */

const MOBILE_ITEMS: { key: string; label: string; icon: LucideIcon; to?: string }[] = [
  { key: "home", label: "Home", icon: LayoutDashboard, to: "/overview" },
  { key: "activity", label: "Activity", icon: ArrowLeftRight, to: "/transactions" },
  { key: "budget", label: "Budget", icon: PiggyBank, to: "/budgets" },
  { key: "goals", label: "Goals", icon: Target, to: "/goals" },
  { key: "more", label: "More", icon: Ellipsis },
];

function mobileActiveKey(pathname: string): string {
  if (pathname === "/overview") return "home";
  if (pathname.startsWith("/transactions")) return "activity";
  if (pathname.startsWith("/budgets")) return "budget";
  if (pathname.startsWith("/goals")) return "goals";
  return "more";
}

function MobileBottomNav({
  pathname,
  onMore,
  moreOpen,
}: {
  pathname: string;
  onMore: () => void;
  moreOpen: boolean;
}) {
  const activeKey = mobileActiveKey(pathname);
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-[14px] bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-40 lg:hidden"
    >
      <div className="glass grid h-[70px] grid-cols-5 items-center rounded-full px-2">
        {MOBILE_ITEMS.map((item) => {
          const active = item.key === activeKey || (item.key === "more" && moreOpen);
          const Icon = item.icon;
          const body = (
            <>
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
            </>
          );
          const className = `flex h-[54px] flex-col items-center justify-center gap-1.5 rounded-full transition-[background-color,color,box-shadow,transform] duration-base ease-smooth active:scale-[0.96] ${
            active
              ? "bg-primary text-primary-contrast shadow-pill"
              : "text-muted hover:text-ink"
          }`;
          if (item.to) {
            return (
              <NavLink
                key={item.key}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {body}
              </NavLink>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              aria-expanded={moreOpen}
              aria-controls="more-sheet"
              onClick={onMore}
              className={className}
            >
              {body}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const MORE_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { to: "/accounts", label: "Accounts", icon: Wallet, matchNested: true },
      { to: "/statistics", label: "Statistics", icon: LayoutGrid },
    ],
  },
  {
    title: "Planning",
    items: [
      { to: "/debts", label: "Debts", icon: Landmark, matchNested: true },
      { to: "/credit-cards", label: "Credit cards", icon: CreditCard, matchNested: true },
      { to: "/recurring", label: "Recurring", icon: Repeat, matchNested: true },
      { to: "/installments", label: "Installments", icon: CalendarClock, matchNested: true },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Organise",
    items: [
      { to: "/categories", label: "Categories", icon: Tags, matchNested: true },
      { to: "/search", label: "Search", icon: Search },
      { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/sync/conflicts", label: "Sync conflicts", icon: CircleAlert },
      SETTINGS_ITEM,
    ],
  },
];

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open, onClose]);
  return (
    <Overlay open={open} onClose={onClose} title="More" variant="sheet" size="sm">
      <div id="more-sheet">
        {MORE_GROUPS.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {group.title}
            </p>
            <ul className="trove-card overflow-hidden p-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className="flex min-h-[50px] items-center gap-3 rounded-[16px] px-3 text-[15px] font-medium text-ink hover:bg-surface-sunken"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-surface-sunken text-primary">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted" />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

/* -------------------------------------------------------------------- shell */

/**
 * Replays a short fade/rise when the route changes without remounting the
 * route tree. Keying by pathname would remount Settings' shared layout and
 * reset its state, so this only toggles the animation class.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorBackgroundPath(pathname)) return;
    const element = ref.current;
    if (!element) return;
    element.classList.remove("animate-page-in");
    // Force a style flush so re-adding the class restarts the keyframes.
    element.getBoundingClientRect();
    element.classList.add("animate-page-in");
  }, [pathname]);

  return (
    <div ref={ref} className="animate-page-in">
      {children}
    </div>
  );
}

export interface AppShellProps {
  children: ReactNode;
  onQuickAdd: () => void;
}

function mobileTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/overview": "Overview",
    "/transactions": "Transactions",
    "/accounts": "Accounts",
    "/budgets": "Budget",
    "/statistics": "Statistics",
    "/goals": "Savings goals",
    "/debts": "Debts",
    "/credit-cards": "Credit cards",
    "/recurring": "Recurring",
    "/installments": "Installments",
    "/calendar": "Calendar",
    "/categories": "Categories",
    "/search": "Search",
    "/bookmarks": "Bookmarks",
    "/settings": "Settings",
    "/notifications": "Notifications",
  };
  const key = Object.keys(map).find((k) => pathname === k || pathname.startsWith(`${k}/`));
  return key ? map[key] : "Trove";
}

export function AppShell({ children, onQuickAdd }: AppShellProps) {
  const { pathname } = useLocation();
  const { email } = useAuth();
  const name = email || "You";
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-contrast"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="flex min-h-dvh min-w-0 flex-col lg:ml-[264px] xl:ml-[294px]">
        <header className="flex items-center justify-between gap-3 px-[18px] pt-4 sm:px-6 lg:hidden">
          <h1 className="truncate text-[18px] font-semibold text-primary">
            {mobileTitle(pathname)}
          </h1>
          <div className="flex items-center gap-2">
            <SyncIndicator compact />
            <NavLink to="/notifications" aria-label="Notifications" className="icon-btn">
              <Bell className="h-[18px] w-[18px]" />
            </NavLink>
            <NavLink to="/settings" aria-label="Profile">
              <Avatar name={name} size={32} className="bg-sage text-primary shadow-card dark:bg-cream dark:text-primary-contrast"/>
            </NavLink>
          </div>
        </header>
        <main
          id="main"
          className="trove-safe-bottom min-w-0 flex-1 px-[18px] pt-5 sm:px-6 lg:px-0 lg:pb-12 lg:pr-10 lg:pt-10"
        >
          <div className="mx-auto w-full max-w-[640px] lg:max-w-[1240px]">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </main>
      </div>

      <button
        type="button"
        onClick={onQuickAdd}
        aria-label="Add transaction"
        className="fixed right-4 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-primary-contrast shadow-[0_10px_26px_rgba(41,71,55,0.32)] transition-[transform,background-color,box-shadow] duration-base ease-smooth hover:bg-primary-hover active:scale-95 lg:hidden"
        style={{ bottom: "calc(106px + env(safe-area-inset-bottom, 0px))" }}
      >
        <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
      </button>

      <MobileBottomNav pathname={pathname} moreOpen={moreOpen} onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
