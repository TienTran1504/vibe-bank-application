package com.bankapp.base.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private final String error;
    private final String message;
    private final List<FieldError> details;
    private final Instant timestamp;
    private final String traceId;

    @Getter
    @Builder
    public static class FieldError {
        private final String field;
        private final String message;
    }
}
