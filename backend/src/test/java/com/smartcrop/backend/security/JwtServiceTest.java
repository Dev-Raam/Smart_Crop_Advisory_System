package com.smartcrop.backend.security;

import com.smartcrop.backend.config.AppProperties;
import com.smartcrop.backend.model.User;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    @Test
    void generatesAndValidatesToken() {
        AppProperties properties = new AppProperties(
                new AppProperties.Jwt("0410dc6b548fd21f3edb28b7e0a5c4948e1be9dbde9215c59830979ecba69f8b", Duration.ofMinutes(1)),
                new AppProperties.Cors("http://localhost:5173"),
                "http://127.0.0.1:8000"
        );
        JwtService jwtService = new JwtService(properties);

        User user = new User("Test User", "9876543210", "encoded", "en");

        try {
            var idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, "user-123");
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }

        String token = jwtService.generateToken(user);

        assertEquals("user-123", jwtService.extractUserId(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }
}
