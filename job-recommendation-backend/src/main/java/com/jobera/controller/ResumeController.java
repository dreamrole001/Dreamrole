package com.jobera.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobera.entity.Application;
import com.jobera.entity.JobPosting;
import com.jobera.entity.Resume;
import com.jobera.repository.ApplicationRepository;
import com.jobera.service.JobPostingService;
import com.jobera.service.ResumeService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "http://localhost:3000")
public class ResumeController {
    
    private final ResumeService resumeService;
    private final ApplicationRepository applicationRepository;
    private final JobPostingService jobPostingService;
    private final ObjectMapper objectMapper;
    
    private static final String ERROR_KEY = "error";
    private static final String UPLOADS_DIR = "uploads";
    private static final double MIN_MATCH_THRESHOLD = 50.0;
    
    public ResumeController(ResumeService resumeService, 
                           ApplicationRepository applicationRepository,
                           JobPostingService jobPostingService) {
        this.resumeService = resumeService;
        this.applicationRepository = applicationRepository;
        this.jobPostingService = jobPostingService;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * UPLOAD RESUME - FIXED: Only returns recommendations when skills match (>=50%)
     */
    @PostMapping("/upload/{userId}")
    public ResponseEntity<Map<String, Object>> uploadResume(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("=== RESUME UPLOAD FOR USER: " + userId + " ===");
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of(ERROR_KEY, "File is empty"));
            }
            
            // Ensure uploads directory exists
            ensureUploadsDirectory();
            
            // Process resume
            Resume resume = resumeService.processAndSaveResume(userId, file);
            System.out.println("✅ Resume processed: ID=" + resume.getId());
            
            // Get parsed skills
            Set<String> extractedSkills = extractSkillsFromResume(resume);
            System.out.println("📊 Extracted " + extractedSkills.size() + " skills: " + extractedSkills);
            
            response.put("resumeId", resume.getId());
            response.put("fileName", resume.getFileName());
            response.put("skills", new ArrayList<>(extractedSkills));
            response.put("experienceYears", resume.getExperienceYears() != null ? resume.getExperienceYears() : 0);
            response.put("educationLevel", resume.getEducationLevel() != null ? resume.getEducationLevel() : "Not specified");
            
            // Get job recommendations based on skills (filtered by threshold)
            List<Map<String, Object>> jobRecommendations = getJobRecommendations(extractedSkills);
            
            // CRITICAL FIX: Only add recommendations if there are actual matches
            if (!jobRecommendations.isEmpty()) {
                response.put("job_recommendations", jobRecommendations);
                response.put("hasRecommendations", true);
                response.put("recommendationMessage", "Found " + jobRecommendations.size() + " jobs matching your skills");
                System.out.println("✅ Found " + jobRecommendations.size() + " job recommendations");
            } else {
                response.put("job_recommendations", new ArrayList<>());
                response.put("hasRecommendations", false);
                response.put("recommendationMessage", "No jobs match your skills (minimum " + MIN_MATCH_THRESHOLD + "% match required). Try uploading a resume with different skills.");
                System.out.println("❌ No job recommendations found - skills don't match any job requirements above " + MIN_MATCH_THRESHOLD + "%");
            }
            
            // Get internship recommendations (filtered by threshold)
            List<Map<String, Object>> internshipRecommendations = getInternshipRecommendations(extractedSkills);
            
            if (!internshipRecommendations.isEmpty()) {
                response.put("internship_recommendations", internshipRecommendations);
                response.put("hasInternshipRecommendations", true);
                System.out.println("✅ Found " + internshipRecommendations.size() + " internship recommendations");
            } else {
                response.put("internship_recommendations", new ArrayList<>());
                response.put("hasInternshipRecommendations", false);
            }
            
