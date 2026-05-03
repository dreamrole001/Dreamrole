package com.jobera.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobera.entity.UserExperience;

public interface UserExperienceRepository extends JpaRepository<UserExperience, Long> {
    List<UserExperience> findByUserId(Long userId);
}