# Task 2.4 — Replicate Images Endpoint

## What was built
`POST /generate/images` endpoint that accepts a completed scriptId, queues an async image generation job via Replicate API (Flux model), and returns a jobId for polling.

## Acceptance criteria

- The system SHALL expose POST /generate/images accepting `{ scriptId, imageDescription? }`
- The system SHALL validate that the scriptId refers to a completed script job owned by the requesting user
- The system SHALL create an image Job(pending) and queue it without blocking the HTTP response
- The system SHALL use Replicate API (flux-pro model) to generate image(s) from a Claude-derived prompt
- The system SHALL store image URLs in Job.result on completion
- The system SHALL return 403 if the scriptId belongs to a different user

## Dependencies
- Task 2.3 (Bull Queue Processor)
- REPLICATE_API_TOKEN env var
