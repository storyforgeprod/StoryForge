# Task 2.2 — Ejecutar AHORA

**Time:** ~40 minutes total  
**Goal:** Test POST /generate/script with real Claude API and verify Job in Prisma database  
**Status:** Ready to start

---

## 🎯 What You'll Do

1. **Setup env vars** (5 min) — Add ANTHROPIC_API_KEY
2. **Run migrations** (5 min) — Create database tables
3. **Generate JWT token** (2 min) — For authentication
4. **Make API call** (5 min) — Test endpoint with curl
5. **Verify in database** (10 min) — Check Job in Prisma Studio
6. **Test error cases** (8 min) — Ensure error handling works

**Total: ~35-40 minutes**

---

## 🚀 Start Here — PowerShell One-Liner

Copy and paste this entire command in PowerShell **from the project root**:

```powershell
# Step 0: Navigate to backend
cd backend

# Step 1: Verify backend is running
Write-Host "=== STEP 1: Start Backend ===" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev" -PassThru
Start-Sleep -Seconds 3

# Step 2: Show next steps
Write-Host "`n=== STEP 2: Next Steps ===" -ForegroundColor Green
Write-Host "1. Get ANTHROPIC_API_KEY from https://console.anthropic.com/account/keys" -ForegroundColor Yellow
Write-Host "2. Edit backend/.env.local and add it" -ForegroundColor Yellow
Write-Host "3. Run: npm run prisma:migrate:dev -- --name init" -ForegroundColor Yellow
Write-Host "4. Run: npm run prisma:studio" -ForegroundColor Yellow
Write-Host "5. See TASK_2_2_MANUAL_STEPS.md for curl commands" -ForegroundColor Yellow
```

**What this does:**
- Starts backend in a new PowerShell window
- Shows you what to do next

---

## 📋 Manual Steps (If Running Everything Yourself)

### Step 1: Get ANTHROPIC_API_KEY (5 min)

1. Go to: https://console.anthropic.com/account/keys
2. Click "Create Key" or copy existing key
3. Copy the full API key (starts with `sk_ant_`)

### Step 2: Add to .env.local (2 min)

Edit `backend/.env.local` and add this line:

```env
ANTHROPIC_API_KEY=sk_ant_... # Paste your full key here
```

**Verify it loaded:**
```powershell
cd backend
$env:ANTHROPIC_API_KEY | Select-String "sk_ant" # Should show your key
```

### Step 3: Run Database Migrations (5 min)

```powershell
cd backend
npm run prisma:migrate:dev -- --name init
# Or if that doesn't work:
# npm run prisma:push
```

**You should see:**
```
Your database has been successfully migrated! 🎉
```

### Step 4: Start Backend (2 min)

```powershell
cd backend
npm run start:dev
```

**Wait for:**
```
StoryForge Backend running on port 3000
```

### Step 5: Open Prisma Studio in Another Terminal (2 min)

```powershell
# In a NEW PowerShell window
cd backend
npm run prisma:studio
```

**Browser opens to:** http://localhost:5555

---

## 🧪 Test the Endpoint

### Option A: Using PowerShell (Easiest)

**Run this in PowerShell** (replace `YOUR_JWT` with an actual token):

```powershell
# Variables
$JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # See note below
$API_URL = "http://localhost:3000/generate/script"
$STORY = "A brave knight discovers a hidden treasure in an enchanted forest. Despite dark magic, he overcomes his fears and retrieves the golden crown."

# Create JSON body
$BODY = @{
    story = $STORY
    style = "anime"
    duration = 60
} | ConvertTo-Json

# Make request
$HEADERS = @{
    "Authorization" = "Bearer $JWT"
    "Content-Type" = "application/json"
}

Write-Host "Testing POST /generate/script..." -ForegroundColor Green
$RESPONSE = Invoke-WebRequest -Uri $API_URL -Method POST -Body $BODY -Headers $HEADERS -ContentType "application/json"

Write-Host "HTTP Status: $($RESPONSE.StatusCode)" -ForegroundColor Green
Write-Host "Response:" -ForegroundColor Green
$RESPONSE.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Extract jobId for next test
$JOB_ID = ($RESPONSE.Content | ConvertFrom-Json).jobId
Write-Host "`nJob ID: $JOB_ID" -ForegroundColor Cyan
```

### Option B: Using curl (Alternative)

```bash
export JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export API="http://localhost:3000/generate/script"

curl -X POST "$API" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "story": "A brave knight discovers treasure in an enchanted forest",
    "style": "anime",
    "duration": 60
  }' \
  -i
