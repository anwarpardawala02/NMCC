# Script to deploy the send-reset-email edge function
# Run this script from the project root to deploy the function

# Check if logged in to Supabase CLI
echo "Checking Supabase login status..."
$loginCheck = npx supabase projects list 2>&1
if ($loginCheck -like "*Access token not provided*") {
    echo "You need to login to Supabase first. Please provide your access token."
    echo "You can generate an access token at https://app.supabase.com/account/tokens"
    $accessToken = Read-Host "Enter your Supabase access token"
    
    # Login with the provided token
    echo "Logging in to Supabase..."
    npx supabase login $accessToken
    
    if ($LASTEXITCODE -ne 0) {
        echo "Failed to login to Supabase. Please check your access token and try again."
        exit 1
    }
}

# Set environment variables for the edge function
echo "Setting environment variables for the edge function..."
npx supabase secrets set RESEND_API_KEY="re_WXVNmEdT_JGVRdntn4uZaYDpCAYJbRWj9"
npx supabase secrets set RESEND_REGISTERED_EMAIL="anwar121317@gmail.com"
npx supabase secrets set ENVIRONMENT="production" # Production mode with proper auth checking

# Deploy the edge function
echo "Deploying send-reset-email edge function..."
npx supabase functions deploy send-reset-email

echo "Deployment complete!"
