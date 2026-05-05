package com.smartcrop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Phone is required.") String phone,
        @NotBlank(message = "Password is required.") String password,
        String language
) {
}
