// src/main/java/com/jobera/repository/ExternalCandidateRepository.java
package com.jobera.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.jobera.entity.ExternalCandidate;

@Repository
public interface ExternalCandidateRepository extends JpaRepository<ExternalCandidate, Long> {
    
    List<ExternalCandidate> findByJobPostingId(Long jobPostingId);
    
    List<ExternalCandidate> findByJobPostingIdAndStatusOrderByMatchPercentageDesc(Long jobPostingId, String status);
    
    @Query("SELECT c FROM ExternalCandidate c WHERE c.jobPosting.id = :jobPostingId AND c.status = 'PENDING' ORDER BY c.matchPercentage DESC")
    List<ExternalCandidate> findPendingCandidatesSortedByMatch(@Param("jobPostingId") Long jobPostingId);
    
    Optional<ExternalCandidate> findByEmail(String email);
    
    @Query("SELECT c FROM ExternalCandidate c WHERE c.email = :email AND c.jobPosting.id = :jobPostingId")
    Optional<ExternalCandidate> findByEmailAndJobPostingId(@Param("email") String email, @Param("jobPostingId") Long jobPostingId);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT COUNT(c) > 0 FROM ExternalCandidate c WHERE c.email = :email AND c.jobPosting.id = :jobPostingId")
    boolean existsByEmailAndJobPostingId(@Param("email") String email, @Param("jobPostingId") Long jobPostingId);
    
    long countByJobPostingIdAndStatus(Long jobPostingId, String status);
    
    @Query("SELECT COUNT(c) FROM ExternalCandidate c WHERE c.jobPosting.id = :jobPostingId AND c.isExistingUser = false AND c.status = 'SHORTLISTED'")
    long countNewUsersByJobPostingId(@Param("jobPostingId") Long jobPostingId);
    
    @Query("SELECT COUNT(c) FROM ExternalCandidate c WHERE c.jobPosting.id = :jobPostingId AND c.isExistingUser = true AND c.status = 'SHORTLISTED'")
    long countExistingUsersByJobPostingId(@Param("jobPostingId") Long jobPostingId);
    
    @Query("SELECT c FROM ExternalCandidate c WHERE c.jobPosting.recruiter.id = :recruiterId AND c.status = 'SHORTLISTED' ORDER BY c.shortlistedAt DESC")
    List<ExternalCandidate> findShortlistedCandidatesByRecruiterId(@Param("recruiterId") Long recruiterId);
    
    @Query("SELECT c FROM ExternalCandidate c WHERE c.status = 'SHORTLISTED' ORDER BY c.shortlistedAt DESC")
    List<ExternalCandidate> findAllShortlistedCandidates();
    
    Optional<ExternalCandidate> findByUserId(Long userId);
    
    @Query("SELECT c FROM ExternalCandidate c WHERE c.user.id = :userId AND c.hasTestAssigned = true")
    Optional<ExternalCandidate> findExternalCandidateWithTestByUserId(@Param("userId") Long userId);
    
    List<ExternalCandidate> findByHasTestAssignedTrue();
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ExternalCandidate c WHERE c.jobPosting.id = :jobPostingId")
    void deleteByJobPostingId(@Param("jobPostingId") Long jobPostingId);
}