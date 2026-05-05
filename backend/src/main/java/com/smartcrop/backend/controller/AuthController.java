package com.smartcrop.backend.controller;

import com.smartcrop.backend.dto.AuthResponse;
import com.smartcrop.backend.dto.LoginRequest;
import com.smartcrop.backend.dto.RegisterRequest;
import com.smartcrop.backend.dto.UpdateProfileRequest;
import com.smartcrop.backend.dto.UserResponse;
import com.smartcrop.backend.model.User;
import com.smartcrop.backend.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/profile")
    public UserResponse getProfile(@AuthenticationPrincipal User user) {
        return authService.getProfile(user);
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileRequest request
    ) {
        return authService.updateProfile(user, request);
    }
}
