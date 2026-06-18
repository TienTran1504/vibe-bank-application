package com.bankapp.base.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final T data;
    private final String message;
    private final Instant timestamp;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .message("Success")
                .timestamp(Instant.now())
                .build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
                .data(data)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }
}
