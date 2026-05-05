package com.smartcrop.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartcrop.backend.model.History;
import java.time.Instant;
import java.util.Map;

public record HistoryResponse(
        @JsonProperty("_id") String id,
        String type,
        Map<String, Object> data,
        Instant createdAt
) {

    public static HistoryResponse from(History history) {
        return new HistoryResponse(
                history.getId(),
                history.getType(),
                history.getData(),
                history.getCreatedAt()
        );
    }
}
