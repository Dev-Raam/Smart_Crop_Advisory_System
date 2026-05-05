package com.smartcrop.backend.dto;

import com.smartcrop.backend.model.User;
import java.time.Instant;

public record UserResponse(
        String id,
        String name,
        String phone,
        String language,
        LocationResponse location,
        Instant createdAt,
        Instant updatedAt
) {

    public static UserResponse from(User user) {
        LocationResponse locationResponse = user.getLocation() == null
                ? null
                : new LocationResponse(user.getLocation().getLat(), user.getLocation().getLon());

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getPhone(),
                user.getLanguage(),
                locationResponse,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public record LocationResponse(Double lat, Double lon) {
    }
}
