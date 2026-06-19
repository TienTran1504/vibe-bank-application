package com.bankapp.user.controller;

import com.bankapp.base.dto.ApiResponse;
import com.bankapp.user.dto.CreateProfileRequest;
import com.bankapp.user.dto.KycStatusResponse;
import com.bankapp.user.dto.KycSubmitRequest;
import com.bankapp.user.dto.UpdateProfileRequest;
import com.bankapp.user.dto.UserProfileResponse;
import com.bankapp.user.security.GatewayAuthContext;
import com.bankapp.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> createProfile(
            @Valid @RequestBody CreateProfileRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        UserProfileResponse response = userService.createProfile(ctx.userId(), ctx.email(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(ctx.userId())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(ctx.userId(), request)));
    }

    @PostMapping("/me/kyc")
    public ResponseEntity<ApiResponse<KycStatusResponse>> submitKyc(
            @Valid @RequestBody KycSubmitRequest request) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        KycStatusResponse response = userService.submitKyc(ctx.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/me/kyc")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getKycStatus() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(userService.getKycStatus(ctx.userId())));
    }
}
