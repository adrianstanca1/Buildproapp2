#!/bin/bash

# Configuration
# Configuration
SERVICE_NAME="buildpro-app"
REGION="us-central1" # Detected from your vercel.json rewrite

# Load variables from server/.env
if [ -f server/.env ]; then
    echo "Loading secrets from server/.env..."
    # Export variables from .env, ignoring comments
    export $(grep -v '^#' server/.env | xargs)
else
    echo "❌ server/.env not found! Please create it or set variables manually."
    exit 1
fi

# Use variables from environment (loaded above)
# SENDGRID_API_KEY, GEMINI_API_KEY, EMAIL_FROM, etc.

echo "========================================================"
echo "      BuildPro Cloud Secret Updater"
echo "========================================================"
echo "This script attempts to update secrets using local CLIs."
echo "Prerequisites: 'vercel' and 'gcloud' must be logged in."
echo ""

# 1. Update Vercel Secrets
echo "--- Updating Vercel (Frontend) ---"
if command -v vercel &> /dev/null; then
    echo "Updating VITE_SUPABASE_URL..."
    printf "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production 2>/dev/null || echo "Requesting manual input or skipping..."
    
    # Note: Vercel CLI interaction is complex to script fully non-interactively without known project ID linkage.
    # We will encourage manual setup if this simple pipe doesn't work.
    echo "⚠️  For Vercel, it is often more reliable to use the Dashboard: https://vercel.com/dashboard"
else
    echo "❌ 'vercel' CLI not found. Skipping Vercel updates."
fi

echo ""

# 2. Update Cloud Run Secrets
echo "--- Updating Google Cloud Run (Backend) ---"
if command -v gcloud &> /dev/null; then
    echo "Updating Service: $SERVICE_NAME in $REGION..."
    
    gcloud run services update $SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --update-env-vars "SENDGRID_API_KEY=$SENDGRID_API_KEY,GEMINI_API_KEY=$GEMINI_API_KEY,EMAIL_FROM=$EMAIL_FROM,SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET,DATABASE_URL=$DATABASE_URL"

    if [ $? -eq 0 ]; then
        echo "✅ Cloud Run secrets updated successfully!"
    else
        echo "❌ Failed to update Cloud Run. Ensure you are authenticated ('gcloud auth login') and the service name '$SERVICE_NAME' is correct."
    fi
else
    echo "❌ 'gcloud' CLI not found. Skipping Cloud Run updates."
fi

echo ""
echo "Done. If any steps failed, please verify permissions or use the manual guide in CLOUD_SETUP_GUIDE.md"
