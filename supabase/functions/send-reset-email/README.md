# Password Reset Email Edge Function

This Edge Function handles sending password reset emails for the Northolt Manor Cricket Club application.

## Prerequisites

1. Supabase CLI installed
2. Supabase account with access token
3. Resend API account (free tier)

## Deployment Instructions

### 1. Generate a Supabase Access Token

1. Visit https://app.supabase.com/account/tokens
2. Click "Generate New Token"
3. Give it a name like "NMCC Edge Functions"
4. Copy the generated token

### 2. Deploy the Edge Function

#### Windows
```powershell
.\deploy-edge-functions.ps1
```

#### macOS/Linux
```bash
chmod +x ./deploy-edge-functions.sh
./deploy-edge-functions.sh
```

The script will:
1. Check if you're logged in to Supabase CLI
2. Prompt for your access token if needed
3. Set the Resend API key as a secret in your Supabase environment
4. Deploy the Edge Function

### 3. Testing the Deployment

To verify the Edge Function is working:

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Check that "send-reset-email" is listed and active
4. Test the password reset flow in the application

## Configuration

The Edge Function uses the following environment variables:

- `RESEND_API_KEY`: API key for the Resend email service

## Security Notes

For production environments:
- Consider using a separate email domain specifically for your application
- Regularly rotate your API keys
- Monitor usage to detect any unusual patterns
