# Tradex v2

Premium Next.js dashboard for intraday Nifty options modeling.

## Local run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Required env

- `NEXT_PUBLIC_MARKET_DATA_FUNCTION_URL`: Firebase Cloud Function endpoint (`getMarketData`).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Set `NEXT_PUBLIC_MARKET_DATA_FUNCTION_URL` in Project Settings → Environment Variables.
4. Deploy.

The app is built with Next.js App Router and is ready for Vercel default settings.
