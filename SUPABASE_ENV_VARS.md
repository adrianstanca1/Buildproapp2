Required Supabase environment variables

Server (required):
- SUPABASE_URL: https://<project>.supabase.co
- SUPABASE_SERVICE_ROLE_KEY: service_role key (keep secret; required for server admin operations)
- DATABASE_URL: production database connection string

Browser / Frontend (required at build/runtime):
- VITE_SUPABASE_URL: same as SUPABASE_URL
- VITE_SUPABASE_ANON_KEY: public anon key (safe for client-side use)

Recommendations
- Do NOT commit secrets to the repo. Use your CI / secrets manager to inject values at build and runtime.
- Rebuild frontend artifacts in CI with the proper `VITE_*` env vars; do not check `dist/` into source control.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` regularly and update CI secrets.
- For local development, put sensitive keys into a local `.env` file and add `.env*` to `.gitignore`.

CI example (Cloud Build / GitHub Actions):
- Configure secrets in the provider (e.g. GitHub Secrets).
- Pass secrets as env vars to the build step, avoid embedding them into committed files.

Server safety
- Server code should use `getSupabaseAdmin()` / `supabaseAdmin` from `server/utils/supabase.ts`.
- The server will fail-fast on startup if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing (production).

If you want, I can also add a CI example workflow file snippet showing secret injection and a small checklist for rotation and audit steps.
