---
name: new-service
description: Scaffold a new Spring Boot microservice with all boilerplate — Maven module, domain entity, repository, service layer, REST controller, Kafka events, Flyway migration, and Docker config.
disable-model-invocation: true
---

Scaffold a new Spring Boot microservice for the bank app. Service name: $ARGUMENTS

Follow these steps exactly:

1. **Read the architecture overview** at `docs/00-architecture-overview.md` and `docs/02-api-contracts.md` to understand conventions.

2. **Create the Maven module** at `services/<service-name>/`:
   - `pom.xml` inheriting from parent BOM, with spring-boot-starter-web, spring-boot-starter-data-jpa, spring-kafka, lombok, flyway dependencies
   - `src/main/java/com/bankapp/<servicename>/` package structure: `controller/`, `service/`, `repository/`, `domain/`, `dto/`, `event/`, `config/`, `exception/`
   - `src/main/resources/application.yml` with service name, port, Kafka config, DB config
   - `src/test/java/...` with a basic integration test skeleton

3. **Create the domain entity** — a `@Entity` class with UUID primary key, audit fields (`createdAt`, `updatedAt`), and relevant business fields.

4. **Create the Flyway migration** at `src/main/resources/db/migration/V1__create_<table_name>_table.sql` with proper PostgreSQL DDL (NUMERIC for money, TIMESTAMPTZ for dates, indexes).

5. **Create the repository** — a `@Repository` interface extending `JpaRepository<Entity, UUID>`.

6. **Create the service layer** — a `@Service` class with the main business methods, injecting the repository.

7. **Create the REST controller** — `@RestController` at `/api/v1/<resource>`, with CRUD endpoints returning `ResponseEntity<T>`, request validation with `@Valid`.

8. **Create Kafka events** — at least one event class in the `event/` package for the main domain action.

9. **Create a `Dockerfile`** in the service directory using a multi-stage build (Maven build + JRE runtime).

10. **Add the service to `docker-compose.yml`** in the project root with proper environment variables.

After scaffolding, run `mvn compile` in the new module and fix any compilation errors before reporting done.
