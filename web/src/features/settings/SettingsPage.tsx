/**
 * Settings shell.
 *
 * `/settings` is the profile-and-preferences overview from the redesign spec.
 * Every sub-route keeps the section rail so changing one setting never loses
 * the way back, while the index shows the summary cards directly.
 */
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  CircleDollarSign,
  Coins,
  Database,
  Info,
  Monitor,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  UserRound,
} from "lucide-react";
import { PageHeader } from "../../components/ui";

interface Section {
  to: string;
  label: string;
  hint: string;
  icon: typeof UserRound;
  end?: boolean;
}

const SECTIONS: Section[] = [
  { to: "/settings", label: "Overview", hint: "Profile, preferences and security", icon: SlidersHorizontal, end: true },
  { to: "/settings/profile", label: "Profile", hint: "Name, email, currency", icon: UserRound },
  { to: "/settings/security", label: "Security", hint: "Password and two-factor", icon: ShieldCheck },
  { to: "/settings/appearance", label: "Appearance", hint: "Theme and display", icon: Palette },
  { to: "/settings/notifications", label: "Notifications", hint: "What alerts you get", icon: Bell },
  { to: "/settings/currency", label: "Currency", hint: "Base currency and rates", icon: Coins },
  { to: "/settings/financial", label: "Financial", hint: "Month start, formatting", icon: CircleDollarSign },
  { to: "/settings/sync", label: "Sync", hint: "Queue, conflicts, status", icon: Monitor },
  { to: "/settings/data", label: "Data", hint: "Export, import, reset", icon: Database },
  { to: "/settings/devices", label: "Devices", hint: "Sessions on your account", icon: Smartphone },
  { to: "/settings/about", label: "About", hint: "Version and licences", icon: Info },
];

export function SettingsPage() {
  const { pathname } = useLocation();
  const isOverview = pathname === "/settings";
  const current = SECTIONS.find((section) => section.to === pathname) ?? SECTIONS[0];

  if (isOverview) {
    return <Outlet />;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle={current.hint} />

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="scroll-area -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-[14px] px-3 py-2 text-[13px] font-medium transition-colors lg:w-full ${
                  isActive
                    ? "bg-primary text-primary-contrast shadow-pill"
                    : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                }`
              }
            >
              <section.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{section.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
