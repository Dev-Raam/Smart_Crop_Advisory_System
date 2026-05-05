package com.smartcrop.backend.service;

import com.smartcrop.backend.dto.AuthResponse;
import com.smartcrop.backend.dto.LoginRequest;
import com.smartcrop.backend.dto.RegisterRequest;
import com.smartcrop.backend.dto.UpdateProfileRequest;
import com.smartcrop.backend.dto.UserResponse;
import com.smartcrop.backend.exception.ApiException;
import com.smartcrop.backend.model.User;
import com.smartcrop.backend.repository.UserRepository;
import com.smartcrop.backend.security.JwtService;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        String name = normalizeName(request.name());
        String phone = normalizePhone(request.phone());
        String password = normalizePassword(request.password());
        String language = normalizeLanguage(request.language());

        validateRegistration(name, phone, password);

        if (userRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An account with this phone number already exists.");
        }

        User savedUser = userRepository.save(new User(
                name,
                phone,
                passwordEncoder.encode(password),
                language
        ));

        return new AuthResponse(jwtService.generateToken(savedUser), UserResponse.from(savedUser));
    }

    public AuthResponse login(LoginRequest request) {
        String phone = normalizePhone(request.phone());
        String password = normalizePassword(request.password());

        if (phone.isBlank() || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Not all fields have been entered.");
        }

        if (!userRepository.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No account with this phone number has been registered.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(phone, password)
        );

        User user = (User) authentication.getPrincipal();
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    public UserResponse getProfile(User user) {
        return UserResponse.from(user);
    }

    public UserResponse updateProfile(User user, UpdateProfileRequest request) {
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        if (request.language() != null && !request.language().isBlank()) {
            user.setLanguage(normalizeLanguage(request.language()));
        }

        if (request.location() != null) {
            user.setLocation(new User.Location(request.location().lat(), request.location().lon()));
        }

        User updatedUser = userRepository.save(user);
        return UserResponse.from(updatedUser);
    }

    private void validateRegistration(String name, String phone, String password) {
        if (name.isBlank() || phone.isBlank() || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Not all fields have been entered.");
        }

        if (phone.length() < 10) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a valid phone number.");
        }
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("\\D+", "").trim();
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    private String normalizePassword(String password) {
        return password == null ? "" : password.trim();
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }

        return language.trim().toLowerCase(Locale.ROOT);
    }
}
