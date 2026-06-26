package com.bankapp.card.controller;

import com.bankapp.base.dto.ApiResponse;
import com.bankapp.base.dto.PageResponse;
import com.bankapp.card.dto.CardPaymentRequest;
import com.bankapp.card.dto.CardResponse;
import com.bankapp.card.dto.CardTransactionResponse;
import com.bankapp.card.dto.CreatePhysicalCardRequest;
import com.bankapp.card.dto.CreateVirtualCardRequest;
import com.bankapp.card.dto.FreezeCardRequest;
import com.bankapp.card.dto.SpendingLimitRequest;
import com.bankapp.card.security.GatewayAuthContext;
import com.bankapp.card.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CardResponse>>> listCards() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(cardService.listCards(ctx.userId())));
    }

    @PostMapping("/virtual")
    public ResponseEntity<ApiResponse<CardResponse>> createVirtualCard(
            @Valid @RequestBody CreateVirtualCardRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        CardResponse card = cardService.createVirtualCard(ctx.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(card));
    }

    @PostMapping("/physical")
    public ResponseEntity<ApiResponse<CardResponse>> requestPhysicalCard(
            @Valid @RequestBody CreatePhysicalCardRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        CardResponse card = cardService.requestPhysicalCard(ctx.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(card));
    }

    @PutMapping("/{cardId}/freeze")
    public ResponseEntity<ApiResponse<CardResponse>> freezeCard(
            @PathVariable UUID cardId,
            @Valid @RequestBody FreezeCardRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(cardService.freezeCard(ctx.userId(), cardId, request)));
    }

    @PutMapping("/{cardId}/limits")
    public ResponseEntity<ApiResponse<CardResponse>> setSpendingLimit(
            @PathVariable UUID cardId,
            @Valid @RequestBody SpendingLimitRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(cardService.setSpendingLimit(ctx.userId(), cardId, request)));
    }

    @PostMapping("/{cardId}/pay")
    public ResponseEntity<ApiResponse<CardTransactionResponse>> pay(
            @PathVariable UUID cardId,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CardPaymentRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        CardTransactionResponse tx = cardService.payWithCard(ctx.userId(), cardId, idempotencyKey, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(tx));
    }

    @GetMapping("/{cardId}/transactions")
    public ResponseEntity<ApiResponse<PageResponse<CardTransactionResponse>>> cardTransactions(
            @PathVariable UUID cardId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        var result = cardService.listCardTransactions(ctx.userId(), cardId,
                PageRequest.of(page, Math.min(size, 100)));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result)));
    }
}
