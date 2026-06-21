package com.bankapp.notification.controller;

import com.bankapp.base.dto.ApiResponse;
import com.bankapp.base.dto.PageResponse;
import com.bankapp.notification.dto.NotificationResponse;
import com.bankapp.notification.security.GatewayAuthContext;
import com.bankapp.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        var result = notificationService.listNotifications(
                ctx.userId().toString(),
                PageRequest.of(page, Math.min(size, 100)));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result.map(NotificationResponse::from))));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        long count = notificationService.countUnread(ctx.userId().toString());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(@PathVariable String id) {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        var updated = notificationService.markRead(ctx.userId().toString(), id);
        return ResponseEntity.ok(ApiResponse.ok(NotificationResponse.from(updated)));
    }
}
