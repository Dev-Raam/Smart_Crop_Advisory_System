package com.smartcrop.backend.repository;

import com.smartcrop.backend.model.User;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);
}
