package com.bankapp.fraud.service;

import com.bankapp.fraud.dto.FraudCheckRequest;
import com.bankapp.fraud.dto.FraudCheckResponse;

public interface FraudService {
    FraudCheckResponse check(FraudCheckRequest request);
}
