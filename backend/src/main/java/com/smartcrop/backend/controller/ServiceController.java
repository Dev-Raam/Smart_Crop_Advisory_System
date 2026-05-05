package com.smartcrop.backend.controller;

import com.smartcrop.backend.dto.ChatRequest;
import com.smartcrop.backend.dto.HistoryResponse;
import com.smartcrop.backend.model.User;
import com.smartcrop.backend.service.AdvisoryService;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final AdvisoryService advisoryService;

    public ServiceController(AdvisoryService advisoryService) {
        this.advisoryService = advisoryService;
    }

    @PostMapping("/recommend-crop")
    public Map<String, Object> recommendCrop(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> request
    ) {
        return advisoryService.recommendCrop(user, request);
    }

    @PostMapping("/recommend-fertilizer")
    public Map<String, Object> recommendFertilizer(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> request
    ) {
        return advisoryService.recommendFertilizer(user, request);
    }

    @PostMapping("/detect-disease")
    public Map<String, Object> detectDisease(
            @AuthenticationPrincipal User user,
            @RequestPart("image") MultipartFile image
    ) {
        return advisoryService.detectDisease(user, image);
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(
            @AuthenticationPrincipal User user,
            @RequestBody ChatRequest request
    ) {
        return advisoryService.chat(user, request);
    }

    @GetMapping("/history")
    public List<HistoryResponse> getHistory(@AuthenticationPrincipal User user) {
        return advisoryService.getHistory(user);
    }

    @DeleteMapping("/history/{id}")
    public Map<String, Object> deleteHistory(
            @AuthenticationPrincipal User user,
            @PathVariable String id
    ) {
        return advisoryService.deleteHistory(user, id);
    }
}
