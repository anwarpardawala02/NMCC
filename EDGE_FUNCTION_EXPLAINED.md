# Understanding Edge Functions

## What Are Edge Functions?

Edge functions are serverless functions that run on edge servers (closer to users) rather than in a central data center. They're perfect for:

- Processing data before/after it reaches your database
- Integrating with external APIs and services
- Running computationally intensive tasks outside your client application
- Implementing custom authentication and authorization logic

## How Edge Functions Work in Your Cricket Club App

Your app uses two edge functions that work together to process cricket scoresheets:

### 1. `process-scoresheet` Function

**Purpose:** Extract data from scoresheet images using OCR

```
┌───────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Upload Image  │────▶│ Storage Bucket  │────▶│ Edge Function  │
└───────────────┘     └─────────────────┘     └────────────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │  OCR Process   │
                                              └────────────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │ Store Raw Data │
                                              └────────────────┘
```

**Code Example:**
```typescript
// Simplified example of process-scoresheet
Deno.serve(async (req) => {
  // Get file path from request
  const { filePath } = await req.json()
  
  // Download file from storage
  const fileData = await supabase.storage.from('scoresheets').download(filePath)
  
  // Process with OCR
  const text = await performOCR(fileData)
  
  // Parse structured data
  const parsedData = parseScoresheet(text)
  
  // Save raw OCR data
  await supabase.from('scoresheets').insert({
    file_path: filePath,
    raw_ocr_data: text,
    processed_data: parsedData
  })
  
  return new Response(JSON.stringify(parsedData))
})
```

### 2. `save-scoresheet-data` Function

**Purpose:** Take parsed data and update database tables

```
┌───────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Parsed Data   │────▶│ Edge Function   │────▶│ Create/Update  │
└───────────────┘     └─────────────────┘     │  DB Records    │
                                              └────────────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │Update Player   │
                                              │  Statistics    │
                                              └────────────────┘
```

**Code Example:**
```typescript
// Simplified example of save-scoresheet-data
Deno.serve(async (req) => {
  // Get parsed data from request
  const { parsedData } = await req.json()
  
  // Process each player's stats
  for (const player of parsedData.batting) {
    // Create or find player record
    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('name', player.name)
      .single()
      
    // Create match detail record
    await supabase.from('match_details').insert({
      player_id: playerData.id,
      date: parsedData.match.date,
      opposition: parsedData.match.opponent,
      batting_runs: player.runs,
      batting_balls: player.balls
    })
    
    // Update player statistics
    await updatePlayerStatistics(supabase, playerData.id, player)
  }
  
  return new Response(JSON.stringify({ success: true }))
})
```

## Why Service Role Keys Are Needed

When your edge function tries to insert or update data in your database, it hits Row Level Security (RLS) policies. These policies are great for security but can block legitimate operations.

For example, when the function tries to create a match detail for a player:

```typescript
await supabase.from('match_details').insert({
  player_id: 'abc-123',  // This player isn't the current user!
  date: '2025-08-28',
  batting_runs: 75
})
```

Even if the user is an admin or fixture manager, RLS might block this because the function is trying to write data for another player.

The service role key bypasses RLS entirely, allowing your trusted edge function to perform these operations.

## Security Considerations

Using service role keys comes with responsibilities:

1. **Never expose the key in client-side code**
2. **Validate user permissions in the edge function before performing operations**
3. **Limit the operations performed with the service role client**
4. **Keep the key secure as an environment variable or secret**

## Debugging Edge Functions

To see logs from your edge functions:

```powershell
supabase functions logs process-scoresheet
supabase functions logs save-scoresheet-data
```

This will show you any errors or console.log messages from your functions.
