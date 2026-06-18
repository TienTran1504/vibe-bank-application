---
name: review-solid
description: SOLID principles and code quality review for Java Spring Boot microservices — single responsibility, open/closed, dependency inversion, proper service layering. Use during code review or after building a new service.
disable-model-invocation: true
---

Review the specified service(s) for SOLID principles and Java code quality. $ARGUMENTS

Read all source files under `services/<service-name>/src/main/java/` and understand the package structure before reviewing.

---

## 1. Single Responsibility Principle (SRP)

For each class, ask: "Does it have exactly one reason to change?"

- [ ] `@RestController` classes handle ONLY HTTP concerns (request mapping, validation, response shaping) — no business logic
- [ ] `@Service` classes handle ONLY business logic — no HTTP concerns (`HttpServletRequest`, `ResponseEntity`) and no direct DB queries
- [ ] `@Repository` interfaces handle ONLY data access — no business rules
- [ ] Kafka event producers separated from business logic (via a dedicated `EventPublisher` service)
- [ ] No "God service" class handling auth + profile + KYC + notifications all in one

**Flag**: Any class > 300 lines — likely violating SRP.

## 2. Open/Closed Principle (OCP)

- [ ] Transaction type handling uses a `TransactionStrategy` interface (or similar) — not a `switch (type)` in the service
- [ ] Fraud rule engine uses a list of `FraudRule` implementations — adding a rule = adding a class, not modifying existing code
- [ ] Notification channels (push, email, SMS) implemented as a `NotificationChannel` interface — adding a channel = new class
- [ ] No long `if/else if` chains checking entity types or statuses where polymorphism would work

## 3. Liskov Substitution Principle (LSP)

- [ ] Service implementations can be swapped for their interfaces without breaking callers
- [ ] Test doubles (Mockito mocks) work because interfaces are properly designed
- [ ] No base class that throws `UnsupportedOperationException` in subclass implementations

## 4. Interface Segregation Principle (ISP)

- [ ] Service interfaces are focused — not one interface with 15 methods when callers only use 2
- [ ] `AccountService` interface splits read operations from write operations if callers differ
- [ ] Kafka consumer doesn't depend on the full `TransactionService` when it only needs `updateStatus()`

## 5. Dependency Inversion Principle (DIP)

- [ ] `@Service` classes depend on `@Repository` interfaces — not concrete implementation classes
- [ ] No `new ConcreteClass()` inside `@Service` or `@Controller` — use `@Autowired` / constructor injection
- [ ] Constructor injection used (not `@Autowired` on fields) — makes dependencies explicit and testable
- [ ] External clients (fraud service, notification service) injected as interfaces — not instantiated directly

## 6. General Spring Boot Quality

- [ ] Package structure: `controller/`, `service/`, `repository/`, `domain/`, `dto/`, `event/`, `config/`
- [ ] `@Entity` classes NOT used as API request/response bodies — separate DTOs for all API boundaries
- [ ] No `@Transactional` on controllers — only on `@Service` methods
- [ ] `@Transactional(readOnly = true)` on query-only service methods
- [ ] No business logic in `@Configuration` classes
- [ ] Lombok `@Builder` used for DTOs — no manual builder pattern

## 7. Test Quality

- [ ] Service layer unit tests mock the repository (not `@SpringBootTest`) — fast, isolated
- [ ] Controller integration tests use `MockMvc` — verify request/response contract
- [ ] Test class names: `{ClassName}Test` for unit, `{ClassName}IT` for integration
- [ ] No `Thread.sleep()` in tests — use `Awaitility` for async assertions

---

## Output

Rate each SOLID principle (1–10) for each service reviewed.

For each violation:
```
**[Principle]** — [ClassName.java:approx line]
Violation: [what it does wrong]
Impact: [why it matters for maintainability]
Refactor: [specific change — interface to create, method to extract, etc.]
Priority: [1–10]
```

Write to `audits/solid-review-<service-name>-<date>.md`.
