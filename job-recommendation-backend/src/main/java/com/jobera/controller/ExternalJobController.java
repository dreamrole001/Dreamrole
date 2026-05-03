// src/main/java/com/jobera/controller/ExternalJobController.java
package com.jobera.controller;

import com.jobera.entity.ExternalCandidate;
import com.jobera.entity.ExternalJobPosting;
import com.jobera.service.ExternalJobService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/external-jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class ExternalJobController {
    
    private static final String ERROR = "error";
    private final ExternalJobService externalJobService;
    
    public ExternalJobController(ExternalJobService externalJobService) {
        this.externalJobService = externalJobService;
    }
    
    // ========== JOB POSTING MANAGEMENT ==========
    
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createExternalJob(
            @RequestParam Long recruiterId,
            @RequestBody Map<String, Object> jobData) {
        try {
            ExternalJobPosting job = externalJobService.createExternalJobPosting(recruiterId, jobData);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "External job created successfully");
            response.put("job", job);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    @GetMapping("/recruiter/{recruiterId}")
    public ResponseEntity<List<ExternalJobPosting>> getRecruiterExternalJobs(@PathVariable Long recruiterId) {
        try {
            List<ExternalJobPosting> jobs = externalJobService.getRecruiterExternalJobs(recruiterId);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/{jobId}")
    public ResponseEntity<ExternalJobPosting> getExternalJob(@PathVariable Long jobId) {
        try {
            return externalJobService.getExternalJobById(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{jobId}")
    public ResponseEntity<Map<String, Object>> deleteExternalJob(
            @PathVariable Long jobId,
            @RequestParam Long recruiterId) {
        try {
            Map<String, Object> result = externalJobService.deleteExternalJob(jobId, recruiterId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    // ========== RESUME UPLOAD AND CANDIDATE MANAGEMENT ==========
    
    @PostMapping("/{jobId}/upload-resumes")
    public ResponseEntity<Map<String, Object>> uploadResumes(
            @PathVariable Long jobId,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            Map<String, Object> result = externalJobService.uploadAndAnalyzeResumes(jobId, files);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    @PostMapping("/{jobId}/select-candidates")
    public ResponseEntity<Map<String, Object>> selectTopCandidates(
            @PathVariable Long jobId,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer numberOfCandidates = request.get("numberOfCandidates");
            Map<String, Object> result = externalJobService.selectTopCandidates(jobId, numberOfCandidates);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", result.get("message"));
            response.put("totalShortlisted", result.get("totalShortlisted"));
            response.put("newUsersCount", result.get("newUsersCount"));
            response.put("existingUsersCount", result.get("existingUsersCount"));
            response.put("downloadUrl", result.get("downloadUrl"));
            response.put("shortlistedCandidates", result.get("shortlistedCandidates"));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    @GetMapping("/{jobId}/shortlisted-candidates")
    public ResponseEntity<List<ExternalCandidate>> getShortlistedCandidates(@PathVariable Long jobId) {
        try {
            List<ExternalCandidate> candidates = externalJobService.getShortlistedCandidates(jobId);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/{jobId}/all-candidates")
    public ResponseEntity<List<ExternalCandidate>> getAllCandidates(@PathVariable Long jobId) {
        try {
            List<ExternalCandidate> candidates = externalJobService.getAllCandidates(jobId);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/{jobId}/candidates-with-results")
    public ResponseEntity<List<Map<String, Object>>> getExternalCandidatesWithTestResults(@PathVariable Long jobId) {
        try {
            List<Map<String, Object>> candidates = externalJobService.getExternalCandidatesWithTestResults(jobId);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/candidates/{candidateId}/full-details")
    public ResponseEntity<Map<String, Object>> getExternalCandidateFullDetails(@PathVariable Long candidateId) {
        try {
            Map<String, Object> candidate = externalJobService.getExternalCandidateFullDetails(candidateId);
            return ResponseEntity.ok(candidate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    @GetMapping("/candidates/{candidateId}/analysis")
    public ResponseEntity<Map<String, Object>> getCandidateAnalysis(@PathVariable Long candidateId) {
        try {
            Map<String, Object> analysis = externalJobService.getCandidateAnalysis(candidateId);
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    // ========== TEST ASSIGNMENT FOR EXTERNAL CANDIDATES ==========
    
    /**
     * CRITICAL ENDPOINT: Assign a test to an external candidate
     * This is the endpoint called when clicking "Assign Test" for an external candidate
     */
    @PostMapping("/assign-test")
    public ResponseEntity<Map<String, Object>> assignTestToExternalCandidate(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("=".repeat(60));
            System.out.println("📋 ASSIGN TEST TO EXTERNAL CANDIDATE ENDPOINT HIT");
            System.out.println("=".repeat(60));
            System.out.println("Request received: " + request);
            
            // Extract parameters from request
            Long candidateId = Long.valueOf(request.get("candidateId").toString());
            Long testId = Long.valueOf(request.get("testId").toString());
            Integer deadlineHours = Integer.valueOf(request.get("deadlineHours").toString());
            Boolean isDreamRoleTest = (Boolean) request.getOrDefault("isDreamRoleTest", false);
            
            System.out.println("Candidate ID: " + candidateId);
            System.out.println("Test ID: " + testId);
            System.out.println("Deadline Hours: " + deadlineHours);
            System.out.println("Is DreamRole Test: " + isDreamRoleTest);
            
            // Call service to assign test
            Map<String, Object> result = externalJobService.assignTestToExternalCandidate(
                candidateId, testId, deadlineHours, isDreamRoleTest);
            
            System.out.println("✅ Test assigned successfully!");
            System.out.println("Result: " + result);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("❌ Error assigning test to external candidate: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // ========== GET SHORTLISTED CANDIDATES FOR TEST ASSIGNMENT ==========
    
    @GetMapping("/{jobId}/shortlisted-for-test")
    public ResponseEntity<Map<String, Object>> getShortlistedCandidatesForTest(@PathVariable Long jobId) {
        try {
            Map<String, Object> result = externalJobService.getShortlistedCandidatesForTestAssignment(jobId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    @GetMapping("/recruiter/{recruiterId}/shortlisted-candidates-for-test")
    public ResponseEntity<List<Map<String, Object>>> getShortlistedCandidatesForTestAssignmentByRecruiter(
            @PathVariable Long recruiterId) {
        try {
            System.out.println("=== GET SHORTLISTED CANDIDATES FOR TEST ASSIGNMENT ===");
            System.out.println("Recruiter ID: " + recruiterId);
            
            List<Map<String, Object>> candidates = externalJobService.getShortlistedCandidatesForTestAssignmentByRecruiter(recruiterId);
            
            System.out.println("✅ Found " + candidates.size() + " shortlisted external candidates");
            
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            System.err.println("❌ Error fetching shortlisted candidates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
    
    // ========== STATISTICS AND RESULTS ==========
    
    @GetMapping("/{jobId}/stats")
    public ResponseEntity<Map<String, Object>> getExternalJobStats(@PathVariable Long jobId) {
        try {
            Map<String, Object> stats = externalJobService.getExternalJobStats(jobId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    @GetMapping("/recruiter/{recruiterId}/jobs-with-stats")
    public ResponseEntity<List<Map<String, Object>>> getRecruiterExternalJobsWithStats(@PathVariable Long recruiterId) {
        try {
            List<Map<String, Object>> jobs = externalJobService.getRecruiterExternalJobsWithStats(recruiterId);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    // ========== INTERVIEW SCHEDULING ==========
    
    @PostMapping("/candidates/{candidateId}/schedule-interview")
    public ResponseEntity<Map<String, Object>> scheduleInterviewForExternalCandidate(
            @PathVariable Long candidateId,
            @RequestBody Map<String, Object> request) {
        try {
            String interviewDateStr = (String) request.get("interviewDate");
            String interviewLocation = (String) request.get("interviewLocation");
            String notes = (String) request.get("notes");
            
            LocalDateTime interviewDate = LocalDateTime.parse(interviewDateStr);
            
            Map<String, Object> result = externalJobService.scheduleInterviewForExternalCandidate(
                candidateId, interviewDate, interviewLocation, notes);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR, e.getMessage()));
        }
    }
    
    // ========== FILE DOWNLOAD ==========
    
    @GetMapping("/download-credentials/{fileName}")
    public ResponseEntity<Resource> downloadCredentials(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get("uploads/external_resumes/" + fileName);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}