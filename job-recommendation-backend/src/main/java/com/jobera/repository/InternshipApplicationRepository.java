// src/main/java/com/jobera/repository/InternshipApplicationRepository.java
package com.jobera.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.jobera.entity.InternshipApplication;

@Repository
public interface InternshipApplicationRepository extends JpaRepository<InternshipApplication, Long> {
    boolean existsByUserIdAndInternshipId(Long userId, Long internshipId);
}