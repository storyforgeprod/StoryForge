# Task 2.5 — ElevenLabs Audio Endpoint

## What was built
`POST /generate/audio` endpoint that accepts a completed scriptId and optional voiceId, queues an async text-to-speech job via ElevenLabs API, and returns a jobId for polling.

## Acceptance criteria

- The system SHALL expose POST /generate/audio accepting `{ scriptId, voiceId? }`
- The system SHALL validate that the scriptId refers to a completed script job owned by the requesting user
- The system SHALL reject audio generation if the script job is not yet completed
- The system SHALL call ElevenLabs text-to-speech API using eleven_turbo_v2_5 model
- The system SHALL truncate script text to 3000 characters per ElevenLabs API limit
- The system SHALL store the audio URL in Job.result on completion
- The system SHALL return 403 if the scriptId belongs to a different user

## Dependencies
- Task 2.3 (Bull Queue Processor)
- ELEVENLABS_API_KEY env var
