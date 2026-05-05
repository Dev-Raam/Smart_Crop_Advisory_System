package com.smartcrop.backend.dto;

public record UpdateProfileRequest(
        String name,
        String language,
        LocationRequest location
) {

    public record LocationRequest(Double lat, Double lon) {
    }
}
