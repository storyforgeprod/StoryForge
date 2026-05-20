# Task 2.2: Testing with Real Claude API

## Status: READY FOR TESTING

Your backend is now compiled and running. The GenerateService now:
✅ Creates Job records in Prisma BEFORE calling Claude
✅ Updates Job with results AFTER Claude API responds
✅ Returns real Prisma Job IDs (not generated UUIDs)
✅ All endpoints require JWT authentication

---

## Step 1: Ensure Backend is Running

```bash
cd backend
npm run start:dev
```

You should see: `StoryForge Backend running on port 3000`

---

## Step 2: Setup Environment Variables

Edit `backend/.env.local` and add:

```env
# Add to existing .env.local:

ANTHROPIC_API_KEY=sk_ant_... # Get from https://console.anthropic.com

# If you don't have these yet, get from Supabase:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:...@your-project.supabase.co:5432/postgres
```

If you need to generate a test JWT token, use this Supabase CLI command:

```bash
supabase gen jwt --secret "your_jwt_secret" --sub "test_user_123"
```

---

## Step 3: Create Database Schema

If migrations haven't been run yet:

```bash
cd backend

# Option A: Interactive migration (recommended)
npm run prisma:migrate:dev -- --name init

# Option B: Direct push (dev mode only)
npm run prisma:push
```

This creates the Job, User, Project, Output, Event tables in your database.

---

## Step 4: Test POST /generate/script

### Via Curl (Replace VALUES):

```bash
export JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Your JWT token
export API_URL="http://localhost:3000/generate/script"

curl -X POST "$API_URL" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "story": "A brave knight discovers a hidden treasure in an enchanted forest.",
    "style": "anime",
    "duration": 60
  }'
```

### Via Swagger UI:

1. Open: `http://localhost:3000/api`
2. Find `/generate/script` POST endpoint
3. Click "Authorize" button (top right)
4. Paste your JWT in the "Authorization" field
5. Click "Try it out"
6. Fill in body and click "Execute"

### Expected Response (HTTP 200):

```json
{
  "script": "SCENE 1: Ancient Forest...\n[Sound: Mysterious music]\n...",
  "jobId": "clx5a2bcd3e4f5g6h",
  "status": "completed",
  "createdAt": "2026-05-16T10:30:00.000Z"
}
```

---

## Step 5: Verify Job in Database

View the job that was created:

```bash
cd backend
npm run prisma:studio
```

This opens `http://localhost:5555` where you can:
1. Navigate to the "Job" table
2. See your newly created job with:
   - `userId`: from JWT token
   - `type`: "script"
   - `status`: "completed"
   - `result`: JSON containing the generated script
   - `processingTimeMs`: ~1000-3000ms

---

## Step 6: Get Job Status

Use the new `GET /generate/job/:jobId` endpoint:

```bash
export JWT="eyJ..."
export JOBID="clx5a2bcd3e4f5g6h"  # From Step 4 response

curl -X GET "http://localhost:3000/generate/job/$JOBID" \
  -H "Authorization: Bearer $JWT"
```

Expected response:
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

---

## Troubleshooting

### "Failed to create generation job"
- Check DATABASE_URL is correct
- Run Prisma migrations: `npm run prisma:migrate:dev`

### "Unauthorized" (HTTP 401)
- JWT token is invalid or expired
- Generate new token with `supabase gen jwt`

### "Claude API error"
- ANTHROPIC_API_KEY not set or invalid
- Check at https://console.anthropic.com

### "Job not found"
- Use correct jobId from response
- Different JWT token = different user = can't access job

---

## ✅ All Tests Pass?

When all steps above work, Task 2.2 is **COMPLETE**. 

Next: Task 2.3 — Implement Bull queue processor  
See: [SEMANA2_TASKS.md](SEMANA2_TASKS.md#task-23-bull-queue-processor-5h)
