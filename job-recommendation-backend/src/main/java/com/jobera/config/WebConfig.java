// src/main/java/com/jobera/config/WebConfig.java
package com.jobera.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve uploaded files from the uploads directory
        Path uploadsDir = Paths.get("uploads").toAbsolutePath().normalize();
        String uploadsPath = "file:" + uploadsDir.toString() + "/";
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath)
                .setCachePeriod(3600)
                .resourceChain(true);
        
        // Specifically for profile pictures
        Path profilesDir = Paths.get("uploads/profiles").toAbsolutePath().normalize();
        String profilesPath = "file:" + profilesDir.toString() + "/";
        
        registry.addResourceHandler("/uploads/profiles/**")
                .addResourceLocations(profilesPath)
                .setCachePeriod(3600)
                .resourceChain(true);
        
        System.out.println("✅ Configured uploads directory: " + uploadsPath);
        System.out.println("✅ Configured profiles directory: " + profilesPath);
    }
}