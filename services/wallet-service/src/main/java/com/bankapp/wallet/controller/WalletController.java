package com.bankapp.wallet.controller;

import com.bankapp.base.dto.ApiResponse;
import com.bankapp.base.dto.PageResponse;
import com.bankapp.wallet.dto.TopUpRequest;
import com.bankapp.wallet.dto.WalletResponse;
import com.bankapp.wallet.dto.WalletTransactionResponse;
import com.bankapp.wallet.dto.WithdrawRequest;
import com.bankapp.wallet.security.GatewayAuthContext;
import com.bankapp.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(walletService.getOrCreateWallet(ctx.userId())));
    }

    @PostMapping("/top-up")
    public ResponseEntity<ApiResponse<WalletResponse>> topUp(@Valid @RequestBody TopUpRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(walletService.topUp(ctx.userId(), request)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WalletResponse>> withdraw(@Valid @RequestBody WithdrawRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(walletService.withdraw(ctx.userId(), request)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PageResponse<WalletTransactionResponse>>> listTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        Page<WalletTransactionResponse> result = walletService.listTransactions(
                ctx.userId(),
                PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result)));
    }
}
