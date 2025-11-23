# Vercel Deployment & Database Guide

## Current Status
We have fixed the immediate crash issue by adding `sqlite3` to the dependencies. This allows the application to run on Vercel using a temporary SQLite database.

## ⚠️ Important Warning: Data Persistence
**The current SQLite setup is ephemeral.**
This means:
- **Data Loss**: Every time you redeploy or the server restarts (which happens automatically), **all new projects, tasks, and changes will be lost.**
- **Reset**: The database will revert to the initial seed data.

## Recommended: Permanent Fix (PostgreSQL)
To save your data permanently, you should connect to a hosted PostgreSQL database.

### Steps to Setup PostgreSQL:

1.  **Create a Database**:
    - Use a provider like **Vercel Postgres**, **Neon**, **Supabase**, or **Railway**.
    - Create a new project/database.

2.  **Get Connection String**:
    - Copy the connection URL (usually starts with `postgres://` or `postgresql://`).

3.  **Configure Vercel**:
    - Go to your Vercel Project Dashboard.
    - Navigate to **Settings** > **Environment Variables**.
    - Add a new variable:
        - **Key**: `DATABASE_URL`
        - **Value**: `[Your Connection String]`
    - Save.

4.  **Redeploy**:
    - Go to the **Deployments** tab in Vercel.
    - Redeploy the latest commit.

The application is already configured to automatically detect `DATABASE_URL` and switch from SQLite to PostgreSQL.

## Immediate Next Steps
1.  Run `npm install` locally to update your `package-lock.json`.
2.  Commit and push the changes:
    ```bash
    git add package.json package-lock.json
    git commit -m "Fix: Add sqlite3 for Vercel deployment"
    git push
    ```
