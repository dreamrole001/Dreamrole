package com.jobera.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobera.entity.JobPosting;
import com.jobera.entity.Resume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobRecommendationService {
    
    private static final Logger logger = LoggerFactory.getLogger(JobRecommendationService.class);
    
    // MINIMUM MATCH THRESHOLD - ONLY SHOW JOBS WITH >= 50% MATCH
    private static final double MIN_MATCH_THRESHOLD = 50.0;
    
    private final JobPostingService jobPostingService;
    private final ResumeService resumeService;
    private final ObjectMapper objectMapper;
    
    public JobRecommendationService(JobPostingService jobPostingService, 
                                   ResumeService resumeService) {
        this.jobPostingService = jobPostingService;
        this.resumeService = resumeService;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * MAIN RECOMMENDATION METHOD - FIXED: Only returns jobs with actual skill matches
     * Returns empty list if no matching jobs found
     */
    public List<JobPosting> recommendJobsForUser(Long userId) {
        logger.info("=== RECOMMENDING JOBS FOR USER: {} ===", userId);
        
        // Get user's latest resume
        Optional<Resume> latestResume = resumeService.getLatestResumeByUserId(userId);
        
        // If no resume found, return empty list - NO RECOMMENDATIONS
        if (latestResume.isEmpty()) {
            logger.info("❌ No resume found for user: {}. Returning empty recommendations.", userId);
            return new ArrayList<>();
        }
        
        Resume resume = latestResume.get();
        Set<String> userSkills = extractSkillsFromResume(resume);
        
        // If no skills extracted, return empty list - NO RECOMMENDATIONS
        if (userSkills.isEmpty()) {
            logger.info("❌ No skills extracted for user: {}. Returning empty recommendations.", userId);
            return new ArrayList<>();
        }
        
        logger.info("✅ User {} has {} skills: {}", userId, userSkills.size(), userSkills);
        
        // Get all active jobs (filter out internships)
        List<JobPosting> allJobs = jobPostingService.getActiveJobPostings();
        List<JobPosting> onlyJobs = allJobs.stream()
            .filter(job -> job.getJobType() != null && 
                   !"Internship".equalsIgnoreCase(job.getJobType()))
            .collect(Collectors.toList());
        
        logger.info("Total active jobs (excluding internships): {}", onlyJobs.size());
        
        // Calculate match scores and filter by threshold
        List<ScoredJob> scoredJobs = new ArrayList<>();
        for (JobPosting job : onlyJobs) {
            double matchScore = calculateJobMatchScore(job, userSkills);
            
            // CRITICAL FIX: Only add jobs with match score >= threshold
            if (matchScore >= MIN_MATCH_THRESHOLD) {
                scoredJobs.add(new ScoredJob(job, matchScore));
                logger.info("✓ Job '{}' matched: {:.0f}%", job.getTitle(), matchScore);
            } else {
                logger.info("✗ Job '{}' below threshold ({:.0f}% < {}%)", 
                    job.getTitle(), matchScore, MIN_MATCH_THRESHOLD);
            }
        }
        
        // Sort by match score (highest first)
        scoredJobs.sort((a, b) -> Double.compare(b.score, a.score));
        
        int matchCount = scoredJobs.size();
        logger.info("📊 Found {} jobs matching user skills (threshold: {}%)", matchCount, MIN_MATCH_THRESHOLD);
        
        if (matchCount == 0) {
            logger.info("⚠️ No jobs match user's skills. Returning empty list.");
        }
        
        return scoredJobs.stream()
            .map(scored -> scored.job)
            .collect(Collectors.toList());
    }
    
    /**
     * Calculate job match score based on skills
     * Returns 0-100 percentage
     */
    private double calculateJobMatchScore(JobPosting job, Set<String> userSkills) {
        try {
            Set<String> requiredSkills = parseSkillsFromJson(job.getRequiredSkills());
            
            if (requiredSkills.isEmpty()) {
                logger.debug("Job {} has no required skills specified", job.getId());
                return 0;
            }
            
            // Calculate matched skills count with fuzzy matching
            Set<String> matchedSkills = new HashSet<>();
            for (String reqSkill : requiredSkills) {
                for (String userSkill : userSkills) {
                    if (isSkillMatch(reqSkill, userSkill)) {
                        matchedSkills.add(reqSkill);
                        break;
                    }
                }
            }
            
            // Calculate match percentage
            double matchPercentage = (double) matchedSkills.size() / requiredSkills.size() * 100;
            
            // Round to 1 decimal place
            matchPercentage = Math.round(matchPercentage * 10.0) / 10.0;
            
            logger.debug("Job '{}': Required skills={}, Matched={}, Score={}%", 
                job.getTitle(), requiredSkills.size(), matchedSkills.size(), matchPercentage);
            
            return matchPercentage;
            
        } catch (Exception e) {
            logger.error("Error calculating match score for job {}: {}", job.getId(), e.getMessage());
            return 0;
        }
    }
    
    /**
     * Enhanced skill matching with variations
     */
    private boolean isSkillMatch(String jobSkill, String userSkill) {
        String js = jobSkill.toLowerCase().trim();
        String us = userSkill.toLowerCase().trim();
        
        // Exact match
        if (js.equals(us)) return true;
        
        // Contains match
        if (us.contains(js) || js.contains(us)) return true;
        
        // Common variations mapping
        Map<String, List<String>> variations = new HashMap<>();
        variations.put("javascript", Arrays.asList("js", "javascript", "ecmascript"));
        variations.put("node.js", Arrays.asList("node", "nodejs", "node.js"));
        variations.put("spring boot", Arrays.asList("springboot", "spring", "spring-boot"));
        variations.put("react", Arrays.asList("react", "reactjs", "react.js"));
        variations.put("python", Arrays.asList("python", "py", "python3"));
        variations.put("java", Arrays.asList("java", "java8", "java11", "java17"));
        variations.put("html", Arrays.asList("html", "html5"));
        variations.put("css", Arrays.asList("css", "css3"));
        variations.put("rest api", Arrays.asList("rest", "restapi", "restful", "rest api"));
        variations.put("mongodb", Arrays.asList("mongo", "mongodb"));
        variations.put("postgresql", Arrays.asList("postgres", "postgresql"));
        variations.put("typescript", Arrays.asList("ts", "typescript"));
        variations.put("docker", Arrays.asList("docker", "docker container"));
        variations.put("kubernetes", Arrays.asList("k8s", "kubernetes"));
        variations.put("aws", Arrays.asList("aws", "amazon web services"));
        variations.put("azure", Arrays.asList("azure", "microsoft azure"));
        variations.put("machine learning", Arrays.asList("ml", "machine learning"));
        variations.put("data science", Arrays.asList("ds", "data science"));
        
        for (Map.Entry<String, List<String>> entry : variations.entrySet()) {
            String standard = entry.getKey();
            List<String> variants = entry.getValue();
            
            if ((variants.contains(js) && variants.contains(us)) ||
                (js.equals(standard) && variants.contains(us)) ||
                (us.equals(standard) && variants.contains(js))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Extract skills from resume
     */
    private Set<String> extractSkillsFromResume(Resume resume) {
        Set<String> extractedSkills = new HashSet<>();
        
        try {
            // First try JSON skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                try {
                    Set<String> jsonSkills = objectMapper.readValue(resume.getSkills(), 
                        new TypeReference<Set<String>>() {});
                    extractedSkills.addAll(jsonSkills);
                    logger.info("Extracted {} skills from JSON", jsonSkills.size());
                } catch (IOException e) {
                    logger.info("JSON parsing failed, trying text extraction");
                }
            }
        } catch (Exception e) {
            logger.info("Error parsing skills JSON: {}", e.getMessage());
        }
        
        // Normalize skills
        Set<String> normalizedSkills = new HashSet<>();
        for (String skill : extractedSkills) {
            String normalized = skill.toLowerCase().trim().replaceAll("[^a-zA-Z0-9#+. ]", "");
            if (normalized.length() > 1 && !normalized.matches("\\d+")) { // Exclude pure numbers
                normalizedSkills.add(normalized);
            }
        }
        
        logger.info("Final extracted skills ({}): {}", normalizedSkills.size(), normalizedSkills);
        return normalizedSkills;
    }
    
    /**
     * Parse skills from JSON string
     */
    private Set<String> parseSkillsFromJson(String skillsJson) {
        try {
            if (skillsJson != null && !skillsJson.isEmpty()) {
                return objectMapper.readValue(skillsJson, new TypeReference<Set<String>>() {});
            }
        } catch (IOException e) {
            logger.warn("Failed to parse skills JSON: {}", skillsJson);
        }
        return new HashSet<>();
    }
    
    /**
     * Get detailed recommendation analysis with match percentages
     */
    public Map<String, Object> getDetailedRecommendationAnalysis(Long userId) {
        Map<String, Object> analysis = new HashMap<>();
        
        // Get user's latest resume
        Optional<Resume> latestResume = resumeService.getLatestResumeByUserId(userId);
        
        Set<String> userSkills = new HashSet<>();
        if (latestResume.isPresent()) {
            userSkills = extractSkillsFromResume(latestResume.get());
        }
        
        analysis.put("userSkills", new ArrayList<>(userSkills));
        analysis.put("totalSkills", userSkills.size());
        
        // Get recommendations (only matches above threshold)
        List<JobPosting> recommendations = recommendJobsForUser(userId);
        analysis.put("recommendedJobsCount", recommendations.size());
        analysis.put("hasRecommendations", !recommendations.isEmpty());
        
        List<Map<String, Object>> detailedRecommendations = new ArrayList<>();
        for (JobPosting job : recommendations) {
            Map<String, Object> jobDetails = new LinkedHashMap<>();
            jobDetails.put("jobId", job.getId());
            jobDetails.put("title", job.getTitle());
            jobDetails.put("company", job.getCompany());
            jobDetails.put("location", job.getLocation());
            jobDetails.put("salaryRange", job.getSalaryRange());
            jobDetails.put("jobType", job.getJobType());
            jobDetails.put("experienceLevel", job.getExperienceLevel());
            
            Set<String> requiredSkills = parseSkillsFromJson(job.getRequiredSkills());
            jobDetails.put("requiredSkills", new ArrayList<>(requiredSkills));
            
            // Calculate matched and missing skills
            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();
            
            for (String reqSkill : requiredSkills) {
                boolean matched = false;
                for (String userSkill : userSkills) {
                    if (isSkillMatch(reqSkill, userSkill)) {
                        matchedSkills.add(reqSkill);
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    missingSkills.add(reqSkill);
                }
            }
            
            double matchScore = requiredSkills.isEmpty() ? 0 : 
                (double) matchedSkills.size() / requiredSkills.size() * 100;
            matchScore = Math.round(matchScore * 10.0) / 10.0;
            
            jobDetails.put("matchScore", matchScore);
            jobDetails.put("matchedSkills", matchedSkills);
            jobDetails.put("missingSkills", missingSkills);
            
            detailedRecommendations.add(jobDetails);
        }
        
        // Sort by match score descending
        detailedRecommendations.sort((a, b) -> 
            Double.compare((Double) b.get("matchScore"), (Double) a.get("matchScore")));
        
        analysis.put("detailedRecommendations", detailedRecommendations);
        
        // Add message if no recommendations
        if (detailedRecommendations.isEmpty()) {
            analysis.put("message", "No jobs match your skills. Try uploading a resume with skills that match available job requirements.");
        }
        
        return analysis;
    }
    
    /**
     * Recommend jobs by skills - FIXED: Only returns matches above threshold
     */
    public List<JobPosting> recommendJobsBySkills(Set<String> skills) {
        if (skills == null || skills.isEmpty()) {
            logger.info("No skills provided for recommendation");
            return new ArrayList<>();
        }
        
        List<JobPosting> allJobs = jobPostingService.getActiveJobPostings();
        
        List<ScoredJob> scoredJobs = new ArrayList<>();
        for (JobPosting job : allJobs) {
            double score = calculateJobMatchScore(job, skills);
            if (score >= MIN_MATCH_THRESHOLD) {
                scoredJobs.add(new ScoredJob(job, score));
            }
        }
        
        scoredJobs.sort((a, b) -> Double.compare(b.score, a.score));
        
        logger.info("Found {} jobs matching provided skills (threshold: {}%)", 
            scoredJobs.size(), MIN_MATCH_THRESHOLD);
        
        return scoredJobs.stream()
            .map(scored -> scored.job)
            .collect(Collectors.toList());
    }
    
    /**
     * Helper class for scored jobs
     */
    private static class ScoredJob {
        JobPosting job;
        double score;
        
        ScoredJob(JobPosting job, double score) {
            this.job = job;
            this.score = score;
        }
    }
}