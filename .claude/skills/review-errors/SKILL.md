---
name: review-errors
description: Error handling and resilience review — centralized exception handler, circuit breakers, Kafka consumer error handling, retry logic, graceful degradation. Use after building a service or when diagnosing instability.
disable-model-invocation: true
---

Review error handling, resilience, and fault tolerance in the specified service(s). $ARGUMENTS

Read all source files, focusing on exception handlers, `@RestControllerAdvice`, Kafka listener error handlers, and external service calls.

---

## Checklist

### 1. Centralized Error Handling (Spring Boot)

- [ ] Each service has exactly one `@RestControllerAdvice` class in the `exception/` package
- [ ] It handles: `MethodArgumentNotValidException` → 400, `NotFoundException` → 404, `InsufficientFundsException` → 422, `DuplicateRequestException` → 409, `FraudBlockedException` → 403, generic `Exception` → 500
- [ ] Error response format matches the API contract: `{ error, message, details, timestamp, traceId }`
- [ ] `traceId` (correlation ID from request header or MDC) included in every error response
- [ ] Stack traces NOT included in response bodies (only in server logs)
- [ ] Error messages are user-safe — no internal class names, SQL errors, or DB field names leaked

### 2. HTTP Error Categories

- [ ] 400 Bad Request: all `@Valid` violations caught and formatted
- [ ] 401 Unauthorized: JWT missing / expired — handled by gateway, not leaked as 500
- [ ] 403 Forbidden: `AccessDeniedException` from `@PreAuthorize` caught and formatted
- [ ] 404 Not Found: entity not found returns 404, not 500 NullPointerException
- [ ] 409 Conflict: idempotency key collision returns 409 with original response
- [ ] 422 Unprocessable: insufficient funds, account frozen, KYC required — business rule failures
- [ ] 429 Too Many Requests: rate limit exceeded — handled at gateway level
- [ ] 500 Internal: no sensitive info exposed — generic message + traceId only

### 3. Async Error Handling (Kafka Consumers)

- [ ] All `@KafkaListener` methods have `try/catch` — exceptions don't crash the consumer thread
- [ ] Business logic exceptions → log + dead-letter topic (`topic.DLT`) — don't rethrow to Kafka
- [ ] Kafka offset only committed after successful business logic processing
- [ ] Dead-letter topic events include original event, error reason, timestamp, and retry count
- [ ] Consumer group has a `DefaultErrorHandler` with `DeadLetterPublishingRecoverer` configured
- [ ] No infinite retry loop — backoff with a max of 3 retries before DLT

### 4. External Service Calls (Fraud Check, Notification, etc.)

- [ ] All `RestTemplate` / `WebClient` calls have timeouts (connect timeout and read timeout)
- [ ] Default timeouts set: connect ≤ 2s, read ≤ 5s — not unlimited
- [ ] `ConnectTimeoutException` and `ReadTimeoutException` caught and handled (don't propagate as 500)
- [ ] Circuit breaker applied on fraud service call — if unavailable, transfer is HELD not approved
- [ ] Resilience4j `@CircuitBreaker`, `@Retry`, or `@TimeLimiter` used for inter-service HTTP calls
- [ ] Fallback defined for each circuit breaker — returns safe default, not null

### 5. Database Error Handling

- [ ] `DataIntegrityViolationException` (FK violation, unique constraint) caught and translated to business exception
- [ ] `OptimisticLockingFailureException` (version conflict on concurrent update) has retry logic
- [ ] `TransactionSystemException` caught — transaction rollback handled gracefully
- [ ] Connection pool exhausted: `CannotGetJdbcConnectionException` returns 503, not 500

### 6. Graceful Degradation

- [ ] Analytics service failure doesn't block the main transaction flow
- [ ] Notification service failure: transaction still completes, notification queued for retry
- [ ] Non-critical Kafka publish failures logged and requeued via outbox — don't fail the HTTP response

### 7. Logging Quality

- [ ] All caught exceptions logged with `log.error("message", e)` including stack trace
- [ ] Correlation/trace ID in MDC (`MDC.put("traceId", correlationId)`) for all log lines in a request
- [ ] Log level appropriate: `ERROR` for unexpected failures, `WARN` for expected business errors (insufficient funds), `INFO` for normal events
- [ ] No `e.printStackTrace()` — use structured logging (`@Slf4j` + `log.error`)
- [ ] Sensitive data NOT in log messages (amounts OK; account numbers, names, tokens — NO)

### 8. React Native Error Handling (Mobile)

- [ ] React Query errors handled at component level — `isError` state shows user-friendly message
- [ ] Network error (offline): toast shown, retry button visible
- [ ] Auth error (401): `queryClient.clear()` + navigate to login
- [ ] Business error (insufficient funds, fraud blocked): full-screen error with exact reason message
- [ ] No raw error objects rendered to the user — only cleaned message strings

---

## Output

For each **Fail**:
```
[Severity 1–10] — [Item]
File: `path/to/file.java:line`
Issue: [what is missing or wrong]
Risk: [what happens to the user or system in production]
Fix: [code snippet or pattern to implement]
```

Write to `audits/error-handling-review-<date>.md` with a summary table per service.
