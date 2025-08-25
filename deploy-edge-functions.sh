#!/bin/bash
# Script to deploy the send-reset-email edge function
# Run this script from the project root to deploy the function

# Check if logged in to Supabase CLI
echo "Checking Supabase login status..."
if npx supabase projects list 2>&1 | grep -q "Access token not provided"; then
    echo "You need to login to Supabase first. Please provide your access token."
    echo "You can generate an access token at https://app.supabase.com/account/tokens"
    read -p "Enter your Supabase access token: " access_token
    
    # Login with the provided token
    echo "Logging in to Supabase..."
    npx supabase login $access_token
    
    if [ $? -ne 0 ]; then
        echo "Failed to login to Supabase. Please check your access token and try again."
        exit 1
    fi
fi

# Set Resend API key in Supabase environment variables
echo "Setting Resend API key for the edge function..."
# Use proper format for setting secrets
npx supabase secrets set RESEND_API_KEY="re_WXVNmEdT_JGVRdntn4uZaYDpCAYJbRWj9"

# Deploy the edge function
echo "Deploying send-reset-email edge function..."
npx supabase functions deploy send-reset-email

echo "Deployment complete!"
