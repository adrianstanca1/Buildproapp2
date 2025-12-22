# Deployment Guide

## Overview
This repository uses **GitHub Actions** for automated deployments.
Any push to the `main` branch will automatically build and deploy the application.

### Environments
- **Backend**: Google Cloud Run (Service: `buildpro-app`)
- **Frontend**: Vercel (Project: `buildproapp-gamma`)
- **Database**: Supabase PostgreSQL

## 🚀 How to Deploy

### Automatic Deployment (Recommended)
Simply push your changes to the `main` branch:
```bash
git checkout main
git pull
git merge feature-branch
git push origin main
```
This triggers the `.github/workflows/deploy-backend.yml` workflow.

### Manual Deployment (Fallback)
If CI/CD fails, you can deploy manually from your local machine:

1. **Deploy Backend**:
   ```bash
   gcloud builds submit --tag gcr.io/gen-lang-client-0994038290/buildpro-app .
   gcloud run deploy buildpro-app --image gcr.io/gen-lang-client-0994038290/buildpro-app --platform managed --region us-central1
   ```

2. **Deploy Frontend**:
   ```bash
   vercel --prod
   ```

## 🔑 Secrets & Configuration
The deployment pipeline relies on the following GitHub Secrets:
- `GCP_PROJECT_ID`: `gen-lang-client-0994038290`
- `GCP_SA_KEY`: (Service Account JSON Key)
- `VITE_SUPABASE_URL`: (Real Supabase URL)
- `VITE_SUPABASE_ANON_KEY`: (Real Supabase Anon Key)

## 🐛 Troubleshooting
- **Build failures**: Check the "Actions" tab in GitHub.
- **Runtime errors**: Check Google Cloud Run logs using:
  ```bash
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=buildpro-app" --limit 50
  ```
