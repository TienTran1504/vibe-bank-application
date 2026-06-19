package com.bankapp.transaction.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserKycClient {

    private final RestTemplate restTemplate;

    @Value("${user-service.url:http://localhost:8081}")
    private String userServiceUrl;

    public boolean isKycApproved(String userId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    userServiceUrl + "/internal/v1/users/" + userId + "/kyc-status",
                    Map.class);
            return response != null && "APPROVED".equals(response.get("status"));
        } catch (Exception e) {
            log.warn("Could not fetch KYC status for userId={}, defaulting to false", userId, e);
            return false;
        }
    }
}
