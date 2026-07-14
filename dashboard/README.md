# Dashboard

Web dashboard for the Smart Aeration System.

This app reads live telemetry from Firebase Realtime Database and visualizes:

- Current water temperature
- Predicted near-future temperature
- Temperature slope trend
- Latest activity logs

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Firebase Realtime Database SDK
- Tailwind CSS 4

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create .env.local in this folder:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

3. Start development server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Data Path

The dashboard listens to:

- devices/esp32_01/sensors
- devices/esp32_01/logs

## Notes

- This dashboard reflects the final system architecture that relies on cloud telemetry.
- OLED output existed in earlier firmware prototypes, but it is not part of the final deployed workflow.
