package com.bankapp.fraud.controller;

import com.bankapp.fraud.dto.FraudCheckRequest;
import com.bankapp.fraud.dto.FraudCheckResponse;
import com.bankapp.fraud.service.FraudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/fraud")
@RequiredArgsConstructor
public class FraudController {

    private final FraudService fraudService;

    @PostMapping("/check")
    public ResponseEntity<FraudCheckResponse> check(@Valid @RequestBody FraudCheckRequest request) {
        return ResponseEntity.ok(fraudService.check(request));
    }
}