            response.put("message", "Resume uploaded and analyzed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (ResumeService.ResumeProcessingException e) {
            System.err.println("❌ Resume processing error: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of(ERROR_KEY, "Failed to upload resume: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR_KEY, "Unexpected error: " + e.getMessage()));
        }
    }
    
    /**
     * Get job recommendations with strict matching (only >=50% match)
     */
    private List<Map<String, Object>> getJobRecommendations(Set<String> userSkills) {
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        if (userSkills.isEmpty()) {
            System.out.println("No skills provided, returning empty recommendations");
            return recommendations;
        }
        
        // Get all active jobs (exclude internships)
        List<JobPosting> allJobs = jobPostingService.getActiveJobPostings();
        List<JobPosting> onlyJobs = allJobs.stream()
            .filter(job -> job.getJobType() != null && 
                   !"Internship".equalsIgnoreCase(job.getJobType()))
            .collect(Collectors.toList());
        
        System.out.println("Checking " + onlyJobs.size() + " jobs against " + userSkills.size() + " skills");
        
        for (JobPosting job : onlyJobs) {
            Map<String, Object> matchAnalysis = analyzeJobMatch(job, userSkills);
            double matchScore = (double) matchAnalysis.get("matchScore");
            
            // CRITICAL: Only add jobs with match score >= threshold
            if (matchScore >= MIN_MATCH_THRESHOLD) {
                Map<String, Object> jobRecommendation = new LinkedHashMap<>();
                jobRecommendation.put("jobId", job.getId());
                jobRecommendation.put("title", job.getTitle());
                jobRecommendation.put("company", job.getCompany());
                jobRecommendation.put("location", job.getLocation());
                jobRecommendation.put("salaryRange", job.getSalaryRange());
                jobRecommendation.put("jobType", job.getJobType());
                jobRecommendation.put("experienceLevel", job.getExperienceLevel());
                jobRecommendation.put("matchScore", matchScore);
                jobRecommendation.put("matchedSkills", matchAnalysis.get("matchedSkills"));
                jobRecommendation.put("missingSkills", matchAnalysis.get("missingSkills"));
                jobRecommendation.put("requiredSkills", matchAnalysis.get("requiredSkills"));
                jobRecommendation.put("preferredSkills", parseSkillsFromJson(job.getPreferredSkills()));
                
                recommendations.add(jobRecommendation);
                System.out.println("✓ Job '" + job.getTitle() + "' matched: " + matchScore + "%");
            } else {
                System.out.println("✗ Job '" + job.getTitle() + "' below threshold: " + matchScore + "% < " + MIN_MATCH_THRESHOLD + "%");
            }
        }
        
        // Sort by match score descending
        recommendations.sort((a, b) -> 
            Double.compare((Double) b.get("matchScore"), (Double) a.get("matchScore")));
        
        return recommendations;
    }
    
    /**
     * Get internship recommendations with strict matching (only >=50% match)
     */
    private List<Map<String, Object>> getInternshipRecommendations(Set<String> userSkills) {
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        if (userSkills.isEmpty()) {
            return recommendations;
        }
        
        // Get all internships
        List<JobPosting> allJobs = jobPostingService.getActiveJobPostings();
        List<JobPosting> internships = allJobs.stream()
            .filter(job -> job.getJobType() != null && 
                   "Internship".equalsIgnoreCase(job.getJobType()))
            .collect(Collectors.toList());
        
        System.out.println("Checking " + internships.size() + " internships against " + userSkills.size() + " skills");
        
        for (JobPosting internship : internships) {
            Map<String, Object> matchAnalysis = analyzeJobMatch(internship, userSkills);
            double matchScore = (double) matchAnalysis.get("matchScore");
            
            // CRITICAL: Only add internships with match score >= threshold
            if (matchScore >= MIN_MATCH_THRESHOLD) {
                Map<String, Object> internshipRecommendation = new LinkedHashMap<>();
                internshipRecommendation.put("internshipId", internship.getId());
                internshipRecommendation.put("title", internship.getTitle());
                internshipRecommendation.put("company", internship.getCompany());
                internshipRecommendation.put("location", internship.getLocation());
                internshipRecommendation.put("duration", "6 months");
                internshipRecommendation.put("stipend", parseStipend(internship.getSalaryRange()));
                internshipRecommendation.put("matchScore", matchScore);
                internshipRecommendation.put("matchedSkills", matchAnalysis.get("matchedSkills"));
                internshipRecommendation.put("missingSkills", matchAnalysis.get("missingSkills"));
                internshipRecommendation.put("requiredSkills", matchAnalysis.get("requiredSkills"));
                
                recommendations.add(internshipRecommendation);
                System.out.println("✓ Internship '" + internship.getTitle() + "' matched: " + matchScore + "%");
            } else {
                System.out.println("✗ Internship '" + internship.getTitle() + "' below threshold: " + matchScore + "% < " + MIN_MATCH_THRESHOLD + "%");
            }
        }
        
        // Sort by match score descending
        recommendations.sort((a, b) -> 
            Double.compare((Double) b.get("matchScore"), (Double) a.get("matchScore")));
        
        return recommendations;
    }
    
    /**
     * Analyze job match with user skills
     */
    private Map<String, Object> analyzeJobMatch(JobPosting job, Set<String> userSkills) {
        Map<String, Object> analysis = new HashMap<>();
        
        Set<String> requiredSkills = parseSkillsFromJson(job.getRequiredSkills());
        Set<String> matchedSkills = new HashSet<>();
        Set<String> missingSkills = new HashSet<>();
        
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
        
        analysis.put("matchScore", matchScore);
        analysis.put("matchedSkills", new ArrayList<>(matchedSkills));
        analysis.put("missingSkills", new ArrayList<>(missingSkills));
        analysis.put("requiredSkills", new ArrayList<>(requiredSkills));
        
        return analysis;
    }
    
    /**
     * Skill matching logic with variations
     */
    private boolean isSkillMatch(String jobSkill, String userSkill) {
        String js = jobSkill.toLowerCase().trim();
        String us = userSkill.toLowerCase().trim();
        
        if (js.equals(us)) return true;
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
        variations.put("mysql", Arrays.asList("mysql", "my sql"));
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
     * Parse skills from JSON
     */
    private Set<String> parseSkillsFromJson(String skillsJson) {
        if (skillsJson == null || skillsJson.isEmpty()) {
            return new HashSet<>();
        }
        try {
            if (skillsJson.startsWith("[") && skillsJson.endsWith("]")) {
                return objectMapper.readValue(skillsJson, new TypeReference<Set<String>>() {});
            } else if (skillsJson.contains(",")) {
                return new HashSet<>(Arrays.asList(skillsJson.split("\\s*,\\s*")));
            } else {
                Set<String> result = new HashSet<>();
                result.add(skillsJson);
                return result;
            }
        } catch (Exception e) {
            System.out.println("Error parsing skills JSON: " + e.getMessage());
            // Fallback: try to parse as comma-separated
            String cleaned = skillsJson.replace("[", "").replace("]", "").replace("\"", "");
            return new HashSet<>(Arrays.asList(cleaned.split("\\s*,\\s*")));
        }
    }
    
    /**
     * Extract skills from resume
     */
    private Set<String> extractSkillsFromResume(Resume resume) {
        Set<String> skills = new HashSet<>();
        
        // Try to parse JSON skills
        if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
            try {
                Set<String> parsedSkills = parseSkillsFromJson(resume.getSkills());
                skills.addAll(parsedSkills);
                System.out.println("Extracted " + parsedSkills.size() + " skills from JSON");
            } catch (Exception e) {
                System.out.println("Error parsing skills JSON: " + e.getMessage());
            }
        }
        
        // If no JSON skills, try text extraction
        if (skills.isEmpty() && resume.getParsedText() != null) {
            String text = resume.getParsedText().toLowerCase();
            for (String commonSkill : getCommonSkills()) {
                if (text.contains(commonSkill)) {
                    skills.add(commonSkill);
                }
            }
            System.out.println("Extracted " + skills.size() + " skills from text analysis");
        }
        
        // Normalize skills
        Set<String> normalizedSkills = new HashSet<>();
        for (String skill : skills) {
            String normalized = skill.toLowerCase().trim().replaceAll("[^a-zA-Z0-9#+. ]", "");
            if (normalized.length() > 1 && !normalized.matches("\\d+")) {
                normalizedSkills.add(normalized);
            }
        }
        
        return normalizedSkills;
    }
    
    /**
     * Get common skills list for text extraction
     */
    private List<String> getCommonSkills() {
        return Arrays.asList(
            "java", "python", "javascript", "react", "angular", "vue", "node.js", 
            "spring", "spring boot", "django", "flask", "mysql", "postgresql", 
            "mongodb", "aws", "azure", "docker", "kubernetes", "git", "html", 
            "css", "typescript", "c++", "c#", "ruby", "php", "swift", "kotlin",
            "machine learning", "data science", "artificial intelligence", "nlp",
            "android", "ios", "flutter", "react native", "graphql", "rest api"
        );
    }
    
    /**
     * Parse stipend from salary range
     */
    private int parseStipend(String salaryRange) {
        if (salaryRange == null) return 0;
        try {
            String numbers = salaryRange.replaceAll("[^0-9]", "");
            if (numbers.length() > 0) {
                return Integer.parseInt(numbers);
            }
        } catch (Exception e) {}
        return 0;
    }
    
    // ========== EXISTING RESUME CONTROLLER METHODS (KEEP AS IS) ==========
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Resume>> getUserResumes(@PathVariable Long userId) {
        try {
            List<Resume> resumes = resumeService.getResumesByUserId(userId);
            return ResponseEntity.ok(resumes);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/{resumeId}/analysis")
    public ResponseEntity<Map<String, Object>> analyzeResume(@PathVariable Long resumeId) {
        try {
            Map<String, Object> analysis = resumeService.analyzeResume(resumeId);
            return ResponseEntity.ok(analysis);
        } catch (ResumeService.ResumeProcessingException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(ERROR_KEY, "Failed to analyze resume: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(ERROR_KEY, "Unexpected error: " + e.getMessage()));
        }
    }
    
    @GetMapping("/user/{userId}/latest")
    public ResponseEntity<?> getLatestResume(@PathVariable Long userId) {
        try {
            System.out.println("=== GET LATEST RESUME FOR USER ===");
            System.out.println("User ID: " + userId);
            
            Optional<Resume> latestResume = resumeService.getLatestResumeByUserId(userId);
            
            if (latestResume.isPresent()) {
                Resume resume = latestResume.get();
                System.out.println("✅ Found latest resume with ID: " + resume.getId());
                System.out.println("   Skills: " + resume.getSkills());
                System.out.println("   Experience: " + resume.getExperienceYears());
                System.out.println("   Education: " + resume.getEducationLevel());
                
                Map<String, Object> safeResponse = new HashMap<>();
                safeResponse.put("id", resume.getId());
                safeResponse.put("fileName", resume.getFileName());
                safeResponse.put("filePath", resume.getFilePath());
                safeResponse.put("skills", resume.getSkills());
                safeResponse.put("experienceYears", resume.getExperienceYears());
                safeResponse.put("educationLevel", resume.getEducationLevel());
                safeResponse.put("uploadDate", resume.getUploadDate());
                
                return ResponseEntity.ok(safeResponse);
            } else {
                System.out.println("❌ No resume found for user: " + userId);
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "No resume found for user");
                errorResponse.put("status", "NOT_FOUND");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error fetching latest resume: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch resume: " + e.getMessage());
            errorResponse.put("status", "ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/download/{applicationId}")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long applicationId) {
        try {
            System.out.println("=== DOWNLOAD RESUME REQUEST ===");
            System.out.println("Application ID: " + applicationId);
            
            Optional<Application> applicationOpt = applicationRepository.findById(applicationId);
            if (applicationOpt.isEmpty()) {
                System.out.println("❌ Application not found with ID: " + applicationId);
                return ResponseEntity.notFound().build();
            }
            
            Application application = applicationOpt.get();
            String resumeFilePath = application.getResumeFilePath();
            
            System.out.println("Resume File Path from DB: " + resumeFilePath);
            System.out.println("Applicant: " + application.getSafeApplicantName());
            
            if (resumeFilePath == null || resumeFilePath.isEmpty()) {
                System.out.println("⚠️ No resume file path in application");
                return generateResumeFromApplicationData(application);
            }
            
            Path filePath = findResumeFile(resumeFilePath);
            
            if (filePath != null && Files.exists(filePath)) {
                System.out.println("✅ Found file at: " + filePath.toAbsolutePath());
                
                Resource resource = new UrlResource(filePath.toUri());
                
                if (resource.exists() && resource.isReadable()) {
                    String contentType = determineContentType(filePath);
                    String sanitizedName = application.getSafeApplicantName().replaceAll("[^a-zA-Z0-9.-]", "_");
                    String originalFileName = new File(resumeFilePath).getName();
                    String extension = originalFileName.contains(".") ? 
                        originalFileName.substring(originalFileName.lastIndexOf(".")) : 
                        getFileExtension(filePath);
                    
                    String filename = "resume_" + sanitizedName + extension;
                    
                    return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
                }
            }
            
            System.out.println("❌ Resume file not found, generating from application data...");
            return generateResumeFromApplicationData(application);
            
        } catch (Exception e) {
            System.out.println("❌ ERROR downloading resume: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Keep all your existing helper methods below (ensureUploadsDirectory, findResumeFile, etc.)
    // They remain unchanged from your original code
    
    private void ensureUploadsDirectory() {
        try {
            Path uploadsDir = Paths.get(UPLOADS_DIR);
            if (!Files.exists(uploadsDir)) {
                Files.createDirectories(uploadsDir);
                System.out.println("✅ Created uploads directory: " + uploadsDir.toAbsolutePath());
            }
        } catch (IOException e) {
            System.out.println("❌ Failed to create uploads directory: " + e.getMessage());
        }
    }
    
    private Path findResumeFile(String resumeFilePath) {
        if (resumeFilePath == null || resumeFilePath.isEmpty()) return null;
        
        List<Path> possiblePaths = new ArrayList<>();
        String fileName = new File(resumeFilePath).getName();
        
        possiblePaths.add(Paths.get(resumeFilePath).normalize());
        possiblePaths.add(Paths.get(UPLOADS_DIR, resumeFilePath).normalize());
        possiblePaths.add(Paths.get(UPLOADS_DIR, fileName).normalize());
        possiblePaths.add(Paths.get(fileName).normalize());
        
        if (resumeFilePath.startsWith("/uploads/")) {
            String relativePath = resumeFilePath.substring("/uploads/".length());
            possiblePaths.add(Paths.get(UPLOADS_DIR, relativePath).normalize());
        }
        
        if (resumeFilePath.startsWith("uploads/")) {
            possiblePaths.add(Paths.get(resumeFilePath).normalize());
        }
        
        for (Path path : possiblePaths) {
            if (Files.exists(path)) {
                return path;
            }
        }
        
        return null;
    }
    
    private ResponseEntity<Resource> generateResumeFromApplicationData(Application application) {
        try {
            String resumeText = generateResumeText(application);
            byte[] textBytes = resumeText.getBytes();
            
            Path tempFile = Files.createTempFile("resume_", ".txt");
            Files.write(tempFile, textBytes);
            
            Resource resource = new UrlResource(tempFile.toUri());
            
            String sanitizedName = application.getSafeApplicantName().replaceAll("[^a-zA-Z0-9.-]", "_");
            String filename = "resume_" + sanitizedName + ".txt";
            
            tempFile.toFile().deleteOnExit();
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(resource);
                
        } catch (Exception e) {
            System.out.println("❌ Failed to generate resume: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private String generateResumeText(Application application) {
        StringBuilder resume = new StringBuilder();
        
        resume.append("RESUME\n");
        resume.append("======\n\n");
        resume.append("Applicant: ").append(application.getSafeApplicantName()).append("\n");
        resume.append("Email: ").append(application.getSafeApplicantEmail()).append("\n");
        if (application.getApplicantPhone() != null && !application.getApplicantPhone().isEmpty()) {
            resume.append("Phone: ").append(application.getApplicantPhone()).append("\n");
        }
        resume.append("\n");
        
        if (application.getApplicantExperience() != null) {
            resume.append("Experience: ").append(application.getApplicantExperience()).append(" years\n");
        }
        
        if (application.getApplicantEducation() != null && !application.getApplicantEducation().isEmpty()) {
            resume.append("Education: ").append(application.getApplicantEducation()).append("\n");
        }
        
        resume.append("\nSKILLS\n");
        resume.append("======\n");
        if (application.getApplicantSkills() != null && !application.getApplicantSkills().isEmpty()) {
            Set<String> skills = parseSkillsFromJson(application.getApplicantSkills());
            for (String skill : skills) {
                resume.append("- ").append(skill).append("\n");
            }
        } else {
            resume.append("Not specified\n");
        }
        
        resume.append("\nCOVER LETTER\n");
        resume.append("============\n");
        if (application.getCoverLetter() != null && !application.getCoverLetter().isEmpty()) {
            resume.append(application.getCoverLetter()).append("\n");
        } else {
            resume.append("Not provided\n");
        }
        
        resume.append("\n---\n");
        resume.append("Generated from DreamRole Application System\n");
        resume.append("Application Date: ").append(application.getApplicationDate()).append("\n");
        
        return resume.toString();
    }
    
    private String determineContentType(Path filePath) {
        String fileName = filePath.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".pdf")) return "application/pdf";
        if (fileName.endsWith(".doc")) return "application/msword";
        if (fileName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (fileName.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
    
    private String getFileExtension(Path filePath) {
        String fileName = filePath.getFileName().toString();
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    }
}