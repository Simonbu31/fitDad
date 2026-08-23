# Fit Dad 💪

A super simple workout tracker built for one person: my dad, starting his
3-month strength training plan.

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
