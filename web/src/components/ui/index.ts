/**
 * Design-system barrel.
 *
 * Feature code imports from `@/components/ui` only - components never reach into
 * each other's files, which keeps styling decisions in one place.
 */
export { Button, IconButton, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
export {
  Field,
  Input,
  Select,
  Textarea,
  SearchInput,
  type InputProps,
  type SelectProps,
  type TextareaProps,
  type SearchInputProps,
} from "./Input";
export { Overlay, ConfirmOverlay, type OverlayProps } from "./Overlay";
export {
  Card,
  CardHeader,
  Stat,
  Badge,
  ProgressBar,
  Divider,
  Avatar,
  AmountDelta,
  LinkButton,
  type BadgeTone,
} from "./Primitives";
export {
  EmptyState,
  ErrorState,
  Alert,
  Skeleton,
  SkeletonText,
  SkeletonRows,
  SkeletonStats,
  DetailSkeleton,
  LoadingLabel,
  type ErrorKind,
} from "./Feedback";
export { Mascot, type MascotPose } from "./Mascot";
export { MascotTipCard } from "./MascotTipCard";
export {
  GlassPanel,
  SurfaceCard,
  Pill,
  PillLink,
  Toggle,
  StatCard,
  SectionHeading,
  ListRow,
  Avatar as TroveAvatar,
  StatusBadge,
  DueBadge,
  StatusDot,
  DetailLine,
  MascotPanel,
  MascotSpot,
  tintForName,
} from "./Trove";
export {
  AmountInput,
  Tabs,
  SegmentedControl,
  Dropdown,
  OptionGrid,
  Collapsible,
  type TabItem,
  type SegmentOption,
  type DropdownItem,
} from "./Controls";
export { ToastProvider, useToast, type ToastTone } from "./Toast";
export { Spinner, PageLoader } from "./Spinner";
export { MoneyValue, type MoneyValueProps, type MoneyTone } from "./MoneyValue";
export { ErrorBoundary } from "./ErrorBoundary";
export {
  ChartFrame,
  ChartLegend,
  BarChart,
  LineChart,
  DonutChart,
  RankedBars,
  Sparkline,
  type SeriesPoint,
  type Slice,
} from "./Charts";
export { ActivityHeatmap, type HeatDay } from "./ActivityHeatmap";
export { ProgressRing } from "./ProgressRing";
export { BreakdownBar, type BreakdownItem } from "./BreakdownBar";
export { OtpInput } from "./OtpInput";
export { KpiCard } from "./KpiCard";
export { DatePicker, Calendar, parseDateKey, type DatePickerProps } from "./DatePicker";
export { TimePicker } from "./TimePicker";
export { FileDrop } from "./FileDrop";
export { GlassNavbar, type GlassNavItem } from "./GlassNavbar";
export { EarningsCard, type EarningsPeriod, type EarningsSource } from "./EarningsCard";
export { WalletCard, walletThemeFor, type WalletTheme } from "./WalletCard";
export { PageHeader, BackLink, PeriodStepper, DetailRow } from "./PageHeader";
