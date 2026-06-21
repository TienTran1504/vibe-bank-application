package com.bankapp.account.service;

import com.bankapp.account.dto.AccountResponse;
import com.bankapp.account.dto.CreateAccountRequest;
import com.bankapp.account.dto.TopUpRequest;
import com.bankapp.account.event.KycApprovedEvent;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AccountService {
    AccountResponse createAccount(UUID userId, CreateAccountRequest request);
    List<AccountResponse> getMyAccounts(UUID userId);
    AccountResponse getAccount(UUID accountId, UUID userId);
    AccountResponse lookupByAccountNumber(String accountNumber);
    AccountResponse topUp(UUID accountId, UUID userId, TopUpRequest request);
    void creditAccount(UUID accountId, BigDecimal amount);
    void handleKycApproved(KycApprovedEvent event);
    void handlePaymentCreated(Map<String, Object> event);
}
