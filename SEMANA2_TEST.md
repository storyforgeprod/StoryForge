# Semana 2 Testing Guide

## Task 2.1-2.2: Test POST /generate/script with Prisma Integration

### ✅ Changes Implemented

**GenerateService:**
- Now injects `PrismaService` in constructor
- Creates a Job record BEFORE calling Claude API (status: 'processing')
- Updates Job with result AFTER Claude API succeeds (status: 'completed')
- Updates Job with error if Claude API fails (status: 'failed')
- Returns Prisma Job ID instead of generated UUID
- Added `getJobStatus()` method to retrieve job details

**GenerateController:**
- Added `@UseGuards(JwtAuthGuard)` to all endpoints
- Added `@CurrentUser()` decorator to extract userId from JWT
- Added new `GET /generate/job/:jobId` endpoint to check job status
- Passes userId to `generateService.generateScript(userId, dto)`

**GenerateModule:**
- Imports PrismaModule (for database access)
- Imports AuthModule (for JWT guards)

**Prisma Schema:**
- Made `projectId` optional (Job can exist without Project initially)

**Build Status:**
```
✅ npm run prisma:generate: EXIT CODE 0
✅ npm run build: EXIT CODE 0
```

---

## 🧪 Testing Checklist

### Prerequisites

1. **Get Supabase Credentials** (if not already set)
   - Go to https://supabase.com → Your Project
   - Copy `Project URL` → `SUPABASE_URL` in `.env.local`
   - Copy `Service Role Key` (secret) → `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
   - Copy `Anon Key` → `SUPABASE_ANON_KEY` in `.env.local`

2. **Get Anthropic API Key**
   - Go to https://console.anthropic.com/account/keys
   - Create or copy API key
   - Add to `backend/.env.local`:
     ```
     ANTHROPIC_API_KEY=sk_...
     ```

3. **Create Database Schema**
   ```bash
   cd backend
   npm run prisma:migrate:dev -- --name init
   # Or if push directly (dev mode only):
   npm run prisma:push
   ```

4. **Start Backend Server**
   ```bash
   npm run start:dev
   # Should output: "StoryForge Backend running on port 3000"
   ```

### Test 1: Verify Swagger UI

- Open browser: `http://localhost:3000/api`
- Look for `/generate/script` POST endpoint
- Should show "Authorization Required" badge (lock icon)

### Test 2: Create Test User in Supabase

Since endpoints now require JWT authentication, you need a test user:

1. Go to Supabase Dashboard → Authentication → Users
2. Create a test user with email: `test@storyforge.local`
3. Note the user's `UID` (user ID)
4. Copy this ID → use as `SUB_CLAIM` in JWT tokens below

Or generate a JWT manually using Supabase CLI or JWT.io:

```bash
# Option A: Use Supabase CLI
supabase gen jwt --secret your-secret-key --sub user-id-here
```

### Test 3: Call POST /generate/script with JWT

**Using curl (replace VALUES):**

```bash
export SUPABASE_ANON_KEY="eyJ..."  # Your Supabase anon key
export USER_ID="abc123def456"      # Your test user ID
export JWT_TOKEN="eyJ..."          # JWT token from Test 2

curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "story": "A brave knight discovers a hidden treasure in an enchanted forest. Despite the dark magic protecting it, he overcomes his fears and retrieves the golden crown.",
    "style": "anime",
    "duration": 60
  }'
```

**Expected Response (HTTP 200):**
```json
{
  "script": "SCENE 1: Ancient Forest...",
  "jobId": "clx5a2bcd3e4f5g6h",
  "status": "completed",
  "createdAt": "2026-05-16T10:30:00.000Z"
}
```

### Test 4: Verify Job Created in Database

Query Prisma Studio to verify job was created:

```bash
cd backend
npm run prisma:studio
# Opens browser on http://localhost:5555
# Navigate to Job table
# Should see entry with:
#   - userId: your test user ID
#   - type: "script"
#   - status: "completed"
#   - result: JSON with "script" field
#   - processingTimeMs: ~1000-3000ms
```

### Test 5: Get Job Status

Use the new `GET /generate/job/:jobId` endpoint:

```bash
export JOBID="clx5a2bcd3e4f5g6h"  # From Test 3 response

curl -X GET "http://localhost:3000/generate/job/$JOBID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Response (HTTP 200):**
```json
{
  "id": "clx5a2bcd3e4f5g6h",
  "status": "completed",
  "progress": 100,
  "result": {
    "script": "SCENE 1: Ancient Forest..."
  },
  "error": null,
  "completedAt": "2026-05-16T10:30:00.000Z",
  "processingTimeMs": 2341
}
```

### Test 6: Error Handling

**Test 6a: Missing Authorization Header**
```bash
curl -X POST http://localhost:3000/generate/script \
  -H "Content-Type: application/json" \
  -d '{"story": "test", "style": "anime"}'
```
Expected: HTTP 401 Unauthorized

**Test 6b: Invalid JWT Token**
```bash
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer invalid_token_xyz" \
  -H "Content-Type: application/json" \
  -d '{"story": "test", "style": "anime"}'
```
Expected: HTTP 401 Unauthorized

**Test 6c: Empty Story**
```bash
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"story": "", "style": "anime"}'
```
Expected: HTTP 400 Bad Request (Story cannot be empty)

**Test 6d: Invalid Style Enum**
```bash
curl -X POST http://localhost:3000/generate/script \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"story": "test", "style": "invalid_style"}'
```
Expected: HTTP 400 Bad Request (Invalid enum value)

---

## 🔍 Debugging

### Issue: "No provider for PrismaService"

**Fix:** Ensure GenerateModule imports PrismaModule:
```typescript
@Module({
  imports: [PrismaModule, AuthModule],
  // ...
})
```

### Issue: "Job creation failed"

**Possible Causes:**
1. DATABASE_URL not set or wrong
2. Prisma migrations not run (`npm run prisma:migrate:dev`)
3. User ID doesn't exist in JWT token

**Debug:**
```bash
# Check database connection
npm run prisma:studio

# Check JWT token claims
# Decode at https://jwt.io
# Should have "sub" field with user ID
```

### Issue: "Claude API error"

**Possible Causes:**
1. ANTHROPIC_API_KEY not set in `.env.local`
2. API key invalid/expired
3. Rate limit exceeded

**Debug:**
```bash
# Verify env var is loaded
echo $ANTHROPIC_API_KEY

# Check API status at:
# https://status.anthropic.com
```

### Issue: "Unauthorized access to this job"

**Fix:** Get job status only with the user who created it. Different JWT tokens = different userIds.

---

## 📝 Next Steps After Testing

Once all tests pass:

1. ✅ Task 2.1 complete: Prisma integration verified
2. ✅ Task 2.2 complete: Real Claude API tested
3. **→ Task 2.3:** Implement job queue processor (Bull)
4. **→ Task 2.4:** Add POST /generate/images endpoint (Replicate)
5. **→ Task 2.5:** Add POST /generate/audio endpoint (ElevenLabs)

See [SEMANA2_TASKS.md](SEMANA2_TASKS.md) for full breakdown.

---

## 📞 Quick Reference

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/generate/script` | POST | ✅ Required | ✅ Tested |
| `/generate/job/:jobId` | GET | ✅ Required | ✅ New |
| `/generate/images` | POST | ✅ Required | ⏳ Stub |
| `/generate/audio` | POST | ✅ Required | ⏳ Stub |
| `/generate/video` | POST | ✅ Required | ⏳ Stub |

**All endpoints now require valid JWT Bearer token in Authorization header.**
