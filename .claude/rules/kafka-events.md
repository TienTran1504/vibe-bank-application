---
paths:
  - "services/**/event/**"
  - "services/**/kafka/**"
  - "services/**/producer/**"
  - "services/**/consumer/**"
---

# Kafka Event Design Rules

## Topic Naming Convention
Format: `<domain>.<entity>.<action>` (all kebab-case)

| Topic | Producer | Consumers |
|-------|----------|-----------|
| `transaction.payment.created` | transaction-service | notification-service, fraud-service, analytics-service |
| `transaction.payment.completed` | transaction-service | account-service, notification-service |
| `transaction.payment.failed` | transaction-service | notification-service, account-service |
| `user.account.registered` | user-service | notification-service |
| `user.kyc.approved` | user-service | account-service, notification-service |
| `account.balance.updated` | account-service | analytics-service |
| `fraud.alert.raised` | fraud-service | notification-service, transaction-service |
| `notification.push.send` | any service | notification-service |

## Event Schema Rules
- All events extend a base event class with: `eventId` (UUID), `timestamp`, `version`, `correlationId`
- Event payloads are immutable POJOs / records
- Use semantic versioning for event schemas — add fields, never remove
- All amounts in events: use `String` representation of `BigDecimal` (e.g., `"150.75"`)
- All timestamps: ISO-8601 format with UTC timezone

## Event Class Template (Java)
```java
public record TransactionCreatedEvent(
    String eventId,
    String correlationId,
    Instant timestamp,
    String version,        // "1.0"
    String transactionId,
    String fromAccountId,
    String toAccountId,
    String amount,         // BigDecimal as String
    String currency,       // ISO 4217 (e.g., "USD")
    TransactionType type
) {}
```

## Consumer Rules
- Every consumer group has a unique `groupId` per service
- Use `@KafkaListener` with explicit `topics` and `groupId`
- Consumer methods must be idempotent — the same event may arrive more than once
- On failure: use a dead-letter topic (`<topic-name>.DLT`) instead of blocking the consumer
- Log every consumed event with `correlationId` for tracing
- Never commit Kafka offset until business logic succeeds

## Producer Rules
- Always include `correlationId` (propagate from the incoming HTTP request)
- Use async send (`kafkaTemplate.send(...).whenComplete(...)`)
- On send failure: log the event to the outbox table (transactional outbox pattern)
