package com.smartcrop.backend.model;

import java.time.Instant;
import java.util.Map;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "history")
public class History {

    @Id
    private String id;

    private String userId;

    private String type;

    private Map<String, Object> data;

    @CreatedDate
    private Instant createdAt;

    public History() {
    }

    public History(String userId, String type, Map<String, Object> data) {
        this.userId = userId;
        this.type = type;
        this.data = data;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getType() {
        return type;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
