package com.bankapp.transaction.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class FraudClient {

    private final RestTemplate restTemplate;

    @Value("${fraud-service.url:http://localhost:8088}")
    private String fraudServiceUrl;

    public FraudCheckResponse check(FraudCheckRequest request) {
        try {
            FraudCheckResponse response = restTemplate.postForObject(
                    fraudServiceUrl + "/internal/v1/fraud/check",
                    request,
                    FraudCheckResponse.class);
            return response != null ? response : approved();
        } catch (Exception e) {
            // Fail open: fraud service unavailable → allow, flag for review
            log.error("Fraud service unreachable, failing open for transactionId={}", request.getTransactionId(), e);
            return approved();
        }
    }

    private FraudCheckResponse approved() {
        FraudCheckResponse r = new FraudCheckResponse();
        r.setApproved(true);
        return r;
    }
}
