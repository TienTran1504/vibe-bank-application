---
name: audit-input
description: Input validation audit — SQL/NoSQL injection, XSS, command injection, path traversal, mass assignment, request body validation across all API endpoints. Use when reviewing controller and service code.
disable-model-invocation: true
---

Audit input validation and injection prevention across all API endpoints. $ARGUMENTS

Read all `@RestController` classes in `services/`, React Native API service functions in `mobile/src/services/`, and admin API calls in `admin/src/services/`.

---

## Checklist

### Spring Boot Controllers (All Services)

**Request Body Validation**
- [ ] Every `@PostMapping` / `@PutMapping` / `@PatchMapping` method has `@Valid` on the request body parameter
- [ ] Request DTO fields have `@NotNull`, `@NotBlank`, `@Size`, `@DecimalMin` annotations where appropriate
- [ ] `@GlobalExceptionHandler` returns 400 with field-level error details for `MethodArgumentNotValidException`
- [ ] No controller reads from `HttpServletRequest` directly without sanitizing

**Path Variable & Query Parameter Validation**
- [ ] `@PathVariable` UUIDs validated as UUID format (use `@Pattern` or UUID parsing)
- [ ] `@RequestParam` strings have max length constraint
- [ ] No user-supplied `page` parameter larger than 100 (max page size enforced)

**SQL Injection**
- [ ] All Spring Data JPA `@Query` with user input uses `:namedParam` or `?1` — no string concatenation
- [ ] No `EntityManager.createNativeQuery(sql + userInput)` pattern
- [ ] LIKE queries: user input escaped for `%` and `_` characters before binding

**NoSQL Injection (MongoDB)**
- [ ] User input not passed as raw `Document` or `BasicDBObject` — use `Criteria.where("field").is(value)` builder
- [ ] `$where` never used with user-supplied JavaScript
- [ ] Operator keys (`$gt`, `$ne`, etc.) never come from user request body

**Command Injection**
- [ ] No `Runtime.getRuntime().exec()` or `ProcessBuilder` with user-controlled input
- [ ] No `@Value` injection of user-supplied values into shell execution

**File Upload / Download**
- [ ] Uploaded files validated for MIME type (Content-Type header + magic bytes inspection)
- [ ] Filename sanitized — path traversal characters (`../`, `..\\`, `/`) stripped
- [ ] File size limit enforced (`spring.servlet.multipart.max-file-size`)
- [ ] Files stored in S3/cloud storage — not on local filesystem
- [ ] Download path cannot traverse outside the allowed directory

**Mass Assignment**
- [ ] User registration cannot set: `role`, `status`, `kycStatus`, `mfaEnabled`, `emailVerified`
- [ ] Account creation cannot set: `balance`, `status`, `userId` (must come from authenticated JWT)
- [ ] Transfer request cannot set: `status`, `completedAt`, `errorCode`
- [ ] Use separate request DTOs (not the `@Entity` directly) for all inputs

**SSRF Prevention (if any HTTP calls to user-supplied URLs)**
- [ ] User-supplied URLs validated against allowlist of domains
- [ ] Internal IP ranges blocked: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `127.x.x.x`, `169.254.x.x`
- [ ] Redirect following disabled or validated

### React Native (`mobile/src/`)

**API Calls**
- [ ] All user input trimmed and length-validated client-side before API call (defense in depth)
- [ ] Amount input: numeric-only keypad, no free-text amount field
- [ ] Recipient lookup: validates email format or account number format before sending
- [ ] Deep link parameters validated — no arbitrary URLs accepted from deep links

### Admin Dashboard (`admin/src/`)

**Rendered Content**
- [ ] No `dangerouslySetInnerHTML` with user-generated content
- [ ] User names / descriptions rendered as text nodes, not HTML
- [ ] Table cells with user data escaped by React by default (verify no explicit raw HTML rendering)

---

## Output

Create a **validation matrix** — one row per endpoint:

| Endpoint | @Valid | DTO constraints | SQL safe | Auth checked |
|---|---|---|---|---|
| POST /api/v1/auth/register | ✅ | ✅ | N/A | N/A |
| POST /api/v1/transactions/transfer | ❌ missing | ✅ | ✅ | ✅ |

For each **Fail**:
```
**[SEVERITY]** — [Injection type / Validation gap]
File: `ControllerName.java:line`
Issue: [what is missing]
Impact: [attack vector]
Fix: [annotation or code change]
```

Write to `audits/input-validation-audit-<date>.md`.
