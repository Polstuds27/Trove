/**
 * "Install Trove" — the PWA download section of the landing page.
 *
 * Behaviour is platform-aware: Chromium browsers get the native install prompt
 * (`beforeinstallprompt`, wired in `app/pwa`), iOS Safari has no such API so it
 * gets the Share → Add to Home Screen walkthrough, and everyone else gets the
 * browser-menu steps. Already-installed visitors just see confirmation.
 */
import { useState } from "react";
import { Check, Download, Monitor, Share, Smartphone } from "lucide-react";
import { Button, Mascot } from "../../components/ui";
import { promptInstall, useInstallState } from "./useInstall";

interface PlatformCopy {
  /** Short label for the visitor's platform. */
  label: string;
  icon: typeof Smartphone;
  steps: string[];
}

const PLATFORM: Record<"ios" | "android" | "desktop", PlatformCopy> = {
  ios: {
    label: "iPhone & iPad — Safari",
    icon: Smartphone,
    steps: [
      "Tap the Share button in the Safari toolbar.",
      'Scroll down and choose "Add to Home Screen".',
      'Tap "Add" — Trove appears on your home screen.',
    ],
  },
  android: {
    label: "Android — Chrome",
    icon: Smartphone,
    steps: [
      "Tap the ⋮ menu in the top-right corner.",
      'Choose "Install app" or "Add to Home screen".',
      "Confirm — Trove installs like any other app.",
    ],
  },
  desktop: {
    label: "Computer — Chrome, Edge, Brave",
    icon: Monitor,
    steps: [
      "Click the install icon at the right of the address bar.",
      'Or open the ⋮ menu and choose "Install Trove".',
      "Launch it from your dock, desktop or start menu.",
    ],
  },
};

const BENEFITS = [
  "Home-screen icon, opens like a native app",
  "Full-screen — no browser chrome",
  "Works with no connection, syncs later",
  "Updates automatically, no re-download",
];

export function InstallSection() {
  const { canPrompt, installed, platform } = useInstallState();
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const copy = PLATFORM[platform];

  async function install() {
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome === "dismissed") setHint("No problem — you can finish with the steps below.");
    if (outcome === "unavailable") setHint("This browser needs the manual steps below.");
  }

  return (
    <section id="install" className="scroll-mt-24">
      <div className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-6 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-center lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Get the app
            </p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-primary sm:text-[38px] lg:text-[44px]">
              Install Trove on your phone
            </h2>
            <p className="mt-4 max-w-[36rem] text-[14.5px] leading-6 text-muted">
              Trove is a Progressive Web App: it installs straight from the browser — no app store,
              no download page. You get a home-screen icon, full-screen windows, offline access and
              updates that roll out the moment they ship.
            </p>

            <ul className="mt-7 space-y-2.5">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-light text-primary dark:bg-primary-soft"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[12px] text-muted">
              Free, on every platform you own
              <span className="mx-1.5 text-faint">·</span>
              Detected: {copy.label}
            </p>
          </div>

          <div className="relative">
            <Mascot
              state="landingInstall"
              size={150}
              className="pointer-events-none absolute -bottom-2 -left-32 hidden lg:block"
            />

            <div className="rounded-[28px] border border-line/50 bg-surface p-6 shadow-card">
              {installed ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-income-soft">
                    <Check aria-hidden="true" className="h-6 w-6 text-income" />
                  </span>
                  <p className="text-[15px] font-semibold text-ink">Trove is installed</p>
                  <p className="text-[12.5px] leading-5 text-muted">
                    You already have it on this device — open it from your home screen or dock.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    block
                    loading={busy}
                    icon={<Download aria-hidden="true" className="h-4 w-4" />}
                    onClick={() => void install()}
                  >
                    Install Trove
                  </Button>
                  {hint && <p className="mt-2 text-center text-[11.5px] text-muted">{hint}</p>}

                  <div className="mt-5 border-t border-line/70 pt-4">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                      <copy.icon aria-hidden="true" className="h-4 w-4 text-primary" />
                      {canPrompt ? "Or add it manually" : "Add it to your home screen"}
                    </p>
                    <ol className="mt-3 space-y-2.5">
                      {copy.steps.map((step, index) => (
                        <li key={step} className="flex gap-2.5 text-[12px] leading-[1.55] text-muted">
                          <span
                            aria-hidden="true"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[10.5px] font-semibold text-primary"
                          >
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
                      <Share aria-hidden="true" className="h-3.5 w-3.5" />
                      {platform === "desktop"
                        ? 'Look for "Install Trove" or "Install this page as an app".'
                        : "The Share button is the square with an arrow."}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
