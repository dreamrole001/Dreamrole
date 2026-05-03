// src/main/java/com/jobera/repository/ExternalJobPostingRepository.java
package com.jobera.repository;

import com.jobera.entity.ExternalJobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExternalJobPostingRepository extends JpaRepository<ExternalJobPosting, Long> {
    List<ExternalJobPosting> findByRecruiterId(Long recruiterId);
    List<ExternalJobPosting> findByRecruiterIdAndIsActiveTrue(Long recruiterId);
}