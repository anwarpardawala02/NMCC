# Supabase Edge Functions for NMCC

This document provides important information about the Supabase edge functions used in this application, particularly focusing on security and RLS policies.

## Edge Functions

### 1. process-scoresheet

This function handles OCR processing of uploaded scoresheet images:
- Takes a file path from storage
- Uses Tesseract.js for OCR
- Extracts match information, batting stats, and bowling stats
- Stores raw OCR data and processed results in the `scoresheets` table

### 2. save-scoresheet-data

This function saves processed scoresheet data to various tables:
- Creates or finds opponent teams and players
- Creates match_details entries for each player performance
- Updates player_statistics for seasonal aggregation
- Marks the scoresheet as processed in the database

## Security & RLS Considerations

### Service Role Key Usage

Both edge functions use the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS) policies for specific database operations. This is necessary because:

1. Edge functions need to write to multiple tables during processing (`match_details`, `player_statistics`, etc.)
2. Even when authenticated as a fixture manager or admin, RLS policies can be complex to configure correctly for this flow

**Important:** The service role key has admin privileges and can bypass RLS. Keep this key secure and never expose it in client-side code.

### Deployment

When deploying these functions:

1. Use the provided `deploy-edge-functions-with-service-role.ps1` script
2. Set the `SUPABASE_SERVICE_ROLE_KEY` environment variable securely
3. Verify the functions have the necessary secrets after deployment

### RLS Policies

Even though the edge functions use a service role key, we maintain RLS policies for client-side security:

- The client app checks user roles before allowing scoresheet uploads
- `match_details`, `player_statistics`, and other tables have RLS policies defined
- Only admins and fixture managers can manage these data through the UI

## Troubleshooting

If you encounter a 403 error "new row violates row-level security policy":

1. Verify the edge function is deployed with the service role key
2. Check that the key is properly set in the function's environment
3. Ensure the tables have appropriate RLS policies

For development, you can use the migration at `supabase/migrations/20250826170000_update_rls_for_scoresheet_processing.sql` to update RLS policies.
