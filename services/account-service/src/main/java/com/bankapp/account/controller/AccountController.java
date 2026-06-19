package com.bankapp.account.controller;

import com.bankapp.account.dto.AccountResponse;
import com.bankapp.account.dto.CreateAccountRequest;
import com.bankapp.account.dto.TopUpRequest;
import com.bankapp.account.security.GatewayAuthContext;
import com.bankapp.account.service.AccountService;
import com.bankapp.base.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        AccountResponse response = accountService.createAccount(ctx.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getMyAccounts() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(accountService.getMyAccounts(ctx.userId())));
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(
            @PathVariable UUID accountId) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccount(accountId, ctx.userId())));
    }

    @PostMapping("/{accountId}/top-up")
    public ResponseEntity<ApiResponse<AccountResponse>> topUp(
            @PathVariable UUID accountId,
            @Valid @RequestBody TopUpRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(accountService.topUp(accountId, ctx.userId(), request)));
    }
}
