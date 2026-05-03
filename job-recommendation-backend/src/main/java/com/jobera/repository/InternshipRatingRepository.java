package com.jobera.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.jobera.entity.InternshipRating;

@Repository
public interface InternshipRatingRepository extends JpaRepository<InternshipRating, Long> {
    
    Optional<InternshipRating> findByUserIdAndJobPostingId(Long userId, Long jobPostingId);
    
    @Query("SELECT AVG(ir.rating) FROM InternshipRating ir WHERE ir.jobPostingId = :jobPostingId")
    Double findAverageRatingByJobPostingId(@Param("jobPostingId") Long jobPostingId);
    
    @Query("SELECT COUNT(ir) FROM InternshipRating ir WHERE ir.jobPostingId = :jobPostingId")
    Long countRatingsByJobPostingId(@Param("jobPostingId") Long jobPostingId);
}