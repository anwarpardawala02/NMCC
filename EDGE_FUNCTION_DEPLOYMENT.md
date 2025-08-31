# Edge Function Deployment Guide

This guide will walk you through the process of setting up and deploying your edge functions with service role access to fix the 403 RLS policy errors.

## Prerequisites

1. Supabase CLI installed and configured
2. Access to your Supabase project dashboard

## Step 1: Install Supabase CLI (if not already installed)

```powershell
# Install Supabase CLI for Windows
# Download from https://github.com/supabase/cli/releases
# Add the installation directory to your PATH environment variable
# If you've installed at C:\Users\anwar\supabase-cli\, you can use the full path:
# C:\Users\anwar\supabase-cli\supabase.exe
```

## Step 2: Login to Supabase CLI

```powershell
# Use the full path if needed
C:\Users\anwar\supabase-cli\supabase.exe login
```

Follow the prompts to log in with your Supabase account.

## Step 3: Set Your Service Role Key as an Environment Variable

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to "Project Settings" → "API"
4. Copy your "service_role" key
5. Set it as an environment variable:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

## Step 4: Run the Deployment Script

```powershell
# Navigate to your project directory
cd "path\to\northolt-manor-cc"

# Run the deployment script
.\deploy-edge-functions-with-service-role.ps1
```

The script will:
1. Check if the service role key is set
2. Find and deploy each edge function
3. Set the service role key as a secret for each function
4. Automatically detect your project reference

## Step 5: Verify the Deployment

```powershell
# List all deployed functions
C:\Users\anwar\supabase-cli\supabase.exe functions list

# Check secrets for a specific function
C:\Users\anwar\supabase-cli\supabase.exe secrets list --project-ref "your-project-ref"
```

Make sure each function shows `SERVICE_ROLE_KEY` in its secrets.

## Step 6: Test the Scoresheet Upload

1. Log in to your application as a fixture manager
2. Navigate to Admin → Scoresheets
3. Upload a scoresheet
4. Verify that it processes without 403 errors
5. Check that match details and player statistics are updated

## Troubleshooting

If you still encounter 403 errors:

1. View the edge function logs in the Supabase Dashboard:
   - Go to the Supabase Dashboard: https://supabase.com/dashboard
   - Select your project: zrhaeyktmyboeszpaqbo
   - Navigate to "Edge Functions" in the left sidebar
   - Click on the function name
   - Click on "Logs" to view the function execution logs
```

2. Check if the service role key is correctly set:
```powershell
C:\Users\anwar\supabase-cli\supabase.exe secrets list --project-ref "your-project-ref"
```

3. Make sure your edge functions are using the updated code with service role client.

4. For persistent RLS errors, see the detailed troubleshooting guide: [FIXING_RLS_ERRORS.md](./FIXING_RLS_ERRORS.md)

5. If you encounter Tesseract.js import errors:
   - The module import may need to be updated in the `process-scoresheet` function
   - Current working import for Deno/Supabase:
   ```typescript
   import * as TesseractJS from 'https://deno.land/x/tesseract/mod.ts'
   const Tesseract = TesseractJS
   ```

## Security Reminder

The service role key has admin privileges on your database. Never expose this key in client-side code or commit it to your repository. Always handle it securely as an environment variable or a secret.
