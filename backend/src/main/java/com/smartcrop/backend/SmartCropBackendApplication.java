package com.smartcrop.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class SmartCropBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCropBackendApplication.class, args);
    }
}
