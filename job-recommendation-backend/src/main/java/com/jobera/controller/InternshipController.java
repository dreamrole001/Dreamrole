// src/main/java/com/jobera/controller/InternshipController.java - Rate Internship Section
package com.jobera.controller;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobera.entity.JobPosting;
import com.jobera.entity.InternshipApplication;
import com.jobera.entity.InternshipRating;
import com.jobera.entity.Resume;
import com.jobera.entity.User;
import com.jobera.repository.JobPostingRepository;
import com.jobera.repository.InternshipApplicationRepository;
import com.jobera.repository.InternshipRatingRepository;
import com.jobera.repository.ResumeRepository;
import com.jobera.repository.UserRepository;

@RestController
@RequestMapping("/api/internships")
@CrossOrigin(origins = "http://localhost:3000")
public class InternshipController {

    private static final String INTERNSHIP_TYPE = "Internship";

    private final JobPostingRepository jobPostingRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final InternshipRatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper;

    public InternshipController(JobPostingRepository jobPostingRepository,
                                InternshipApplicationRepository applicationRepository,
                                InternshipRatingRepository ratingRepository,
                                UserRepository userRepository,
                                ResumeRepository resumeRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllInternships() {
        try {
            List<JobPosting> allJobs = jobPostingRepository.findAll();
            List<JobPosting> internships = allJobs.stream()
                .filter(job -> job.getJobType() != null && 
                       INTERNSHIP_TYPE.equalsIgnoreCase(job.getJobType()))
                .collect(Collectors.toList());
            
            List<Map<String, Object>> response = internships.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<Map<String, Object>> getRecommendedInternships(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of("recommendations", new ArrayList<>(), "userSkills", new ArrayList<>()));
            }

            Set<String> userSkills = extractUserSkills(userId);
            
            List<JobPosting> allJobs = jobPostingRepository.findAll();
            List<JobPosting> internships = allJobs.stream()
                .filter(job -> job.getJobType() != null && 
                       INTERNSHIP_TYPE.equalsIgnoreCase(job.getJobType()))
                .collect(Collectors.toList());
            
            List<Map<String, Object>> recommendations = new ArrayList<>();
            for (JobPosting internship : internships) {
                Map<String, Object> analysis = analyzeMatch(internship, userSkills);
                Map<String, Object> internshipMap = convertToMap(internship);
                internshipMap.put("matchScore", analysis.get("matchScore"));
                internshipMap.put("matchedSkills", analysis.get("matchedSkills"));
                internshipMap.put("missingSkills", analysis.get("missingSkills"));
                recommendations.add(internshipMap);
            }

            recommendations.sort((a, b) -> Double.compare(
                (double) b.get("matchScore"), (double) a.get("matchScore")));

            return ResponseEntity.ok(Map.of(
                "recommendations", recommendations,
                "userSkills", userSkills
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("recommendations", new ArrayList<>(), "userSkills", new ArrayList<>()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            List<JobPosting> allJobs = jobPostingRepository.findAll();
            long totalInternships = allJobs.stream()
                .filter(job -> job.getJobType() != null && 
                       INTERNSHIP_TYPE.equalsIgnoreCase(job.getJobType()))
                .count();
            long totalApplications = applicationRepository.count();
            
            return ResponseEntity.ok(Map.of(
                "totalInternships", totalInternships,
                "activeInternships", totalInternships,
                "averageStipend", 0,
                "totalApplications", totalApplications
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of());
        }
    }

    @PostMapping("/{internshipId}/apply/{userId}")
    public ResponseEntity<Map<String, Object>> applyForInternship(
            @PathVariable Long internshipId,
            @PathVariable Long userId,
            @RequestBody Map<String, Object> applicationData) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Optional<JobPosting> internshipOpt = jobPostingRepository.findById(internshipId);
            if (internshipOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Internship not found"));
            }
            
            boolean alreadyApplied = applicationRepository.existsByUserIdAndInternshipId(userId, internshipId);
            if (alreadyApplied) {
                return ResponseEntity.badRequest().body(Map.of("error", "Already applied for this internship"));
            }
            
            Set<String> userSkills = extractUserSkills(userId);
            Map<String, Object> analysis = analyzeMatch(internshipOpt.get(), userSkills);
            
            InternshipApplication application = new InternshipApplication();
            application.setUser(userOpt.get());
            application.setInternshipId(internshipId);
            application.setInternshipTitle(internshipOpt.get().getTitle());
            application.setInternshipCompany(internshipOpt.get().getCompany());
            application.setCoverLetter((String) applicationData.getOrDefault("coverLetter", ""));
            application.setApplicantSkills((String) applicationData.getOrDefault("applicantSkills", "[]"));
            application.setApplicantExperience((Integer) applicationData.getOrDefault("applicantExperience", 0));
            application.setApplicantEducation((String) applicationData.getOrDefault("applicantEducation", ""));
            application.setMatchPercentage((Double) analysis.get("matchScore"));
            
            try {
                application.setMatchedSkills(objectMapper.writeValueAsString(analysis.get("matchedSkills")));
                application.setMissingSkills(objectMapper.writeValueAsString(analysis.get("missingSkills")));
            } catch (Exception e) {
                application.setMatchedSkills("[]");
                application.setMissingSkills("[]");
            }
            
            applicationRepository.save(application);
            
            return ResponseEntity.ok(Map.of("message", "Application submitted successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to submit application: " + e.getMessage()));
        }
    }

    // ========== FIXED RATE INTERNSHIP ENDPOINT ==========
    @PostMapping("/{internshipId}/rate/{userId}")
    public ResponseEntity<Map<String, Object>> rateInternship(
            @PathVariable Long internshipId,
            @PathVariable Long userId,
            @RequestBody Map<String, Object> ratingData) {
        try {
            System.out.println("=== RATING INTERNSHIP ===");
            System.out.println("Internship ID: " + internshipId);
            System.out.println("User ID: " + userId);
            System.out.println("Rating Data: " + ratingData);
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                System.out.println("❌ User not found: " + userId);
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Optional<JobPosting> internshipOpt = jobPostingRepository.findById(internshipId);
            if (internshipOpt.isEmpty()) {
                System.out.println("❌ Internship not found: " + internshipId);
                return ResponseEntity.badRequest().body(Map.of("error", "Internship not found"));
            }
            
            Integer rating = (Integer) ratingData.get("rating");
            if (rating == null || rating < 1 || rating > 5) {
                System.out.println("❌ Invalid rating: " + rating);
                return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
            }
            
            String comment = (String) ratingData.getOrDefault("comment", "");
            
            System.out.println("User: " + userOpt.get().getFullName());
            System.out.println("Internship: " + internshipOpt.get().getTitle());
            System.out.println("Rating: " + rating);
            System.out.println("Comment: " + comment);
            
            // FIXED: Check using jobPostingId instead of internshipId
            Optional<InternshipRating> existingRating = ratingRepository.findByUserIdAndJobPostingId(userId, internshipId);
            
            InternshipRating internshipRating;
            if (existingRating.isPresent()) {
                internshipRating = existingRating.get();
                internshipRating.setRating(rating);
                internshipRating.setComment(comment);
                System.out.println("✅ Updating existing rating");
            } else {
                internshipRating = new InternshipRating();
                internshipRating.setUser(userOpt.get());
                internshipRating.setJobPostingId(internshipId);  // FIXED: Use jobPostingId
                internshipRating.setInternshipTitle(internshipOpt.get().getTitle());
                internshipRating.setInternshipCompany(internshipOpt.get().getCompany());
                internshipRating.setRating(rating);
                internshipRating.setComment(comment);
                System.out.println("✅ Creating new rating");
            }
            
            InternshipRating savedRating = ratingRepository.save(internshipRating);
            System.out.println("✅ Rating saved with ID: " + savedRating.getId());
            
            // Update the job posting's average rating
            Double avgRating = ratingRepository.findAverageRatingByJobPostingId(internshipId);
            Long totalRatings = ratingRepository.countRatingsByJobPostingId(internshipId);
            
            System.out.println("Average rating: " + avgRating);
            System.out.println("Total ratings: " + totalRatings);
            
            JobPosting internship = internshipOpt.get();
            internship.setAverageRating(avgRating != null ? Math.round(avgRating * 100.0) / 100.0 : 0.0);
            internship.setTotalRatings(totalRatings != null ? totalRatings.intValue() : 0);
            jobPostingRepository.save(internship);
            
            return ResponseEntity.ok(Map.of(
                "message", "Rating submitted successfully",
                "averageRating", internship.getAverageRating(),
                "totalRatings", internship.getTotalRatings()
            ));
            
        } catch (Exception e) {
            System.out.println("❌ Error rating internship: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to submit rating: " + e.getMessage()));
        }
    }

    // ========== FIXED GET USER RATING ENDPOINT ==========
    @GetMapping("/{internshipId}/rating/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserRating(
            @PathVariable Long internshipId,
            @PathVariable Long userId) {
        try {
            System.out.println("=== GET USER RATING ===");
            System.out.println("Internship ID: " + internshipId);
            System.out.println("User ID: " + userId);
            
            // FIXED: Use jobPostingId
            Optional<InternshipRating> rating = ratingRepository.findByUserIdAndJobPostingId(userId, internshipId);
            
            if (rating.isPresent()) {
                System.out.println("✅ Found rating: " + rating.get().getRating());
                return ResponseEntity.ok(Map.of(
                    "hasRated", true,
                    "rating", rating.get().getRating(),
                    "comment", rating.get().getComment()
                ));
            }
            System.out.println("No rating found");
            return ResponseEntity.ok(Map.of("hasRated", false));
        } catch (Exception e) {
            System.out.println("❌ Error getting user rating: " + e.getMessage());
            return ResponseEntity.ok(Map.of("hasRated", false));
        }
    }

    // ========== HELPER METHODS ==========
    
    private Set<String> extractUserSkills(Long userId) {
        Set<String> skills = new HashSet<>();
        try {
            Optional<Resume> latestResume = resumeRepository.findFirstByUserIdOrderByUploadDateDesc(userId);
            if (latestResume.isPresent() && latestResume.get().getSkills() != null) {
                String skillsJson = latestResume.get().getSkills();
                if (skillsJson != null && !skillsJson.isEmpty()) {
                    try {
                        Set<String> resumeSkills = objectMapper.readValue(skillsJson, new TypeReference<Set<String>>() {});
                        skills.addAll(resumeSkills);
                    } catch (Exception e) {
                        String cleaned = skillsJson.replace("[", "").replace("]", "").replace("\"", "");
                        String[] skillArray = cleaned.split(",");
                        for (String skill : skillArray) {
                            String trimmed = skill.trim();
                            if (!trimmed.isEmpty()) {
                                skills.add(trimmed);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting user skills: " + e.getMessage());
        }
        return skills;
    }

    private Map<String, Object> analyzeMatch(JobPosting internship, Set<String> userSkills) {
        Map<String, Object> analysis = new HashMap<>();
        
        Set<String> requiredSkills = parseSkillsFromJson(internship.getRequiredSkills());
        Set<String> matched = new HashSet<>();
        Set<String> missing = new HashSet<>();
        
        for (String skill : requiredSkills) {
            boolean found = userSkills.stream().anyMatch(us -> 
                us.equalsIgnoreCase(skill) ||
                us.toLowerCase().contains(skill.toLowerCase()) ||
                skill.toLowerCase().contains(us.toLowerCase())
            );
            if (found) {
                matched.add(skill);
            } else {
                missing.add(skill);
            }
        }
        
        double matchScore = requiredSkills.isEmpty() ? 50 : (matched.size() * 100.0 / requiredSkills.size());
        
        analysis.put("matchScore", Math.round(matchScore * 100.0) / 100.0);
        analysis.put("matchedSkills", matched);
        analysis.put("missingSkills", missing);
        
        return analysis;
    }

    private Set<String> parseSkillsFromJson(String skillsJson) {
        if (skillsJson == null || skillsJson.isEmpty()) {
            return new HashSet<>();
        }
        try {
            return objectMapper.readValue(skillsJson, new TypeReference<Set<String>>() {});
        } catch (Exception e) {
            return new HashSet<>();
        }
    }

    private Map<String, Object> convertToMap(JobPosting job) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", job.getId());
        map.put("title", job.getTitle());
        map.put("company", job.getCompany());
        map.put("description", job.getDescription());
        map.put("requiredSkills", parseSkillsFromJson(job.getRequiredSkills()));
        map.put("preferredSkills", parseSkillsFromJson(job.getPreferredSkills()));
        map.put("location", job.getLocation());
        map.put("domain", job.getTitle());
        map.put("duration", 6);
        
        int stipend = 0;
        if (job.getSalaryRange() != null && !job.getSalaryRange().isEmpty()) {
            try {
                String stipendStr = job.getSalaryRange().replaceAll("[^0-9]", "");
                if (!stipendStr.isEmpty()) {
                    stipend = Integer.parseInt(stipendStr);
                }
            } catch (Exception ignored) {}
        }
        map.put("stipend", stipend);
        
        map.put("internshipType", job.getJobType());
        map.put("lastDate", null);
        map.put("postedDate", job.getPostedDate());
        map.put("isActive", job.getIsActive());
        map.put("averageRating", job.getAverageRating() != null ? job.getAverageRating() : 0.0);
        map.put("totalRatings", job.getTotalRatings() != null ? job.getTotalRatings() : 0);
        return map;
    }
}