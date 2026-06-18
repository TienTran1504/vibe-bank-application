---
name: new-endpoint
description: Add a new REST API endpoint to an existing microservice — including controller method, service method, DTO, validation, and OpenAPI docs.
disable-model-invocation: true
---

Add a new REST API endpoint. Description: $ARGUMENTS

Steps:

1. **Understand the request** — parse the endpoint description to identify:
   - Which service (look in `services/`)
   - HTTP method and URL path
   - Request body / query params
   - Response body
   - Authorization role required

2. **Read existing code** — look at an existing controller and service in the target service to match the existing patterns.

3. **Create the request DTO** in `dto/request/` — a record or class with `@NotNull`/`@NotBlank`/`@Size` validation annotations and Javadoc.

4. **Create the response DTO** in `dto/response/` — immutable record with all fields the client needs.

5. **Add the service method** — pure business logic, no HTTP concerns. Include `@Transactional` if writing to DB.

6. **Add the controller method**:
   - `@Operation(summary = "...")` and `@ApiResponse` annotations
   - `@Valid` on request body
   - Correct HTTP method and status code
   - Call the service method

7. **Add tests**:
   - Unit test for the service method (mock the repository)
   - Integration test for the controller endpoint (MockMvc)

8. **Check security** — does this endpoint need `@PreAuthorize`? Should it be rate-limited?

9. Run `mvn test` and fix any failures.
