/**
 * Calendar.
 *
 * The month grid shows recorded transactions alongside what's still owed —
 * recurring occurrences, installment parts, debt due dates and goal deadlines —
 * all projected locally, so a month ahead is visible offline (§19). Selecting a
 * day replaces the coming-up list with that day's entries.
 */
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CreditCard, Landmark, Plus, Repeat, Target } from "lucide-react";
import {
  Button,
  IconButton,
  LinkButton,
  MascotTipCard,
  PageHeader,
  SurfaceCard,
} from "../../components/ui";
import { addDays, formatDate, formatMoney, isToday, toDate, toDateKey } from "../../design/format";
import { calendarGrid } from "../analytics/period";
import { calendarEvents, type CalendarEvent } from "../analytics/engine";
import { useLocalData } from "../analytics/useLocalData";
import { usePreferences } from "../settings/preferences";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KIND_ICON: Record<CalendarEvent["kind"], typeof Repeat> = {
  transaction: CalendarIcon,
  recurring: Repeat,
  installment: CreditCard,
  debt: Landmark,
  goal: Target,
};

/** Spec palette: forest, sage, sand, terracotta, warm gray by event type. */
const KIND_DOT: Record<CalendarEvent["kind"], string> = {
  transaction: "bg-primary",
  recurring: "bg-accent",
  installment: "bg-sand",
  debt: "bg-terracotta",
  goal: "bg-faint",
};

