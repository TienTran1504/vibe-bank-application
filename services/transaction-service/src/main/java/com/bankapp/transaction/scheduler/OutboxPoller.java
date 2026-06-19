package com.bankapp.transaction.scheduler;

import com.bankapp.transaction.domain.entity.TransactionOutbox;
import com.bankapp.transaction.domain.repository.TransactionOutboxRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxPoller {

    private final TransactionOutboxRepository outboxRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void pollAndPublish() {
        List<TransactionOutbox> pending =
                outboxRepository.findTop50ByStatusOrderByCreatedAtAsc(TransactionOutbox.OutboxStatus.PENDING);

        for (TransactionOutbox record : pending) {
            try {
                Map<String, Object> payload = objectMapper.readValue(
                        record.getPayload(), new TypeReference<>() {});
                kafkaTemplate.send(record.getTopic(), record.getMessageKey(), payload).get();
                record.setStatus(TransactionOutbox.OutboxStatus.PUBLISHED);
                record.setPublishedAt(Instant.now());
                outboxRepository.save(record);
                log.debug("Published outbox record id={} topic={}", record.getId(), record.getTopic());
            } catch (Exception e) {
                log.error("Failed to publish outbox record id={}", record.getId(), e);
                record.setStatus(TransactionOutbox.OutboxStatus.FAILED);
                outboxRepository.save(record);
            }
        }
    }
}
