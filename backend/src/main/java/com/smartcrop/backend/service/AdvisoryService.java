package com.smartcrop.backend.service;

import com.smartcrop.backend.config.AppProperties;
import com.smartcrop.backend.dto.ChatRequest;
import com.smartcrop.backend.dto.HistoryResponse;
import com.smartcrop.backend.exception.ApiException;
import com.smartcrop.backend.model.History;
import com.smartcrop.backend.model.User;
import com.smartcrop.backend.repository.HistoryRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdvisoryService {

    private final RestClient restClient;
    private final HistoryRepository historyRepository;

    public AdvisoryService(AppProperties properties, HistoryRepository historyRepository) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.mlServiceUrl())
                .build();
        this.historyRepository = historyRepository;
    }

    public Map<String, Object> recommendCrop(User user, Map<String, Object> request) {
        try {
            Map<String, Object> response = restClient.post()
                    .uri("/predict-crop")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> historyData = new LinkedHashMap<>();
            historyData.put("inputs", request);
            historyData.put("recommendation", response.get("crop"));
            historyData.put("confidence", response.get("confidence"));
            historyData.put("fertilizer", response.get("fertilizer"));
            saveHistory(user.getId(), "crop_recommendation", historyData);
            return response;
        } catch (RestClientException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Error predicting crop. Make sure the ML service is running.");
        }
    }

    public Map<String, Object> recommendFertilizer(User user, Map<String, Object> request) {
        try {
            Map<String, Object> response = restClient.post()
                    .uri("/recommend-fertilizer")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> historyData = new LinkedHashMap<>();
            historyData.put("inputs", request);
            historyData.put("fertilizer", response.get("fertilizer"));
            historyData.put("confidence", response.get("confidence"));
            historyData.put("explanation", response.get("explanation"));
            saveHistory(user.getId(), "fertilizer_recommendation", historyData);
            return response;
        } catch (RestClientException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Error predicting fertilizer. Make sure the ML service is running.");
        }
    }

    public Map<String, Object> detectDisease(User user, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No image uploaded");
        }

        try {
            ByteArrayResource resource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename() != null ? image.getOriginalFilename() : "crop-image.jpg";
                }
            };

            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("image", resource);

            Map<String, Object> response = restClient.post()
                    .uri("/analyze-disease")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(formData)
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> historyData = new LinkedHashMap<>();
            historyData.put("disease", response.getOrDefault("label", response.get("disease")));
            historyData.put("confidence", response.get("confidence"));
            historyData.put("treatment", response.get("treatment"));
            historyData.put("summary", response.get("summary"));
            historyData.put("source", response.get("source"));
            saveHistory(user.getId(), "disease_detection", historyData);
            return response;
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Error analyzing the crop image. Make sure the ML service is running.");
        }
    }

    public Map<String, Object> chat(User user, ChatRequest request) {
        String message = request.message() == null ? "" : request.message().trim();
        if (message.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message is required.");
        }

        String reply = buildFallbackReply(message, request.context());
        Map<String, Object> response = Map.of(
                "reply", reply,
                "source", "fallback"
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user_message", message);
        data.put("ai_response", reply);
        data.put("language", request.language());
        data.put("context", request.context());
        saveHistory(user.getId(), "chat", data);

        return response;
    }

    public List<HistoryResponse> getHistory(User user) {
        return historyRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(HistoryResponse::from)
                .toList();
    }

    public Map<String, Object> deleteHistory(User user, String id) {
        History history = historyRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "History item not found."));
        historyRepository.delete(history);
        return Map.of("success", true, "id", id);
    }

    private void saveHistory(String userId, String type, Map<String, Object> data) {
        historyRepository.save(new History(userId, type, data));
    }

    private String buildFallbackReply(String message, ChatRequest.ChatContext context) {
        String normalized = message.toLowerCase();
        String weatherLine = "";
        if (context != null && context.locationName() != null && !context.locationName().isBlank()) {
            weatherLine = "For " + context.locationName();
            if (context.temperature() != null) {
                weatherLine += " at about " + Math.round(context.temperature()) + "C";
            }
            weatherLine += ", ";
        }

        if (normalized.contains("water") || normalized.contains("irrig")) {
            return weatherLine + "check topsoil moisture before irrigating. Water early morning and reduce frequency if the root zone is still moist.";
        }
        if (normalized.contains("fertiliz") || normalized.contains("nutrient") || normalized.contains("npk")) {
            return weatherLine + "base fertilizer decisions on a soil test, split nitrogen into stages, and avoid increasing all nutrients together without symptoms or field data.";
        }
        if (normalized.contains("pest") || normalized.contains("disease") || normalized.contains("leaf") || normalized.contains("spray")) {
            return weatherLine + "confirm the symptom first, isolate heavily affected plants, and spray only after checking crop stage and the correct label-approved control.";
        }
        if (normalized.contains("rain") || normalized.contains("weather")) {
            return weatherLine + "avoid spraying before rainfall, keep drainage open, and choose calmer wind windows for field operations.";
        }
        return weatherLine + "share your crop, growth stage, symptom, and recent weather so I can give a more accurate next step.";
    }
}
