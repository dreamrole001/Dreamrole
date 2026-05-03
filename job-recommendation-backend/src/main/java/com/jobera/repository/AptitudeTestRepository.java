package com.jobera.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jobera.entity.AptitudeTest;

@Repository
public interface AptitudeTestRepository extends JpaRepository<AptitudeTest, Long> {
    List<AptitudeTest> findByRecruiterId(Long recruiterId);
    List<AptitudeTest> findByRecruiterIdAndIsActiveTrue(Long recruiterId);
}