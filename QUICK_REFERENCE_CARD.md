# WhatsApp Integration - Quick Reference Card

Print this page or save as reference while implementing.

---

## 🚀 Setup Commands (Copy & Paste)

### 1. Set Twilio Secrets in Supabase
```bash
supabase secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

### 2. Deploy Edge Functions
```bash
cd "c:\New folder\Personal\Learning\NMCC\northolt-manor-cc"
supabase functions deploy send-whatsapp-message
supabase functions deploy whatsapp-webhook
```

### 3. Get Your Webhook URL
```
Format: https://YOUR-PROJECT.supabase.co/functions/v1/whatsapp-webhook
Example: https://xyzabc123def.supabase.co/functions/v1/whatsapp-webhook
```

---

## 📋 Twilio Configuration Checklist

### In Twilio Dashboard:
- [ ] Account SID: Copy and save
- [ ] Auth Token: Copy and save
- [ ] Sandbox Phone: Copy and save
- [ ] Join Code: Send to your phone
- [ ] WhatsApp Confirmation: Received from +1 415-523-8886

### In Twilio Settings:
- [ ] Go to: Messaging → WhatsApp → Sandbox Settings
- [ ] "When a message comes in" → Webhook URL: Set to your endpoint
- [ ] Method: Select POST
- [ ] Save changes

---

## 💻 React Component Usage

### Import:
```tsx
import { SendWhatsAppPollButton } from '../components/SendWhatsAppPollButton';
```

### Use:
```tsx
<SendWhatsAppPollButton 
  fixture={{
    id: '123e4567-e89b-12d3-a456-426614174000',
    opponent: 'Surrey',
    fixture_date: '2025-11-15T14:00:00Z',
    venue: 'The Oval'
  }}
  players={[
    { full_name: 'John Smith', phone: '+44 7700 900000' },
    { full_name: 'Jane Doe', phone: '+44 7700 900001' }
  ]}
  onSendComplete={() => refreshFixture()}
/>
```

---

## 📱 WhatsApp Message Flow

```
SEND (Fixture Manager clicks button)
    ↓
Player Phone: Receives WhatsApp
    "Hi John! 🏏
     
     Fixture Availability Poll:
     📍 *Surrey* vs Northolt Manor CC
     📅 Sun, Nov 10, 2025, 14:00
     🏟️ The Oval
     
     Please Reply:
     • YES - If you're available
     • NO - If you're not available
     • MAYBE - If you're unsure"
    ↓
Player: Replies "YES"
    ↓
System Processes Response
    ↓
Database Updates
    fixture_availability.status = 'Available'
    ↓
Admin Sees Update
    Fixture page shows updated count
```

---

## 🔧 Twilio Credentials Format

| Field | Format | Example |
|-------|--------|---------|
| Account SID | AC + 32 chars | ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| Auth Token | 32 characters | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| WhatsApp Number | whatsapp:+[number] | whatsapp:+14155238886 |

---

## 📞 Phone Number Format

**Correct:**
- +44 7700 900000 (with space)
- +447700900000 (no space)
- +44-7700-900000 (with dashes)

**Database:**
- Store as: +44 7700 900000 (with space)
- Webhook accepts all formats

---

## 🔍 Troubleshooting Quick Reference

| Problem | Check | Fix |
|---------|-------|-----|
| Message not sent | Secrets set? | Verify in Supabase |
| Players not receiving | Phone format? | Must be +44... |
| Response not recorded | Webhook URL? | Set in Twilio console |
| 401 Error | Credentials valid? | Test with curl |
| Button not showing | Component imported? | Check import statement |

---

## 📊 Message Response Parsing

Webhook recognizes:

**Available (YES):**
- yes, available, going, can, will play, confirm, ok, sure

**Not Available (NO):**
- no, not available, cannot, can't, out, unavailable

**Maybe (UNSURE):**
- maybe, unsure, might, possibly, probably, might available

---

## 🗂️ File Structure

```
Files to modify:
└── src/components/
    └── [Your page component].tsx
        ↓ Add import:
        import { SendWhatsAppPollButton } from './SendWhatsAppPollButton';
        ↓ Add to JSX:
        <SendWhatsAppPollButton fixture={...} players={...} />

