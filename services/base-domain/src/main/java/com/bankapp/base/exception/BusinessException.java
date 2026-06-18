package com.bankapp.base.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    public BusinessException(String errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public static BusinessException unauthorized(String message) {
        return new BusinessException("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }

    public static BusinessException forbidden(String message) {
        return new BusinessException("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException("NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException("CONFLICT", message, HttpStatus.CONFLICT);
    }

    public static BusinessException unprocessable(String errorCode, String message) {
        return new BusinessException(errorCode, message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
