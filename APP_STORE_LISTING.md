# App Store Connect — listing draft

Paste these into the corresponding fields when setting up the app record.

## App name
Fit Dad

## Subtitle (30 chars max)
Simple workout tracker

## Category
Primary: Health & Fitness

## Description

Fit Dad is the simplest way to track a strength training plan — built for
someone just starting out at the gym, not a power user.

- Start a workout and follow along, one exercise at a time
- Log weight and reps with big, easy-to-tap steppers
- Built-in rest timer between sets, with a sound when it's done
- Optional Superset mode for a faster, more intense session
- See your streak, personal records, and progress charts for every exercise
- Get a push notification of your own when you finish a workout or hit a PR

No clutter, no ads, no subscriptions — just a clean way to see yourself get
stronger week over week.

## Keywords (100 chars max, comma-separated, no spaces after commas)
workout,gym,strength,training,tracker,fitness,exercise,reps,sets,progress

## Support URL
https://github.com/Simonbu31/fitDad/issues

## Marketing URL (optional)
https://simonbu31.github.io/fitDad/

## Privacy Policy URL
https://simonbu31.github.io/fitDad/privacy.html

## Copyright
2026 Simon Burkhardt

## Age Rating questionnaire
Answer "None" / "No" to everything — no objectionable content, no
user-generated content shared with others, no gambling, etc. This app
should land at 4+.

## App Privacy ("nutrition label") — Data Types Collected

| Data type | Collected? | Linked to identity? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Email Address | Yes | Yes | No | App Functionality (account/sign-in) |
| Other User Content (workout logs: exercise, weight, reps, dates) | Yes | Yes | No | App Functionality |

Everything else (Contacts, Location, Financial Info, Health & Fitness data
via HealthKit, Identifiers, Usage Data, Diagnostics, etc.) → **Not Collected**.

No data is used for tracking (per Apple's definition — no cross-app/cross-site
tracking, no data broker sharing, no third-party advertising).

## App Review — Review Notes

```
Sign-in is passwordless (magic link sent to the user's email) — since
reviewers won't have access to an inbox, please use this fixed test
account instead:

Email: burkhardt.simon+applereview@gmx.de
Password: SaAHBdEb408Xvz9RWK9s

On the sign-in screen, tap "Have a password? Use it instead" and sign in
with the credentials above.

This account starts with no data. Feel free to tap "Start Workout" to try
the full flow: warm-up checklist → log a few sets → rest timer → finish
workout → view progress.

The app also supports account deletion in-app (Settings → Delete account).
```

## Version notes (What's New — first submission)
Initial release.

## Screenshots needed
Capture from Simulator (iPhone 15 Pro or similar, 6.7"/6.9" display
required size) at minimum:
1. Home screen (Start Workout button, streak)
2. Active workout screen mid-set (Stepper + Log Set)
3. Rest timer overlay
4. Progress screen (streak calendar + charts)
5. PR celebration screen (optional but eye-catching)

Use `xcrun simctl io <device> screenshot <path>.png` on the booted
simulator, same approach used during development.
