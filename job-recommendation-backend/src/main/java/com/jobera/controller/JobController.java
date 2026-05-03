// src/main/java/com/jobera/controller/JobController.java
package com.jobera.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.jobera.dto.JobPostingDTO;
import com.jobera.entity.Application;
import com.jobera.entity.JobPosting;
import com.jobera.repository.ApplicationRepository;
import com.jobera.service.JobPostingService;
import com.jobera.service.JobRecommendationService;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class JobController {
    
    private final JobPostingService jobPostingService;
    private final JobRecommendationService recommendationService;
    private final ApplicationRepository applicationRepository;
    
    private static final String ERROR_KEY = "error";
    private static final String MESSAGE_KEY = "message";
    private static final String JOB_ID_KEY = "jobId";
    private static final String USER_ID_KEY = "userId";
    
    public JobController(JobPostingService jobPostingService, 
                        JobRecommendationService recommendationService,
                        ApplicationRepository applicationRepository) {
        this.jobPostingService = jobPostingService;
        this.recommendationService = recommendationService;
        this.applicationRepository = applicationRepository;
    }
    
    @GetMapping
    public ResponseEntity<List<JobPostingDTO>> getAllJobs() {
        try {
            List<JobPosting> jobs = jobPostingService.getActiveJobPostings();
            // Filter out internships - only return jobs where job_type is NOT 'Internship'
            List<JobPosting> onlyJobs = jobs.stream()
                .filter(job -> job.getJobType() != null && 
                       !"Internship".equalsIgnoreCase(job.getJobType()))
                .collect(Collectors.toList());
            List<JobPostingDTO> jobDTOs = onlyJobs.stream()
                .map(JobPostingDTO::new)
                .toList();
            return ResponseEntity.ok(jobDTOs);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<JobPosting>> searchJobs(@RequestParam String keyword) {
        try {
            List<JobPosting> jobs = jobPostingService.searchJobs(keyword);
            // Filter out internships
            List<JobPosting> onlyJobs = jobs.stream()
                .filter(job -> job.getJobType() != null && 
                       !"Internship".equalsIgnoreCase(job.getJobType()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(onlyJobs);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<List<JobPosting>> getRecommendations(@PathVariable Long userId) {
        try {
            List<JobPosting> recommendations = recommendationService.recommendJobsForUser(userId);
            // Filter out internships
            List<JobPosting> onlyJobs = recommendations.stream()
                .filter(job -> job.getJobType() != null && 
                       !"Internship".equalsIgnoreCase(job.getJobType()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(onlyJobs);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/recommendations/{userId}/detailed")
    public ResponseEntity<Map<String, Object>> getDetailedRecommendations(@PathVariable Long userId) {
        try {
            Map<String, Object> detailedAnalysis = recommendationService.getDetailedRecommendationAnalysis(userId);
            // Filter out internships from the recommendations
            if (detailedAnalysis.containsKey("detailedRecommendations")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> recommendations = (List<Map<String, Object>>) detailedAnalysis.get("detailedRecommendations");
                List<Map<String, Object>> onlyJobs = recommendations.stream()
                    .filter(job -> {
                        String jobType = (String) job.get("jobType");
                        return jobType != null && !"Internship".equalsIgnoreCase(jobType);
                    })
                    .collect(Collectors.toList());
                detailedAnalysis.put("detailedRecommendations", onlyJobs);
            }
            return ResponseEntity.ok(detailedAnalysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of(ERROR_KEY, "Failed to generate detailed recommendations: " + e.getMessage()));
        }
    }
    
    @GetMapping("/recommendations/skills")
    public ResponseEntity<List<JobPosting>> recommendJobsBySkills(@RequestParam List<String> skills) {
        try {
            List<JobPosting> recommendations = recommendationService.recommendJobsBySkills(new java.util.HashSet<>(skills));
            // Filter out internships
            List<JobPosting> onlyJobs = recommendations.stream()
                .filter(job -> job.getJobType() != null && 
                       !"Internship".equalsIgnoreCase(job.getJobType()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(onlyJobs);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/{jobId}")
    public ResponseEntity<JobPosting> getJobById(@PathVariable Long jobId) {
        try {
            return jobPostingService.getJobPostingById(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/{jobId}/apply-with-resume/{userId}")
    public ResponseEntity<Map<String, Object>> applyForJobWithResume(
            @PathVariable Long jobId,
            @PathVariable Long userId,
            @RequestBody Map<String, Object> applicationData) {
        try {
            String coverLetter = getStringValue(applicationData, "coverLetter", "");
            String applicantSkills = getStringValue(applicationData, "applicantSkills", "[]");
            String applicantEducation = getStringValue(applicationData, "applicantEducation", "Not specified");
            String resumeFilePath = getStringValue(applicationData, "resumeFilePath", "");
            String resumeParsedText = getStringValue(applicationData, "resumeParsedText", "");
            Integer applicantExperience = parseExperienceSafely(applicationData.get("applicantExperience"));
            
            Application application = jobPostingService.applyForJobWithResume(
                userId, jobId, coverLetter, applicantSkills, applicantExperience, 
                applicantEducation, resumeFilePath, resumeParsedText);
            
            return ResponseEntity.ok(Map.of(
                "message", "Application submitted successfully with resume analysis",
                "applicationId", application.getId(),
                "matchPercentage", application.getMatchPercentage(),
                "jobId", jobId,
                "userId", userId
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to apply for job: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{jobId}/apply/{userId}")
    public ResponseEntity<Map<String, Object>> applyForJob(
            @PathVariable Long jobId,
            @PathVariable Long userId,
            @RequestBody Map<String, Object> applicationData) {
        try {
            String coverLetter = getStringValue(applicationData, "coverLetter", "");
            String applicantSkills = getStringValue(applicationData, "applicantSkills", "[]");
            String applicantEducation = getStringValue(applicationData, "applicantEducation", "Not specified");
            Integer applicantExperience = parseExperienceSafely(applicationData.get("applicantExperience"));
            
            jobPostingService.applyForJob(userId, jobId, coverLetter, 
                                        applicantSkills, applicantExperience, 
                                        applicantEducation);
            
            return ResponseEntity.ok(Map.of(
                MESSAGE_KEY, "Application submitted successfully",
                JOB_ID_KEY, jobId,
                USER_ID_KEY, userId
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of(ERROR_KEY, "Failed to apply for job: " + e.getMessage()));
        }
    }
    
    private String getStringValue(Map<String, Object> data, String key, String defaultValue) {
        if (data == null) return defaultValue;
        Object value = data.get(key);
        if (value == null) return defaultValue;
        return value.toString().trim();
    }
    
    private Integer parseExperienceSafely(Object experienceObj) {
        if (experienceObj == null) return 0;
        try {
            if (experienceObj instanceof Integer) {
                return (Integer) experienceObj;
            } else if (experienceObj instanceof String) {
                return Integer.parseInt(((String) experienceObj).trim());
            } else if (experienceObj instanceof Number) {
                return ((Number) experienceObj).intValue();
            } else {
                return 0;
            }
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}