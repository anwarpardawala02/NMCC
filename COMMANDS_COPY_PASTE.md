# WhatsApp Integration - Copy & Paste Commands

Use this file to quickly copy and paste setup commands.

---

## 1️⃣ Twilio Secrets Setup

Copy these commands one at a time:

```bash
supabase secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

```bash
supabase secrets set TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

```bash
supabase secrets set TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

**Replace values with your actual Twilio credentials from:**
- Account SID: Twilio Console → Account Info
- Auth Token: Twilio Console → API Keys
- WhatsApp Number: Twilio Console → Messaging → WhatsApp → Sandbox

---

## 2️⃣ Deploy Edge Functions

Navigate to project directory:

```bash
cd "c:\New folder\Personal\Learning\NMCC\northolt-manor-cc"
```

Deploy send function:

```bash
supabase functions deploy send-whatsapp-message
```

Deploy webhook function:

```bash
supabase functions deploy whatsapp-webhook
```

**Expected output:**
```
✓ Function send-whatsapp-message deployed successfully...
✓ Function whatsapp-webhook deployed successfully...
```

---

## 3️⃣ Verify Deployment

Check if functions are deployed:

```bash
supabase functions list
```

**Expected output:**
```
send-whatsapp-message
whatsapp-webhook
[other functions...]
```

---

## 4️⃣ Get Your Webhook URL

Your webhook URL format:
```
https://YOUR-PROJECT.supabase.co/functions/v1/whatsapp-webhook
```

Find YOUR-PROJECT in Supabase dashboard URL:
- Go to https://app.supabase.com
- Select your project
- URL: `https://app.supabase.com/project/YOUR-PROJECT`

Example:
```
https://xyzabc123def.supabase.co/functions/v1/whatsapp-webhook
```

---

## 5️⃣ Configure Twilio Webhook (Manual Steps)

1. Go to: https://console.twilio.com
2. Messaging → WhatsApp → Sandbox Settings
3. Scroll to: "When a message comes in"
4. Webhook URL field → **Paste your webhook URL**
5. Method → Select: **POST**
6. Click: **Save**

---

## 6️⃣ Add Button to React Component

In your fixture page component:

```tsx
import { SendWhatsAppPollButton } from '../components/SendWhatsAppPollButton';
```

In your JSX:

```tsx
<SendWhatsAppPollButton 
  fixture={fixture}
  players={players}
  onSendComplete={() => loadFixtures()}
/>
```

Full example:

```tsx
import { SendWhatsAppPollButton } from '../components/SendWhatsAppPollButton';
import { HStack, Button } from '@chakra-ui/react';

export function FixtureControls({ fixture, players }) {
  return (
    <HStack spacing={4}>
      <Button onClick={() => editFixture()}>Edit</Button>
      <SendWhatsAppPollButton fixture={fixture} players={players} />
    </HStack>
  );
}
```

---

## 7️⃣ Run Tests

### Test 1: Check Functions
```bash
supabase functions list
```

### Test 2: Send Test Message
- Click "Send Poll via WhatsApp" button in app
- Modal should show green checkmarks for sent

### Test 3: Check Phone
- Wait 10 seconds
- Check phone for WhatsApp message
- Message should have fixture details

### Test 4: Send Response
- Reply to WhatsApp: `YES`
- Wait 5-10 seconds
- Refresh fixture page
- Availability should update

### Test 5: Check Database
```sql
SELECT * FROM fixture_availability 
WHERE player_id = '[your-player-id]' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🔍 Troubleshooting Commands

### Check Secrets
```bash
supabase secrets list
```

### Verify Function Code
```bash
supabase functions download send-whatsapp-message
```

### Test Webhook Manually
```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "447700900000",
            "text": {"body": "YES"},
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }'
```

### Check Twilio Credentials
```bash
# Replace with your values
curl -u ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  https://api.twilio.com/2010-04-01/Accounts.json
```

---

## 🚀 Quick Deploy Script

**For Windows PowerShell:**

```powershell
# 1. Navigate to project
cd "c:\New folder\Personal\Learning\NMCC\northolt-manor-cc"

# 2. Deploy functions
Write-Host "Deploying send-whatsapp-message..."
supabase functions deploy send-whatsapp-message

