package com.smartcrop.backend.dto;

public record ChatRequest(
        String message,
        String language,
        ChatContext context
) {

    public record ChatContext(
            String locationName,
            Double temperature,
            Double humidity,
            Double windSpeed
    ) {
    }
}
