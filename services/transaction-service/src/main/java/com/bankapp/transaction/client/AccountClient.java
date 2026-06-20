package com.bankapp.transaction.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountClient {

    private final RestTemplate restTemplate;

    @Value("${account-service.url:http://account-service:8082}")
    private String accountServiceUrl;

    public String getAccountCurrency(UUID accountId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> response = restTemplate.getForObject(
                    accountServiceUrl + "/internal/v1/accounts/" + accountId + "/currency",
                    Map.class);
            return response != null ? response.getOrDefault("currency", "USD") : "USD";
        } catch (Exception e) {
            log.warn("Could not fetch currency for accountId={}, defaulting to USD", accountId, e);
            return "USD";
        }
    }
}