Write-Host "Deploying whatsapp-webhook..."
supabase functions deploy whatsapp-webhook

# 3. Verify
Write-Host "Verifying deployment..."
supabase functions list

Write-Host "Done! All functions deployed."
```

Save this as `deploy-whatsapp.ps1` and run:
```bash
.\deploy-whatsapp.ps1
```

---

## 📋 Pre-Deployment Checklist Commands

```bash
# 1. Check if CLI is installed
supabase --version

# 2. Verify project
supabase projects list

# 3. Check existing functions
supabase functions list

# 4. Verify secrets are set
supabase secrets list

# 5. Check if build passes
npm run build

# 6. Test dev server
npm run dev
```

---

## 🔧 Useful Database Commands

### View fixture_communications table
```sql
SELECT * FROM fixture_communications LIMIT 10;
```

### View fixture availability
```sql
SELECT 
  f.opponent,
  f.fixture_date,
  p.full_name,
  fa.status,
  fa.responded_at
FROM fixture_availability fa
JOIN fixtures f ON fa.fixture_id = f.id
JOIN players p ON fa.player_id = p.id
ORDER BY f.fixture_date DESC, p.full_name;
```

### Count responses per fixture
```sql
SELECT 
  f.opponent,
  f.fixture_date,
  COUNT(*) as total_responses,
  COUNT(CASE WHEN fa.status = 'Available' THEN 1 END) as available,
  COUNT(CASE WHEN fa.status = 'Not Available' THEN 1 END) as not_available,
  COUNT(CASE WHEN fa.status = 'Maybe' THEN 1 END) as maybe
FROM fixture_availability fa
JOIN fixtures f ON fa.fixture_id = f.id
GROUP BY f.id, f.opponent, f.fixture_date
ORDER BY f.fixture_date DESC;
```

### Find players without phone numbers
```sql
SELECT full_name, email FROM players WHERE phone IS NULL OR phone = '';
```

### View latest communications
```sql
SELECT 
  player_id,
  message_type,
  status,
  error_message,
  created_at
FROM fixture_communications
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🛠️ Emergency Commands

### Stop dev server (if stuck)
```bash
# Find and kill process
Get-Process node | Stop-Process
```

### Clean install
```bash
npm install
npm run build
```

### Reset database migration (if needed)
```bash
# CAUTION: This is destructive!
# Only run if migration failed
supabase migration down
supabase migration up
```

### View function logs
```bash
# In Supabase dashboard:
# Edge Functions → select function → View invocations
```

---

## 📝 Environment Variables (.env)

These should already be set, but for reference:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

The Twilio credentials are NOT in .env:
- They are stored in Supabase secrets
- Accessed by Edge Functions
- Never exposed to frontend

---

## ✅ Verification Steps

After deployment, verify with these commands:

```bash
# 1. Verify functions deployed
supabase functions list
# Should show: send-whatsapp-message, whatsapp-webhook

# 2. Verify build passes
npm run build
# Should end with: ✓ built in Xs

# 3. Start dev server
npm run dev
# Should show: ➜  Local: http://localhost:5174/

# 4. Check component exists
dir src\components\SendWhatsAppPollButton.tsx
# Should exist

# 5. Check migrations
dir supabase\migrations
# Should show: 20251109_create_fixture_communications.sql
```

---

## 🎯 Command Cheat Sheet

| Task | Command |
|------|---------|
| Set secrets | `supabase secrets set KEY="VALUE"` |
| Deploy function | `supabase functions deploy FUNCTION-NAME` |
| List functions | `supabase functions list` |
| Download function | `supabase functions download FUNCTION-NAME` |
| Check CLI version | `supabase --version` |
| List projects | `supabase projects list` |
| Build app | `npm run build` |
| Start dev | `npm run dev` |
| Test build | `npm run build` |

---

## 🚀 Final Deployment Command

Run this after completing all steps:

```bash
cd "c:\New folder\Personal\Learning\NMCC\northolt-manor-cc" && npm run build
```

Expected output:
```
✓ 1522 modules transformed.
✓ built in 12.45s
```

---

**Last Updated**: November 9, 2025
**Version**: 1.0
**Use**: Copy commands directly into terminal
