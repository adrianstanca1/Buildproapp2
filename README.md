<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18EvhmtP0mV-nrIowWLMM2HH-1JidhEMv

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase Integration

This application supports Supabase for Authentication, Database (PostgreSQL), Realtime Chat, and File Storage.

To set up Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Follow the instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to configure your database and storage.
3. Set the required environment variables in `.env` (locally) or your deployment platform.

## Deployment

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for deployment instructions.
