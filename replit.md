# Home Staff 360

Home Staff 360 is a local-first React/Vite + Capacitor application for household
staff and service-business management.

## Running on Replit

- Use the **Start application** workflow, which runs `npm run dev` on port 5000.
- The Express process only serves the Vite development app or built static
  files. It has no application API, authentication service, realtime service,
  or database connection.
- Run `npm run check` for TypeScript validation and `npm run build` for a
  production build.

## Offline architecture

- User profiles and operational records are stored locally on the device.
- Android builds load the bundled `dist/public` application and do not point to
  a hosted server.
- No phone sign-in, OTP, SMS, server account, collaboration, chat, remote sync,
  subscription, advertising, maintenance service, or admin panel is used.
- Country defaults come from the device locale and can be changed manually.
- Profile photos, backup/restore, exports, and reminders use local device
  capabilities.

## Mobile builds

- `capacitor.config.dev.ts` uses the development app ID and enables WebView
  debugging.
- `capacitor.config.prod.ts` uses the production app ID and disables WebView
  debugging.
- Both configurations package the local web application and work without a
  network connection.

## UI

- React 18, TypeScript, Vite, Tailwind CSS, Radix UI, and Capacitor.
- Light and dark themes with Android safe-area support.
- Home and Staff operating modes remain available.