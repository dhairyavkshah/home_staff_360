# Home Staff 360 Build Workflow

Home Staff 360 is packaged as a local, offline Capacitor application. Android
builds use the web files bundled in `dist/public`; they do not load a hosted
server.

## Validate

```bash
npm run check
npm run build
```

## Development Android build

Use `capacitor.config.dev.ts` when preparing the development app. It uses the
development application ID and enables WebView debugging.

## Production Android build

Use `capacitor.config.prod.ts` when preparing the release app. It uses the
production application ID and disables WebView debugging.

After selecting the intended configuration:

```bash
npm run build
npx cap sync android
```

Then build the Android package using the project's existing Gradle or GitHub
Actions workflow.

## Release checks

- Confirm the Android version and version code were incremented together.
- Confirm no `server.url` exists in the selected Capacitor configuration.
- Test first launch and onboarding with airplane mode enabled.
- Test profile editing, local records, backup, restore, and reminders offline.
- Confirm no phone sign-in, OTP, collaboration, subscription, or advertising
  UI is present.