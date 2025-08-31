# Manual Steps for Updating Edge Functions

If you're having trouble with the automatic deployment script, follow these manual steps to update your edge functions.

## Step 1: Install Supabase CLI

If the `install-supabase-cli.ps1` script didn't work for you, visit the [Supabase CLI documentation](https://supabase.com/docs/guides/cli) for alternative installation methods.

## Step 2: Manual Deployment Through Supabase Dashboard

If CLI installation is problematic, you can manually update your edge functions through the Supabase Dashboard:

1. Navigate to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Edge Functions" in the sidebar
4. For each function (`process-scoresheet` and `save-scoresheet-data`):
   - Click on the function name
   - Click "Edit Code"
   - Make the changes to use service role keys as described below

### Code Change for `process-scoresheet`

Find this section in your code:

```typescript
// Create Supabase client with Auth context
const authHeader = req.headers.get('Authorization')
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
)
```

Replace it with:

```typescript
// Create Supabase client with Auth context for user checks
const authHeader = req.headers.get('Authorization')
const userClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
)

// Get user details to verify roles (but use service role for DB operations)
const { data: { user } } = await userClient.auth.getUser()

// Create a client with service role to bypass RLS for database operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SERVICE_ROLE_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
)
```

### Code Change for `save-scoresheet-data`

Find this section in your code:

```typescript
// Create Supabase client with Auth context
const authHeader = req.headers.get('Authorization')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
)
```

Replace it with:

```typescript
// Create Supabase client with Auth context for user checks
const authHeader = req.headers.get('Authorization')
const userClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
)

// Get user details to verify roles (but use service role for DB operations)
const { data: { user } } = await userClient.auth.getUser()

// Create a client with service role to bypass RLS for data processing
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SERVICE_ROLE_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
)
```

## Step 3: Add the Service Role Key Secret

After updating the code, you need to add the service role key as a secret:

1. In the Supabase Dashboard, go to "Settings" → "API"
2. Copy your "service_role" key
3. Go back to "Edge Functions"
4. For each function (`process-scoresheet` and `save-scoresheet-data`):
   - Click on the function name
   - Click the "Secrets" tab
   - Add a new secret with:
     - Name: `SERVICE_ROLE_KEY`
     - Value: Your copied service role key

## Step 4: Deploy the Updated Functions

1. For each function, after making changes:
   - Click "Save" to save your changes
   - Click "Deploy" to deploy the updated function

## Step 5: Test the Functions

1. Log in to your application as a fixture manager
2. Navigate to Admin → Scoresheets
3. Upload a scoresheet and process it
4. It should now work without 403 errors

## Important Security Note

Remember that the service role key has admin privileges on your database. Never expose this key in client-side code or commit it to your repository.
