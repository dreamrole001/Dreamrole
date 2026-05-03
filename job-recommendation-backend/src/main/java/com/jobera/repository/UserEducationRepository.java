package com.jobera.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobera.entity.UserEducation;

public interface UserEducationRepository extends JpaRepository<UserEducation, Long> {
    List<UserEducation> findByUserId(Long userId);
}