package com.smartcrop.backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "message", "Smart Crop Advisory API is running",
                "database", Map.of("message", "MongoDB connection is managed by Spring Boot")
        );
    }
}
