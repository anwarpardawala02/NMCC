# Fixing 403 RLS Errors in Edge Functions

If you're still encountering 403 "new row violates row-level security policy" errors with your edge functions, follow these steps:

## 1. Verify Service Role Key in Environment Variables

First, make sure your edge functions have the service role key set as an environment variable:

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard/project/zrhaeyktmyboeszpaqbo/functions)
2. Click on each function (process-scoresheet and save-scoresheet-data)
3. Go to the "Settings" tab
4. Check the Environment Variables section
5. Make sure there's a variable called `SERVICE_ROLE_KEY` with your service role key value

If not, add it manually:

1. Click "Add Variable"
2. For Name, enter: `SERVICE_ROLE_KEY`
3. For Value, paste your service role key
4. Save the changes

## 2. Apply RLS Policies

Run the migration SQL file to ensure fixture managers have proper permissions:

```powershell
# Change directory to your project
cd "C:\New folder\Personal\Learning\NMCC\northolt-manor-cc"

# Connect to your database using psql or the Supabase dashboard SQL editor
# Copy and paste the contents of:
# supabase/migrations/20250828000000_update_rls_for_fixture_managers.sql
```

Alternatively, run the SQL directly in the Supabase Dashboard:

1. Go to [SQL Editor](https://supabase.com/dashboard/project/zrhaeyktmyboeszpaqbo/sql)
2. Open the file `supabase/migrations/20250828000000_update_rls_for_fixture_managers.sql` 
3. Copy its contents
4. Paste into the SQL Editor
5. Click "Run"

## 3. Verify Code Uses SERVICE_ROLE_KEY

Check that your edge function code is using the correct environment variable:

```typescript
// Create a client with service role to bypass RLS for database operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SERVICE_ROLE_KEY') ?? '', // This should be SERVICE_ROLE_KEY, not SUPABASE_SERVICE_ROLE_KEY
  { global: { headers: { Authorization: authHeader } } }
)
```

## 4. Redeploy Functions

After making any changes:

```powershell
# Set environment variable
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"

# Deploy functions
.\deploy-edge-functions-with-service-role.ps1
```

## 5. Check Function Logs

After attempting to upload a scoresheet, check the logs:

1. Go to the [Functions section](https://supabase.com/dashboard/project/zrhaeyktmyboeszpaqbo/functions)
2. Click on the function name
3. Click "Logs" to see detailed error messages

## 6. Try Direct SQL Access

As a last resort, you can temporarily disable RLS for testing:

```sql
-- WARNING: Only do this temporarily for testing
ALTER TABLE public.match_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable after testing
ALTER TABLE public.match_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;
```

## Debugging Checklist

- [ ] Service role key is set correctly in environment variables
- [ ] RLS policies are created for fixture managers
- [ ] Code is using the correct environment variable name
- [ ] User making the request has fixture_manager role
- [ ] Supabase client in edge functions is created with service role key