export function CalendarPage() {
  const { lookups } = useLocalData();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const monthKey = params.get("month") ?? toDateKey(new Date()).slice(0, 7);
  const selectedKey = params.get("day");

  const monthAnchor = useMemo(() => new Date(`${monthKey}-01T12:00:00`), [monthKey]);
  const weekStartsOn = preferences.weekStartsOn ?? 1;
  const cells = useMemo(() => calendarGrid(monthAnchor, 1, weekStartsOn), [monthAnchor, weekStartsOn]);

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => WEEKDAY_NAMES[(weekStartsOn + i) % 7]),
    [weekStartsOn],
  );

  const events = useMemo(() => {
    if (cells.length === 0) return new Map<string, CalendarEvent[]>();
    return calendarEvents(lookups, cells[0], addDays(cells[cells.length - 1], 1), {
      horizonDays: 0,
    });
  }, [lookups, cells]);

  const selected = useMemo(
    () => (selectedKey ? (events.get(selectedKey) ?? []) : []),
    [events, selectedKey],
  );

  const comingUp = useMemo(() => {
    if (selectedKey) return selected;
    const todayKey = toDateKey(new Date());
    return [...events.values()]
      .flat()
      .filter((event) => event.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [events, selectedKey, selected]);

  function goMonth(delta: number) {
    const next = new Date(monthAnchor);
    next.setMonth(next.getMonth() + delta);
    const key = `${next.getFullYear()}-${`${next.getMonth() + 1}`.padStart(2, "0")}`;
    const nextParams = new URLSearchParams(params);
    nextParams.set("month", key);
    nextParams.delete("day");
    setParams(nextParams, { replace: true });
  }

  function goToday() {
    const nextParams = new URLSearchParams(params);
    nextParams.set("month", toDateKey(new Date()).slice(0, 7));
    nextParams.delete("day");
    setParams(nextParams, { replace: true });
  }

  function selectDay(key: string) {
    const nextParams = new URLSearchParams(params);
    if (selectedKey === key) nextParams.delete("day");
    else nextParams.set("day", key);
    setParams(nextParams, { replace: true });
  }

  const monthLabel = monthAnchor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const currentMonth =
    monthKey === toDateKey(new Date()).slice(0, 7);

  return (
    <div className="space-y-4 lg:space-y-[18px]">
      <PageHeader title="Calendar" subtitle="Due dates and paydays" />

      <div className="grid gap-[17px] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        <SurfaceCard className="p-3.5 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink sm:text-[21px]">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1">
              {!currentMonth && (
                <button
                  type="button"
                  onClick={goToday}
                  className="mr-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-primary transition-colors hover:bg-surface-sunken"
                >
                  Today
                </button>
              )}
              <IconButton label="Previous month" size="sm" onClick={() => goMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <IconButton label="Next month" size="sm" onClick={() => goMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {weekdays.map((day) => (
              <div
                key={day}
                className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[10.5px]"
              >
                {day}
              </div>
            ))}

            {cells.map((date) => {
              const key = toDateKey(date);
              const dayEvents = events.get(key) ?? [];
              const inMonth = date.getMonth() === monthAnchor.getMonth();
              const today = isToday(date);
              const active = selectedKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(key)}
                  aria-pressed={active}
                  aria-current={today ? "date" : undefined}
                  aria-label={`${date.toDateString()}, ${dayEvents.length} entries`}
                  className={`relative flex min-h-[48px] flex-col items-start gap-1 rounded-[12px] border p-1 text-left transition-colors sm:min-h-[64px] sm:rounded-[14px] sm:p-2 ${
                    active
                      ? "border-primary/70 bg-primary-soft ring-2 ring-inset ring-primary/70"
                      : today
                        ? "border-primary/55 bg-sage-light dark:bg-primary-soft"
                        : "border-transparent hover:bg-surface-sunken sm:border-line/70"
                  } ${inMonth || active ? "" : "opacity-35"}`}
                >
                  <span
                    className={`text-[11.5px] leading-none sm:text-[12px] ${
                      active || today ? "font-bold text-primary" : inMonth ? "font-medium text-ink-soft" : "text-muted"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  <span className="mt-auto flex flex-wrap items-center gap-[3px]">
                    {dayEvents.slice(0, 4).map((event) => (
                      <span
                        key={event.key}
                        aria-hidden="true"
                        className={`h-[5px] w-[5px] rounded-full ${KIND_DOT[event.kind]}`}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] leading-none text-faint">+{dayEvents.length - 4}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-[10.5px] text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Transactions</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Recurring</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sand" /> Installments</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-terracotta" /> Debts</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-faint" /> Goals</span>
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-line/70 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-semibold leading-6 text-ink">
                  {selectedKey
                    ? toDate(selectedKey).toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    : "Coming up"}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {selectedKey
                    ? `${selected.length} ${selected.length === 1 ? "entry" : "entries"} on this day`
                    : "Bills, paydays and installments ahead"}
                </p>
              </div>
              {selectedKey ? (
                <button
                  type="button"
                  onClick={() => selectDay(selectedKey)}
                  className="shrink-0 text-[11.5px] font-semibold text-primary hover:underline"
                >
                  Show upcoming
                </button>
              ) : (
                <span className="shrink-0 text-[11.5px] text-muted">This month</span>
              )}
            </div>

            {comingUp.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] font-medium text-ink">
                  {selectedKey ? "Nothing on this day" : "Nothing coming up"}
                </p>
                <p className="mx-auto mt-1 max-w-[26ch] text-[12px] leading-5 text-muted">
                  {selectedKey
                    ? "Add a transaction, or switch on a recurring rule and its occurrences show up here."
                    : "Recorded transactions and projected bills appear here as the month fills in."}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => navigate("/transactions/new")}
                >
                  Add an entry
                </Button>
              </div>
            ) : (
              <ul
                aria-label="Calendar summary entries"
                tabIndex={0}
                className="scroll-area trove-hairline-list max-h-[360px] overflow-y-auto overscroll-contain px-5"
              >
                {comingUp.map((event) => {
                  const Icon = KIND_ICON[event.kind];
                  const content = (
                    <>
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-light dark:bg-primary-soft"
                      >
                        <span className={`h-2 w-2 rounded-full ${KIND_DOT[event.kind]}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-ink">
                            {event.title}
                          </span>
                          <Icon aria-hidden="true" className="h-3 w-3 shrink-0 text-faint" />
                        </span>
                        <span className="mt-0.5 block text-[11.5px] text-muted">
                          {formatDate(event.date, "medium")}
                          <span className="px-1 text-faint">·</span>
                          <span className="capitalize">{event.kind}</span>
                        </span>
                      </span>
                      <span
                        className={`tabular shrink-0 text-[13px] font-semibold ${
                          event.tone === "income"
                            ? "text-income"
                            : event.tone === "expense"
                              ? "text-expense"
                              : "text-ink"
                        }`}
                      >
                        {event.tone === "income" ? "+" : event.tone === "expense" ? "−" : ""}
                        {formatMoney(event.amount, event.currency)}
                      </span>
                    </>
                  );

                  return (
                    <li key={event.key}>
                      {event.transactionId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/transactions/${event.transactionId}`)}
                          className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-primary"
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 py-3">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-line/70 px-5 py-3">
              <LinkButton to="/transactions/new" className="gap-1 text-[12px]">
                <Plus className="h-3.5 w-3.5" /> Add entry
              </LinkButton>
              <LinkButton to="/recurring" className="text-[12px]">
                Recurring rules
              </LinkButton>
            </div>
          </SurfaceCard>

          <MascotTipCard
            title="Quick tip"
            lines={[
              "Plan ahead — recurring rules and due dates show up here before they happen.",
              "Tap a day to see everything scheduled for it.",
            ]}
            mascotState="calendar"
            storageKey="trove_calendar_tip_dismissed"
          />
        </div>
      </div>
    </div>
  );
}