Files created (deploy as-is):
├── supabase/functions/send-whatsapp-message/index.ts
├── supabase/functions/whatsapp-webhook/index.ts
└── src/components/SendWhatsAppPollButton.tsx
```

---

## 🧪 Testing Sequence

1. **Setup Test** (2 min)
   ```bash
   # Check functions deployed
   supabase functions list
   # Should show: send-whatsapp-message, whatsapp-webhook
   ```

2. **Send Test** (2 min)
   - Click button in app
   - Modal shows results
   - Check for green checkmarks

3. **Receive Test** (2 min)
   - Wait 10 seconds
   - Check phone for WhatsApp message

4. **Response Test** (2 min)
   - Reply: "YES"
   - Wait 5-10 seconds
   - Refresh fixture page

5. **Database Test** (1 min)
   ```sql
   SELECT * FROM fixture_availability 
   WHERE player_id = '...' 
   LIMIT 1;
   ```

---

## 🔐 Security Checklist

- [ ] Secrets set in Supabase (not in code)
- [ ] Secrets not committed to git
- [ ] .gitignore includes .env files
- [ ] Only admins can see button
- [ ] Webhook URL is HTTPS
- [ ] Phone numbers stored securely
- [ ] Database RLS policies configured

---

## 📈 Expected Performance

| Metric | Expected | Status |
|--------|----------|--------|
| Time to send | < 2 seconds | ✓ |
| Time to receive | < 10 seconds | ✓ |
| Success rate | > 95% | ✓ |
| Response time | < 10 seconds | ✓ |
| Database update | < 1 second | ✓ |

---

## 🎯 Key URLs

| Resource | URL |
|----------|-----|
| Twilio Console | https://console.twilio.com |
| Supabase Dashboard | https://app.supabase.com |
| Twilio Docs | https://www.twilio.com/docs/whatsapp |
| Supabase Docs | https://supabase.com/docs |
| WhatsApp API | https://www.twilio.com/docs/whatsapp/api |

---

## 📚 Documentation Map

```
START HERE:
├── WHATSAPP_README.md
│   ├── Beginner → WHATSAPP_QUICK_START.md
│   ├── Developer → WHATSAPP_IMPLEMENTATION_SUMMARY.md
│   └── Troubleshoot → WHATSAPP_CHECKLIST_TROUBLESHOOTING.md
│
IMPLEMENTATION:
├── WHATSAPP_QUICK_START.md (Step 1-7)
└── WHATSAPP_UI_INTEGRATION.md (Where to add button)

REFERENCE:
├── WHATSAPP_TWILIO_SETUP.md (Deep dive)
├── WHATSAPP_IMPLEMENTATION_SUMMARY.md (Overview)
└── WHATSAPP_CHECKLIST_TROUBLESHOOTING.md (Fixes)
```

---

## ⏱️ Time Estimates

| Task | Time | Notes |
|------|------|-------|
| Create Twilio account | 5 min | Free, instant |
| Get WhatsApp sandbox | 5 min | Automatic with Twilio |
| Set Supabase secrets | 3 min | Copy-paste 3 values |
| Deploy functions | 3 min | 2 CLI commands |
| Configure webhook | 3 min | Set URL in Twilio |
| Add UI button | 3 min | 3 lines of code |
| Initial test | 5 min | Send and receive |
| Total | ~27 min | Can be faster if experienced |

---

## 🆘 Emergency Support

**If something breaks:**

1. Check browser console: F12 → Console
2. Check function logs: Supabase → Edge Functions → Invocations
3. Check Twilio logs: Twilio Console → Logs
4. Verify secrets: Supabase → Settings → API → Secrets
5. Restart: Stop dev server, redeploy functions

---

## 💡 Pro Tips

✨ **Send to groups:** Filter players before passing to component
```tsx
const activeOnly = players.filter(p => p.status === 'active');
<SendWhatsAppPollButton players={activeOnly} />
```

✨ **Only admins:** Wrap in permission check
```tsx
{user?.is_admin && <SendWhatsAppPollButton ... />}
```

✨ **Bulk send:** Loop through fixtures
```tsx
for (const fixture of upcomingFixtures) {
  // Send poll for each fixture
}
```

✨ **Track history:** Query fixture_communications table
```sql
SELECT * FROM fixture_communications ORDER BY created_at DESC;
```

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All documentation read
- [ ] Setup completed
- [ ] Testing passed
- [ ] Players trained on format
- [ ] Phone numbers validated
- [ ] Backup communication method ready
- [ ] Admin team familiar with button
- [ ] Error handling understood
- [ ] Monitoring plan in place

---

## 📞 When You Need Help

| Issue | Where | How |
|-------|-------|-----|
| Can't send messages | Check Twilio logs | Console → Logs |
| Player responses not recording | Check webhook | Supabase → Edge Functions |
| Can't see button | Check component | Browser F12 → Console |
| Credentials error | Check secrets | Supabase → Settings → API |
| General question | Read docs | Start with WHATSAPP_README.md |

---

## ✅ Success Sign

You know it's working when:

✓ You click button  
✓ Modal shows sending  
✓ Phone pings with WhatsApp  
✓ Fixture details in message  
✓ You reply "YES"  
✓ Availability updates automatically  

---

**Saved**: November 9, 2025
**Version**: 1.0
**Use**: Print or bookmark for reference