```

---

## 🔑 Getting a JWT Token

**Quick Option: Generate with Supabase CLI**

```bash
supabase gen jwt --secret "dev-secret-change-me" --sub "test-user-123"
```

This returns something like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjM5NzU2MjAwLCJleHAiOjE2Mzk4NDI2MDAsInN1YiI6InRlc3QtdXNlci0xMjMifQ.xyz...
```

**Use this as your `$JWT` above.**

---

## 📊 Expected Success Response

### HTTP 200 Response Body
```json
{
  "script": "SCENE 1: Ancient Forest Awakening\n[Sound: Mysterious whispers fading in]\n...",
  "jobId": "clx5a2bcd3e4f5g6h",
  "status": "completed",
  "createdAt": "2026-05-16T15:30:00.000Z"
}
```

### What This Means
- ✅ Claude API successfully generated script
- ✅ Job created in Prisma database
- ✅ jobId is real CUID from database (not UUID)
- ✅ Status is "completed" (Claude responded successfully)
- ✅ Authentication worked (JWT was valid)

---

## 🔍 Verify Job in Database

### In Prisma Studio

1. **Open:** http://localhost:5555 (already open from Step 4)
2. **Click:** "Job" table
3. **Look for:** Your newly created job
   - userId: matches JWT sub claim
   - type: "script"
   - status: "completed"
   - result: JSON with your script
   - processingTimeMs: 1000-3000 (time Claude took)

### Via SQL Query

```sql
SELECT id, userId, type, status, progress, result, processingTimeMs 
FROM "Job" 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

---

## 🧪 Test 2: Get Job Status

**After successful POST, test the new GET endpoint:**

```powershell
$JOB_ID = "clx5a2bcd3e4f5g6h"  # From Step 5 response
$JWT = "eyJ..."  # Same JWT as before
$API_URL = "http://localhost:3000/generate/job/$JOB_ID"

$HEADERS = @{
    "Authorization" = "Bearer $JWT"
}

Invoke-WebRequest -Uri $API_URL -Method GET -Headers $HEADERS | ConvertTo-Json
```

**Expected response:**
```json
{
  "id": "clx5a2bcd3e4f5g6h",
  "status": "completed",
  "progress": 100,
  "result": {
    "script": "SCENE 1: ..."
  },
  "error": null,
  "completedAt": "2026-05-16T15:30:00.000Z",
  "processingTimeMs": 2341
}
```

---

## ❌ Troubleshooting

### Error: "Unauthorized" (HTTP 401)
**Problem:** JWT token is invalid or missing
```powershell
# Regenerate token
supabase gen jwt --secret "dev-secret-change-me" --sub "test-user-123"
```

### Error: "Claude API error" (HTTP 200 but error in response)
**Problem:** ANTHROPIC_API_KEY is wrong or not loaded
```powershell
# Verify env var is loaded
$env:ANTHROPIC_API_KEY | Select-String "sk_ant"
# Should show your key

# If blank, restart backend:
npm run start:dev
```

### Error: "Job creation failed" (HTTP 400)
**Problem:** Database migrations not run
```powershell
npm run prisma:migrate:dev -- --name init
npm run prisma:push
```

### Error: "Cannot connect to database"
**Problem:** DATABASE_URL or Supabase credentials wrong
```env
# Check backend/.env.local:
DATABASE_URL=postgresql://...your-supabase...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Backend won't start
```powershell
# Clear node_modules and reinstall
rm -r node_modules -Force
npm install
npm run build
npm run start:dev
```

---

## ✅ Success Criteria (Check All)

- [ ] Backend running on port 3000
- [ ] POST /generate/script returns HTTP 200
- [ ] Response includes real `jobId` (CUID format)
- [ ] Job appears in Prisma Studio Job table
- [ ] Job.status = "completed"
- [ ] Job.result contains generated script
- [ ] Job.processingTimeMs is between 1000-5000
- [ ] GET /generate/job/:jobId returns same job
- [ ] Error handling works (test with empty story, invalid JWT)

**All checked?** → Task 2.2 ✅ COMPLETE

---

## 🚀 What's Next

Once all success criteria pass:

**Task 2.3:** Implement Bull job queue processor (5h)
- See [SEMANA2_TASKS.md](SEMANA2_TASKS.md#task-23-bull-queue-processor-5h)

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Start backend (port 3000) |
| `npm run prisma:migrate:dev` | Run migrations |
| `npm run prisma:studio` | Open Prisma Studio UI |
| `npm run build` | Compile TypeScript |
| `supabase gen jwt` | Generate test JWT |

---

**Duration:** 35-40 min  
**Difficulty:** Easy  
**Dependencies:** ANTHROPIC_API_KEY + Supabase credentials  
**Status:** Ready to start NOW

👉 **Start with Step 1 above or run the PowerShell one-liner**

