# Task 2.6 — Implementation Plan

## Approach
VideoService wraps FFmpeg CLI via Node child_process. Downloads image and audio from URLs/base64, writes temp files, executes FFmpeg command, returns output path. Queue processor handles the async lifecycle.

## Files created/modified
| File | Change |
|------|--------|
| `backend/src/integrations/video.service.ts` | NEW — assembleVideo(), _downloadImage/Audio(), _getAudioDuration(), _buildFFmpegCommand(), _cleanup() |
| `backend/src/generate/dto/generate-video.dto.ts` | GenerateVideoDto, GenerateVideoResponseDto, VideoAssemblyResult |
| `backend/src/common/queue/queue.service.ts` | +imageJobId, audioJobId, fps, bitrate fields |
| `backend/src/generate/generate.service.ts` | +generateVideo() (endpoint), +generateVideoContent() (processor) |
| `backend/src/generate/generate.queue.processor.ts` | +video case in switch |
| `backend/src/generate/generate.controller.ts` | POST /generate/video endpoint |

## FFmpeg command
```bash
ffmpeg -loop 1 -i image.png -i audio.mp3 \
  -c:v libx264 -preset fast \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:a aac -b:a 128k -t <duration> -y output.mp4
```

## Key constraints
- FFmpeg CLI must be installed separately on deployment machine (not npm)
- Base64 and HTTP(S) URL inputs both supported for image/audio
- Temp files written to VIDEO_OUTPUT_DIR (default: /tmp/storyforge-videos)
