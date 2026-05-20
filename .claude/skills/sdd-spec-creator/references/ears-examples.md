# EARS Acceptance Criteria — Examples by Domain

EARS (Easy Approach to Requirements Syntax) produces unambiguous, testable requirements.
These map directly to test cases and work well as AI agent prompts.

## Pattern Reference

| Pattern | Template | Use when |
|---------|----------|----------|
| Ubiquitous | "The system shall [action]." | Always-true system behavior |
| Event-driven | "When [trigger], the system shall [response]." | User actions, API calls, events |
| State-driven | "While [state], the system shall [behavior]." | System in a specific mode/status |
| Optional feature | "Where [feature is enabled], the system shall [behavior]." | Feature flags, configs |
| Unwanted behavior | "If [unwanted condition], then the system shall [safeguard]." | Error handling, edge cases |

---

## Examples by Domain

### Authentication & Authorization

```
AC-1: When a user submits valid credentials, the system shall issue a JWT token with a 1-hour expiry.
AC-2: When a user submits invalid credentials three consecutive times, the system shall lock the account for 15 minutes.
AC-3: If a request is made without a valid token, the system shall return HTTP 401 and a descriptive error message.
AC-4: While a session is active, the system shall refresh the token automatically 5 minutes before expiry.
AC-5: The system shall never expose password hashes in API responses or logs.
```

### CRUD / Data Management

```
AC-1: When a user submits a valid create request, the system shall persist the record and return the new ID within 500ms.
AC-2: When a user requests a record by ID that does not exist, the system shall return HTTP 404.
AC-3: If a required field is missing from a create request, the system shall return HTTP 400 with a field-level error message.
AC-4: When a user updates a record, the system shall update the `updated_at` timestamp and return the full updated record.
AC-5: The system shall soft-delete records by setting `deleted_at`; deleted records shall not appear in list endpoints.
```

### Search & Filtering

```
AC-1: When a user submits a search query, the system shall return results within 1 second for datasets up to 100,000 records.
AC-2: When no results match the query, the system shall return an empty list with HTTP 200, not an error.
AC-3: The system shall support filtering by [fields] and sorting by [fields] via query parameters.
AC-4: When pagination parameters are provided, the system shall return the correct page of results and include total count in the response.
```

### File / Upload Handling

```
AC-1: When a user uploads a file, the system shall validate the file type against [allowlist] before storing it.
AC-2: If an uploaded file exceeds 10MB, the system shall reject it with HTTP 413 and a descriptive message.
AC-3: When a file upload completes, the system shall return a permanent URL for the file within 3 seconds.
AC-4: The system shall store uploaded files in [storage service] with server-side encryption enabled.
```

### Notifications / Messaging

```
AC-1: When [trigger event] occurs, the system shall send an email notification to the user within 2 minutes.
AC-2: If an email delivery fails, the system shall retry up to 3 times with exponential backoff.
AC-3: The system shall log each notification attempt with status (sent/failed) and timestamp.
AC-4: Where a user has disabled email notifications, the system shall not send emails for that user.
```

### Payment / Financial

```
AC-1: When a payment is initiated, the system shall call the payment gateway and return a result within 10 seconds.
AC-2: If the payment gateway returns an error, the system shall preserve the cart state and display a user-facing error message.
AC-3: While a payment is processing, the system shall disable the submit button to prevent duplicate submissions.
AC-4: The system shall never log full card numbers or CVV values.
AC-5: When a payment succeeds, the system shall emit an `order.paid` event and send a confirmation email.
```

### Background Jobs / Async Processing

```
AC-1: When [trigger], the system shall enqueue a job and return a job ID to the caller immediately.
AC-2: The system shall process enqueued jobs within 30 seconds under normal load.
AC-3: If a job fails, the system shall retry up to 3 times before marking it as failed and alerting [channel].
AC-4: The system shall expose a `/jobs/{id}/status` endpoint returning current state (pending/running/complete/failed).
```

### UI / Frontend

```
AC-1: When the page loads, the system shall display the [component] within 2 seconds on a standard connection.
AC-2: When a form submission fails validation, the system shall highlight invalid fields and display inline error messages.
AC-3: While data is loading, the system shall display a loading indicator.
AC-4: When the user is on a mobile viewport (< 768px), the system shall render a responsive single-column layout.
AC-5: If a network error occurs, the system shall display a user-friendly error message and offer a retry option.
```

---

## Tips for Writing Good EARS Criteria

1. **One behavior per criterion** — don't combine two things with "and"
2. **Be specific** — use numbers (500ms, 10MB, 3 retries) not vague terms ("fast", "large")
3. **Make it testable** — a QA engineer should be able to write an automated test from the AC
4. **Cover the unhappy path** — for every "When X succeeds" add an "If X fails"
5. **Avoid implementation details** — say *what* the system shall do, not *how*