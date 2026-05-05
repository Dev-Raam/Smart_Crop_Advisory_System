package com.smartcrop.backend.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, String mlServiceUrl) {

    public record Jwt(String secret, Duration expiration) {
    }

    public record Cors(String allowedOrigins) {
    }
}
