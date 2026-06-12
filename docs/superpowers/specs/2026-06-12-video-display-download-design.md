# Video Display & Download Fix — Design

**Date:** 2026-06-12  
**Scope:** `frontend/src/features/generation/components/VideoStep.tsx` only

## Problem

Two issues in `VideoStep` once the video generation completes:

1. **Phone mockup stays frozen on the first scene image** — the `<video>` element is never rendered, so the user can't watch the result in-context.
2. **Download button redirects instead of downloading** — `<a href={videoUrl} download>` only triggers a file download for same-origin URLs. Supabase Storage URLs are cross-origin, so the browser navigates to the URL instead.

## Design

### Change 1 — Video in phone mockup

Replace the static `<img src={firstImageUrl}>` inside the phone mockup with a conditional:

- `phase !== 'done'` → `<img>` as today (shows first scene image while generating)
- `phase === 'done'` → `<video controls poster={firstImageUrl} src={videoUrl}>` (same dimensions, fills the mockup)

The browser renders the poster frame with a native play button. User presses play to watch with audio, all within the same `VideoStep` screen — no navigation.

### Change 2 — Fetch + blob download

Replace `<a href={videoUrl} download>` with a `<Button onClick={handleDownload}>`.

`handleDownload` (async):
1. Set `downloading = true`, disable the button and show a spinner
2. `fetch(videoUrl)` → `.blob()`
3. `URL.createObjectURL(blob)` → create a temporary `<a download="storyforge-video.mp4">` → `.click()`
4. `URL.revokeObjectURL(blobUrl)`
5. Set `downloading = false`

This bypasses cross-origin restrictions on the `download` attribute because the blob URL is always same-origin. Suitable for videos under 5 minutes (typical StoryForge output).

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/features/generation/components/VideoStep.tsx` | Add video to phone mockup; replace anchor download with fetch+blob handler |

`DownloadCard.tsx` is not in use in the current flow — not touched.

## Out of Scope

- Backend changes
- Supabase Storage configuration
- Any other component
