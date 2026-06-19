package com.bankapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class CreateProfileRequest {

    @NotBlank
    @Size(max = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    private String lastName;

    @Past
    private LocalDate dateOfBirth;

    @Size(max = 500)
    private String address;

    @Pattern(regexp = "[A-Z]{2}", message = "must be a 2-letter ISO country code")
    private String countryCode;
}
