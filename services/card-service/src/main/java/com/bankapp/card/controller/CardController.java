package com.bankapp.card.controller;

import com.bankapp.base.dto.ApiResponse;
import com.bankapp.card.dto.CardResponse;
import com.bankapp.card.dto.CreatePhysicalCardRequest;
import com.bankapp.card.dto.CreateVirtualCardRequest;
import com.bankapp.card.dto.FreezeCardRequest;
import com.bankapp.card.dto.SpendingLimitRequest;
import com.bankapp.card.security.GatewayAuthContext;
import com.bankapp.card.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
