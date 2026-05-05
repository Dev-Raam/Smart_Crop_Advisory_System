package com.smartcrop.backend.dto;

public record AuthResponse(String token, UserResponse user) {
}
