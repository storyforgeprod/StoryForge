# Task 2.6 — FFmpeg Video Assembly Endpoint

## What was built
`POST /generate/video` endpoint that accepts completed imageJobId + audioJobId, queues an async FFmpeg video assembly job, and returns a jobId for polling. Output is a vertical 1080×1920 MP4 (YouTube Shorts format).

## Acceptance criteria

- The system SHALL expose POST /generate/video accepting `{ imageJobId, audioJobId, fps?, bitrate? }`
- The system SHALL validate that both imageJobId and audioJobId refer to completed jobs owned by the requesting user
- The system SHALL assemble a vertical 1080×1920 MP4 by looping the image for the audio duration
- The system SHALL use H.264 video codec with AAC audio at 128k bitrate
- The system SHALL auto-detect audio duration via ffprobe
- The system SHALL clean up temporary files after assembly (success or failure)
- The system SHALL enforce a 5-minute timeout per video job
- The system SHALL store the video file path in Job.result on completion

## Dependencies
- Tasks 2.3-2.5 (Queue Processor + Images + Audio endpoints)
- FFmpeg + ffprobe installed on host machine
