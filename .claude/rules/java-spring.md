---
paths:
  - "services/**/*.java"
  - "services/**/pom.xml"
---

# Java / Spring Boot Rules

## General Java
- Java 21 — use records for DTOs, sealed classes for domain models where appropriate
- Always use `final` for fields injected via constructor
- Prefer constructor injection over `@Autowired` field injection
- Use Lombok: `@Getter`, `@Builder`, `@RequiredArgsConstructor`, `@Slf4j`
- No wildcard imports (`import com.example.*` is forbidden)
- Max method length: 30 lines — extract helper methods beyond that

## Spring Boot Conventions
- Each microservice is a separate Maven module with its own `pom.xml`
- Package structure per service: `controller`, `service`, `repository`, `domain`, `dto`, `config`, `event`
- Use `@RestController` + `@RequestMapping("/api/v1/<resource>")`
- Return `ResponseEntity<T>` from all controller methods
- Use `@Valid` on all request body parameters
- Global exception handler in each service via `@RestControllerAdvice`

## REST API Design
- URL paths: kebab-case (`/user-accounts`, not `/userAccounts`)
- JSON properties: camelCase
- HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE
- Always return proper HTTP status codes (201 for create, 204 for delete, etc.)
- Paginated lists: use `Page<T>` and include `page`, `size`, `totalElements`, `totalPages`

## Database (JPA / Spring Data)
- One `@Entity` per database table, in the `domain` package
- Use `@Repository` interfaces extending `JpaRepository<Entity, UUID>`
- All primary keys: `UUID` type with `@GeneratedValue(strategy = GenerationType.UUID)`
- Use `@CreatedDate` and `@LastModifiedDate` from Spring Data Auditing
- Never load lazy collections outside of a transaction — use `@Transactional`
- Write named queries in JPQL, not native SQL, unless there's a strong reason

## Kafka
- Producers: use `KafkaTemplate<String, Object>` with JSON serialization
- Consumer method annotation: `@KafkaListener(topics = "topic-name", groupId = "service-name")`
- Event classes: suffix with `Event` (e.g., `TransactionCreatedEvent`)
- Events go in a `event` package; topic names are kebab-case strings

## Security
- NEVER log sensitive data (passwords, tokens, card numbers, account numbers)
- Always validate and sanitize external input at the controller level
- Use `@PreAuthorize` for method-level security
- Store secrets in environment variables or Spring Cloud Config, never in code or `application.properties`

## Testing
- Unit tests: JUnit 5 + Mockito, class name suffix `Test`
- Integration tests: `@SpringBootTest` + `@AutoConfigureMockMvc`, suffix `IT`
- Test coverage target: 80% minimum for service layer
- Run tests with: `mvn test`
