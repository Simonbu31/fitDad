# Fit Dad 💪

A super simple workout tracker built for one person: your dad, start his
3-month strength training plan right now.

**Live app:** https://simonbu31.github.io/fitDad/

## What it does

- **Start Workout** → walks through the plan's exercises one at a time
  (6 from the plan + a Bicep Curls finisher), with a quick warm-up
  checklist first. Choose Straight Sets or Superset mode.
- Log each set with big +/- steppers (weight in kg, reps) — pre-filled with
  what you lifted last time.
- Built-in rest timer (3 min for the big lifts, 90 sec for the rest) with a
  sound + vibration when it's done.
- Automatic personal-record detection — a set only counts as a PR if you've
  logged that exercise before, so your very first session doesn't trigger a
  false PR. Hitting one shows a confetti celebration and pings a phone
  notification.
- **Progress** page: current streak, a training-day calendar, PR list, and a
  weight-over-time chart for every exercise.
- Workout data is saved to the cloud (Supabase) so it survives across
  devices and browser resets.

## Stack

- React + TypeScript + Vite, Tailwind CSS
- Supabase (Postgres) for storage, no login — a single shared dataset since
  this is a single-user app
- [ntfy.sh](https://ntfy.sh) for push notifications, called directly from
  the browser
- Deployed to GitHub Pages

## Local development

```bash
cd app
npm install
npm run dev
```

## Deploying

```bash
cd app
npm run deploy
```

This builds the app and pushes `dist/` to the `gh-pages` branch, which
GitHub Pages serves from.

## The plan

`Papas Drei Monate Transformation.pdf` is the original training plan this
app is built around: 2 sessions/week, 6 exercises, same workout both days.

## App Store submission history

- **2026-09-04** — Submitted build 1.0 (2) for App Review.
- **2026-09-09** — Rejected under **Guideline 5.2.5 (Legal — Intellectual
  Property)**: the app icon was a direct render of Apple's own Color Emoji
  artwork (💪), which is copyrighted and confusingly similar to an Apple
  product. Apple's exact wording: "Imagery that is similar to Apple Emoji in
  one of the app icons."
- **2026-09-18** — Fix applied and resubmitted as build 1.0 (3):
  - Replaced the app icon (`AppIcon.appiconset`, `icon-192.png`,
    `icon-512.png`, `apple-touch-icon.png`) with original artwork — no
    Apple emoji imagery, full-bleed 1024×1024 with no baked-in corner
    rounding or alpha channel (iOS applies its own mask).
  - Dropped the same 💪 emoji from the in-app "Fit Dad" wordmark on the
    Home and Login screens, since it was used logo-style there too.
    Left ordinary mid-sentence emoji use (e.g. "nice work! 💪") alone —
    that's normal copy, not a logo/icon element.
  - Bumped `CURRENT_PROJECT_VERSION` to 3 in the Xcode project (Apple
    requires a higher build number than the last reviewed one).
  - Re-attached the new build in App Store Connect, answered the export
    compliance question (standard HTTPS encryption, no French-specific
    declaration needed), and resubmitted for review with a note pointing
    the reviewer at the 5.2.5 fix.
