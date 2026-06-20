package com.bankapp.user.controller;

import com.bankapp.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @GetMapping("/{userId}/kyc-status")
    public ResponseEntity<Map<String, String>> getKycStatus(@PathVariable UUID userId) {
        String status = userService.getKycStatusRaw(userId);
        return ResponseEntity.ok(Map.of("userId", userId.toString(), "status", status));
    }

    @GetMapping("/{userId}/name")
    public ResponseEntity<Map<String, String>> getUserName(@PathVariable UUID userId) {
        try {
            var profile = userService.getProfile(userId);
            String fullName = (profile.getFirstName() + " " + profile.getLastName()).trim();
            return ResponseEntity.ok(Map.of("userId", userId.toString(), "fullName", fullName));
        } catch (Exception e) {
            // No profile yet — return empty name so callers can fall back gracefully
            return ResponseEntity.ok(Map.of("userId", userId.toString(), "fullName", ""));
        }
    }
}
