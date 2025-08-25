# Script to deploy the send-reset-email edge function
# with Invoke-Key authorization option (simpler for testing)

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


# Set Gmail SMTP environment variables for the edge function
echo "Setting Gmail SMTP environment variables for the edge function..."
npx supabase secrets set GMAIL_USER="nmcc5253@gmail.com"
npx supabase secrets set GMAIL_PASS="zymy pugm molw dooi"

# Deploy the edge function with invoke-key option for testing
echo "Deploying send-reset-email edge function with invoke-key option..."
npx supabase functions deploy send-reset-email --no-verify-jwt

echo "Deployment complete!"
