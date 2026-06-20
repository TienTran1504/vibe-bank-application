package com.bankapp.account.controller;

import com.bankapp.account.domain.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/accounts")
@RequiredArgsConstructor
public class InternalAccountController {

    private final BankAccountRepository accountRepository;

    @GetMapping("/{accountId}/currency")
    public ResponseEntity<Map<String, String>> getAccountCurrency(@PathVariable UUID accountId) {
        return accountRepository.findById(accountId)
                .map(a -> ResponseEntity.ok(Map.of(
                        "accountId", accountId.toString(),
                        "currency", a.getCurrency())))
                .orElse(ResponseEntity.ok(Map.of(
                        "accountId", accountId.toString(),
                        "currency", "USD")));
    }
}
