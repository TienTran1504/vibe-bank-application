package com.bankapp.account.controller;

import com.bankapp.account.domain.repository.BankAccountRepository;
import com.bankapp.account.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/accounts")
@RequiredArgsConstructor
public class InternalAccountController {

    private final BankAccountRepository accountRepository;
    private final AccountService accountService;

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

    @PostMapping("/{accountId}/credit")
    public ResponseEntity<Map<String, String>> creditAccount(
            @PathVariable UUID accountId,
            @RequestBody Map<String, String> body) {
        BigDecimal amount = new BigDecimal(body.get("amount"));
        accountService.creditAccount(accountId, amount);
        return ResponseEntity.ok(Map.of("status", "credited", "accountId", accountId.toString()));
    }
}
