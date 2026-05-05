package com.smartcrop.backend.repository;

import com.smartcrop.backend.model.History;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HistoryRepository extends MongoRepository<History, String> {

    List<History> findTop50ByUserIdOrderByCreatedAtDesc(String userId);

    Optional<History> findByIdAndUserId(String id, String userId);
}
