package com.bankapp.analytics.exception;

import com.bankapp.base.dto.ErrorResponse;
import com.bankapp.base.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(ErrorResponse.builder()
                        .error(ex.getErrorCode())
                        .message(ex.getMessage())
                        .timestamp(Instant.now())
                        .traceId(UUID.randomUUID().toString())
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.builder()
                        .error("INTERNAL_ERROR")
                        .message("An unexpected error occurred")
                        .timestamp(Instant.now())
                        .traceId(UUID.randomUUID().toString())
                        .build());
    }
}
