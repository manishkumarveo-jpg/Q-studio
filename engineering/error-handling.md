# Error Handling

+## Error handling

Use typed error codes: validation_failed, unauthenticated, forbidden, not_found, conflict, rate_limited, dependency_failed, job_failed. Do not expose SQL, object keys, token values or stack traces. UI turns errors into contextual retry/cancel/reload choices; background jobs record permanent failure only after bounded retry/backoff.
