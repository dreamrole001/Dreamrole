// src/main/java/com/jobera/service/ExternalJobService.java
package com.jobera.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobera.entity.*;
import com.jobera.repository.*;
import com.jobera.util.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExternalJobService {

    private static final Logger logger = LoggerFactory.getLogger(ExternalJobService.class);

    private final ExternalJobPostingRepository jobPostingRepository;
    private final ExternalCandidateRepository candidateRepository;
    private final RecruiterRepository recruiterRepository;
    private final UserRepository userRepository;
    private final UniversalResumeParserService resumeParserService;
    private final TestAssignmentRepository testAssignmentRepository;
    private final DreamRoleTestAssignmentRepository dreamRoleTestAssignmentRepository;
    private final AptitudeTestRepository aptitudeTestRepository;
    private final DreamRoleTestRepository dreamRoleTestRepository;
    private final ApplicationRepository applicationRepository;
    private final QuestionBankRepository questionBankRepository;
    private final DreamRoleTestQuestionRepository dreamRoleTestQuestionRepository;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    public ExternalJobService(
            ExternalJobPostingRepository jobPostingRepository,
            ExternalCandidateRepository candidateRepository,
            RecruiterRepository recruiterRepository,
            UserRepository userRepository,
            UniversalResumeParserService resumeParserService,
            TestAssignmentRepository testAssignmentRepository,
            DreamRoleTestAssignmentRepository dreamRoleTestAssignmentRepository,
            AptitudeTestRepository aptitudeTestRepository,
            DreamRoleTestRepository dreamRoleTestRepository,
            ApplicationRepository applicationRepository,
            QuestionBankRepository questionBankRepository,
            DreamRoleTestQuestionRepository dreamRoleTestQuestionRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.candidateRepository = candidateRepository;
        this.recruiterRepository = recruiterRepository;
        this.userRepository = userRepository;
        this.resumeParserService = resumeParserService;
        this.testAssignmentRepository = testAssignmentRepository;
        this.dreamRoleTestAssignmentRepository = dreamRoleTestAssignmentRepository;
        this.aptitudeTestRepository = aptitudeTestRepository;
        this.dreamRoleTestRepository = dreamRoleTestRepository;
        this.applicationRepository = applicationRepository;
        this.questionBankRepository = questionBankRepository;
        this.dreamRoleTestQuestionRepository = dreamRoleTestQuestionRepository;
        this.objectMapper = new ObjectMapper();
        this.passwordEncoder = new PasswordEncoder();
    }

    @Transactional
    public ExternalJobPosting createExternalJobPosting(Long recruiterId, Map<String, Object> jobData) {
        Optional<Recruiter> recruiterOpt = recruiterRepository.findById(recruiterId);
        if (recruiterOpt.isEmpty()) {
            throw new RuntimeException("Recruiter not found: " + recruiterId);
        }

        ExternalJobPosting job = new ExternalJobPosting();
        job.setRecruiter(recruiterOpt.get());
        job.setTitle((String) jobData.get("title"));
        job.setCompany((String) jobData.get("company"));
        job.setDescription((String) jobData.get("description"));
        job.setLocation((String) jobData.get("location"));
        job.setSalaryRange((String) jobData.get("salaryRange"));
        job.setJobType((String) jobData.get("jobType"));
        job.setExperienceLevel((String) jobData.get("experienceLevel"));

        Object reqSkills = jobData.get("requiredSkills");
        if (reqSkills instanceof List) {
            try {
                job.setRequiredSkills(objectMapper.writeValueAsString(reqSkills));
            } catch (Exception e) {
                job.setRequiredSkills("[]");
            }
        } else if (reqSkills instanceof String) {
            job.setRequiredSkills((String) reqSkills);
        } else {
            job.setRequiredSkills("[]");
        }

        Object prefSkills = jobData.get("preferredSkills");
        if (prefSkills instanceof List) {
            try {
                job.setPreferredSkills(objectMapper.writeValueAsString(prefSkills));
            } catch (Exception e) {
                job.setPreferredSkills("[]");
            }
        } else if (prefSkills instanceof String) {
            job.setPreferredSkills((String) prefSkills);
        } else {
            job.setPreferredSkills("[]");
        }

        Object reqCandidates = jobData.get("requiredCandidates");
        if (reqCandidates != null) {
            try {
                job.setRequiredCandidates(Integer.parseInt(reqCandidates.toString()));
            } catch (NumberFormatException e) {
                job.setRequiredCandidates(0);
            }
        }

        return jobPostingRepository.save(job);
    }

    public List<ExternalJobPosting> getRecruiterExternalJobs(Long recruiterId) {
        return jobPostingRepository.findByRecruiterId(recruiterId);
    }

    public Optional<ExternalJobPosting> getExternalJobById(Long jobId) {
        return jobPostingRepository.findById(jobId);
    }

    @Transactional
    public Map<String, Object> uploadAndAnalyzeResumes(Long jobId, List<MultipartFile> files) {
        Optional<ExternalJobPosting> jobOpt = jobPostingRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            throw new RuntimeException("Job posting not found: " + jobId);
        }

        ExternalJobPosting job = jobOpt.get();
        Set<String> requiredSkills = parseSkillsFromJson(job.getRequiredSkills());

        Path uploadDir = Paths.get("uploads/external_resumes/");
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create upload directory: " + e.getMessage());
        }

        int successCount = 0;
        int failCount = 0;
        int skipCount = 0;
        List<String> errors = new ArrayList<>();
        List<Map<String, Object>> processedCandidates = new ArrayList<>();

        for (MultipartFile file : files) {
            String fileName = file.getOriginalFilename();
            try {
                String savedFileName = System.currentTimeMillis() + "_" + (fileName != null ? fileName : "resume.pdf");
                Path filePath = uploadDir.resolve(savedFileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                Map<String, Object> result = processSingleCandidateFile(
                    file, filePath.toString(), "/uploads/external_resumes/" + savedFileName,
                    job, requiredSkills, jobId
                );

                if (result != null) {
                    String status = (String) result.get("status");
                    if ("success".equals(status)) {
                        successCount++;
                        processedCandidates.add(result);
                    } else if ("skipped".equals(status)) {
                        skipCount++;
                        logger.info("Skipped (already applied to this job): {}", fileName);
                    } else {
                        failCount++;
                        errors.add(fileName + ": " + result.get("error"));
                    }
                }

            } catch (Exception e) {
                failCount++;
                errors.add(fileName + ": " + e.getMessage());
                logger.error("Failed to process resume {}: {}", fileName, e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Processing complete");
        result.put("totalFiles", files.size());
        result.put("successfulUploads", successCount);
        result.put("skipCount", skipCount);
        result.put("failedUploads", failCount);
        result.put("errors", errors);
        result.put("candidates", processedCandidates);

        logger.info("Upload complete for job {}: {} success, {} skip, {} fail",
            jobId, successCount, skipCount, failCount);

        return result;
    }

    private Map<String, Object> processSingleCandidateFile(
            MultipartFile file,
            String physicalPath,
            String webPath,
            ExternalJobPosting job,
            Set<String> requiredSkills,
            Long jobId) {

        Map<String, Object> result = new HashMap<>();

        try {
            Map<String, Object> parsedData = resumeParserService.parseResume(file);

            String email = (String) parsedData.getOrDefault("email", "");
            String fullName = (String) parsedData.getOrDefault("fullName", "Candidate");

            if (email == null || email.trim().isEmpty()) {
                String baseName = (file.getOriginalFilename() != null)
                    ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9]", "").toLowerCase()
                    : "candidate" + System.currentTimeMillis();
                email = baseName + "@external.dreamrole.com";
            }

            final String finalEmail = email.trim().toLowerCase();

            boolean alreadyAppliedToThisJob = candidateRepository
                .existsByEmailAndJobPostingId(finalEmail, jobId);

            if (alreadyAppliedToThisJob) {
                result.put("status", "skipped");
                result.put("email", finalEmail);
                result.put("reason", "Already applied to this job posting");
                return result;
            }

            @SuppressWarnings("unchecked")
            Set<String> candidateSkills = (Set<String>) parsedData.getOrDefault("skills", new HashSet<>());
            Integer experienceYears = (Integer) parsedData.getOrDefault("experienceYears", 0);
            String educationLevel = (String) parsedData.getOrDefault("educationLevel", "Not Specified");

            Map<String, Object> matchResult = resumeParserService.calculateMatchScore(parsedData, requiredSkills);
            Double matchScore = (Double) matchResult.getOrDefault("matchScore", 0.0);

            @SuppressWarnings("unchecked")
            Set<String> matchedSkills = (Set<String>) matchResult.getOrDefault("matchedSkills", new HashSet<>());
            @SuppressWarnings("unchecked")
            Set<String> missingSkills = (Set<String>) matchResult.getOrDefault("missingSkills", new HashSet<>());

            Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(finalEmail);

            User user;
            String generatedPassword = null;
            boolean isExistingUser = false;

            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                isExistingUser = true;
                generatedPassword = null;
                logger.info("✅ EXISTING USER detected: {}", finalEmail);
            } else {
                generatedPassword = generateSecurePassword();
                user = new User();
                user.setEmail(finalEmail);
                user.setFullName(fullName);
                user.setPassword(passwordEncoder.encode(generatedPassword));
                user.setPhone((String) parsedData.getOrDefault("phone", ""));
                user.setIsActive(true);
                user.setRoleId(1L);

                try {
                    user = userRepository.save(user);
                    logger.info("🆕 NEW USER created: {} with password: {}", finalEmail, generatedPassword);
                } catch (Exception e) {
                    Optional<User> retryUser = userRepository.findByEmailIgnoreCase(finalEmail);
                    if (retryUser.isPresent()) {
                        user = retryUser.get();
                        isExistingUser = true;
                        generatedPassword = null;
                    } else {
                        throw e;
                    }
                }
            }

            ExternalCandidate candidate = new ExternalCandidate();
            candidate.setJobPosting(job);
            candidate.setUser(user);
            candidate.setFullName(fullName != null && !fullName.isBlank() ? fullName : user.getFullName());
            candidate.setEmail(finalEmail);
            candidate.setPhone((String) parsedData.getOrDefault("phone", ""));
            candidate.setResumeFilePath(webPath);
            candidate.setResumeText((String) parsedData.getOrDefault("rawText", ""));
            candidate.setExperienceYears(experienceYears);
            candidate.setEducationLevel(educationLevel);
            candidate.setMatchPercentage(matchScore);
            candidate.setStatus("PENDING");
            candidate.setIsExistingUser(isExistingUser);
            candidate.setPasswordStatus(isExistingUser ? "EXISTING_USER" : "NEW_USER");

            if (generatedPassword != null) {
                candidate.setGeneratedPassword(generatedPassword);
            }

            try {
                candidate.setExtractedSkills(objectMapper.writeValueAsString(candidateSkills));
                candidate.setMatchedSkills(objectMapper.writeValueAsString(matchedSkills));
                candidate.setMissingSkills(objectMapper.writeValueAsString(missingSkills));
            } catch (Exception e) {
                candidate.setExtractedSkills("[]");
                candidate.setMatchedSkills("[]");
                candidate.setMissingSkills("[]");
            }

            ExternalCandidate savedCandidate = candidateRepository.save(candidate);

            result.put("status", "success");
            result.put("candidateId", savedCandidate.getId());
            result.put("email", finalEmail);
            result.put("fullName", candidate.getFullName());
            result.put("matchScore", matchScore);
            result.put("isExistingUser", isExistingUser);
            result.put("isNewUser", !isExistingUser);
            if (generatedPassword != null) {
                result.put("generatedPassword", generatedPassword);
            }

            return result;

        } catch (Exception e) {
            logger.error("Error processing candidate: {}", e.getMessage(), e);
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("file", file.getOriginalFilename());
            return result;
        }
    }

    @Transactional
    public Map<String, Object> selectTopCandidates(Long jobId, Integer numberOfCandidates) {
        Optional<ExternalJobPosting> jobOpt = jobPostingRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            throw new RuntimeException("Job posting not found: " + jobId);
        }

        int count = (numberOfCandidates != null && numberOfCandidates > 0) ? numberOfCandidates : 10;

        List<ExternalCandidate> allCandidates = candidateRepository.findPendingCandidatesSortedByMatch(jobId);
        List<ExternalCandidate> topCandidates = allCandidates.stream().limit(count).collect(Collectors.toList());

        int newUsersCount = 0;
        int existingUsersCount = 0;

        for (ExternalCandidate candidate : topCandidates) {
            candidate.setStatus("SHORTLISTED");
            candidate.setShortlistedAt(LocalDateTime.now());
            candidateRepository.save(candidate);
            
            if (candidate.isExistingUser() || (candidate.getUser() != null && candidate.getGeneratedPassword() == null)) {
                existingUsersCount++;
            } else {
                newUsersCount++;
            }
        }

        String credentialsFilePath = generateCredentialsCsv(jobId, topCandidates, newUsersCount, existingUsersCount);

        Map<String, Object> result = new HashMap<>();
        result.put("message", count + " candidates shortlisted successfully");
        result.put("totalShortlisted", topCandidates.size());
        result.put("newUsersCount", newUsersCount);
        result.put("existingUsersCount", existingUsersCount);
        result.put("downloadUrl", credentialsFilePath);
        result.put("shortlistedCandidates", topCandidates.stream().map(this::createCandidateSummary).collect(Collectors.toList()));

        return result;
    }

    public List<ExternalCandidate> getShortlistedCandidates(Long jobId) {
        return candidateRepository.findByJobPostingIdAndStatusOrderByMatchPercentageDesc(jobId, "SHORTLISTED");
    }

    public List<ExternalCandidate> getAllCandidates(Long jobId) {
        return candidateRepository.findByJobPostingId(jobId);
    }

    // ========== FIXED: ASSIGN TEST TO EXTERNAL CANDIDATE ==========
    @Transactional
    public Map<String, Object> assignTestToExternalCandidate(Long candidateId, Long testId, Integer deadlineHours, boolean isDreamRoleTest) {
        System.out.println("=== EXTERNAL JOB SERVICE - ASSIGN TEST TO EXTERNAL CANDIDATE ===");
        
        Optional<ExternalCandidate> candidateOpt = candidateRepository.findById(candidateId);
        if (candidateOpt.isEmpty()) {
            throw new RuntimeException("External candidate not found: " + candidateId);
        }
        
        ExternalCandidate candidate = candidateOpt.get();
        
        if (candidate.getHasTestAssigned() != null && candidate.getHasTestAssigned()) {
            throw new RuntimeException("Test already assigned to this candidate");
        }
        
        // CRITICAL FIX: Create Application WITHOUT JobPosting (set to null for external candidates)
        Application application = new Application();
        application.setUser(candidate.getUser());
        application.setJobPosting(null);  // IMPORTANT: Set to null for external candidates
        application.setCoverLetter("Applied via External Job: " + candidate.getJobPosting().getTitle());
        application.setApplicantName(candidate.getFullName());
        application.setApplicantEmail(candidate.getEmail());
        application.setApplicantPhone(candidate.getPhone());
        application.setApplicantSkills(candidate.getExtractedSkills());
        application.setApplicantExperience(candidate.getExperienceYears());
        application.setApplicantEducation(candidate.getEducationLevel());
        application.setMatchPercentage(candidate.getMatchPercentage());
        application.setMatchedSkills(candidate.getMatchedSkills());
        application.setMissingSkills(candidate.getMissingSkills());
        application.setResumeFilePath(candidate.getResumeFilePath());
        application.setStatus("TEST_ASSIGNED");
        
        // Save application first
        Application savedApplication = applicationRepository.save(application);
        System.out.println("✅ Created application for external candidate with ID: " + savedApplication.getId());
        
        Long assignmentId = null;
        
        if (isDreamRoleTest) {
            Optional<DreamRoleTest> testOpt = dreamRoleTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                throw new RuntimeException("DreamRole test not found: " + testId);
            }
            
            DreamRoleTest test = testOpt.get();
            
            // Get 40 aptitude questions from question bank
            List<QuestionBank> aptitudeQuestions = questionBankRepository.findRandomQuestionsByBranch(
                test.getTargetBranch(), 
                org.springframework.data.domain.PageRequest.of(0, 40)
            );
            
            // Get technical questions
            List<DreamRoleTestQuestion> technicalQuestions = dreamRoleTestQuestionRepository.findByDreamRoleTestId(testId);
            
            // Combine all questions
            List<Map<String, Object>> allQuestions = new ArrayList<>();
            int questionNumber = 1;
            
            for (QuestionBank q : aptitudeQuestions) {
                Map<String, Object> questionMap = new HashMap<>();
                questionMap.put("id", "bank_" + q.getId());
                questionMap.put("questionNumber", questionNumber++);
                questionMap.put("question", q.getQuestion());
                questionMap.put("optionA", q.getOptionA());
                questionMap.put("optionB", q.getOptionB());
                questionMap.put("optionC", q.getOptionC());
                questionMap.put("optionD", q.getOptionD());
                questionMap.put("category", q.getCategory());
                questionMap.put("correctAnswer", q.getCorrectAnswer());
                questionMap.put("explanation", q.getExplanation());
                allQuestions.add(questionMap);
                
                q.setTimesUsed(q.getTimesUsed() + 1);
                questionBankRepository.save(q);
            }
            
            for (DreamRoleTestQuestion q : technicalQuestions) {
                Map<String, Object> questionMap = new HashMap<>();
                questionMap.put("id", "tech_" + q.getId());
                questionMap.put("questionNumber", questionNumber++);
                questionMap.put("question", q.getQuestion());
                questionMap.put("optionA", q.getOptionA());
                questionMap.put("optionB", q.getOptionB());
                questionMap.put("optionC", q.getOptionC());
                questionMap.put("optionD", q.getOptionD());
                questionMap.put("category", "Technical");
                questionMap.put("correctAnswer", q.getCorrectAnswer());
                questionMap.put("explanation", q.getExplanation());
                allQuestions.add(questionMap);
            }
            
            // Shuffle if needed
            if (test.getShuffleQuestions()) {
                Collections.shuffle(allQuestions);
                for (int i = 0; i < allQuestions.size(); i++) {
                    allQuestions.get(i).put("questionNumber", i + 1);
                }
            }
            
            DreamRoleTestAssignment dreamAssignment = new DreamRoleTestAssignment();
            dreamAssignment.setDreamRoleTest(test);
            dreamAssignment.setApplication(savedApplication);
            dreamAssignment.setAssignedAt(LocalDateTime.now());
            dreamAssignment.setDeadline(LocalDateTime.now().plusHours(deadlineHours));
            dreamAssignment.setStatus("PENDING");
            dreamAssignment.setTotalQuestions(allQuestions.size());
            try {
                dreamAssignment.setQuestions(objectMapper.writeValueAsString(allQuestions));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to serialize questions: " + e.getMessage());
            }
            
            DreamRoleTestAssignment savedDreamAssignment = dreamRoleTestAssignmentRepository.save(dreamAssignment);
            assignmentId = savedDreamAssignment.getId();
            System.out.println("✅ Created DreamRole test assignment with ID: " + assignmentId);
            
        } else {
            Optional<AptitudeTest> testOpt = aptitudeTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                throw new RuntimeException("Test not found: " + testId);
            }
            
            AptitudeTest test = testOpt.get();
            
            TestAssignment assignment = new TestAssignment();
            assignment.setTest(test);
            assignment.setApplication(savedApplication);
            assignment.setAssignedAt(LocalDateTime.now());
            assignment.setDeadline(LocalDateTime.now().plusHours(deadlineHours));
            assignment.setStatus("PENDING");
            assignment.setTotalQuestions(test.getTotalQuestions());
            
            TestAssignment savedAssignment = testAssignmentRepository.save(assignment);
            assignmentId = savedAssignment.getId();
            System.out.println("✅ Created manual test assignment with ID: " + assignmentId);
        }
        
        // Update candidate with test assignment info
        candidate.setHasTestAssigned(true);
        candidate.setTestAssignedAt(LocalDateTime.now());
        candidate.setTestId(testId);
        candidate.setTestType(isDreamRoleTest ? "DREAMROLE" : "MANUAL");
        candidate.setTestAssignmentId(assignmentId);
        candidateRepository.save(candidate);
        
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Test assigned successfully to external candidate");
        result.put("applicationId", savedApplication.getId());
        result.put("candidateId", candidateId);
        result.put("assignmentId", assignmentId);
        
        System.out.println("✅ Test assigned successfully! Application ID: " + savedApplication.getId());
        
        return result;
    }

    public Map<String, Object> getShortlistedCandidatesForTestAssignment(Long jobId) {
        List<ExternalCandidate> shortlisted = getShortlistedCandidates(jobId);
        
        List<Map<String, Object>> candidateDetails = shortlisted.stream()
            .map(candidate -> {
                Map<String, Object> detail = new HashMap<>();
                detail.put("candidateId", candidate.getId());
                detail.put("fullName", candidate.getFullName());
                detail.put("email", candidate.getEmail());
                detail.put("matchScore", candidate.getMatchPercentage());
                detail.put("status", candidate.getStatus());
                detail.put("shortlistedAt", candidate.getShortlistedAt());
                detail.put("isExistingUser", candidate.isExistingUser());
                detail.put("passwordStatus", candidate.getPasswordStatus());
                detail.put("hasTestAssigned", candidate.getHasTestAssigned());
                
                if (candidate.getUser() != null) {
                    detail.put("userId", candidate.getUser().getId());
                }
                
                return detail;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("candidates", candidateDetails);
        result.put("totalCandidates", candidateDetails.size());
        result.put("jobId", jobId);
        
        return result;
    }

    public List<Map<String, Object>> getShortlistedCandidatesForTestAssignmentByRecruiter(Long recruiterId) {
        List<ExternalCandidate> shortlistedCandidates = candidateRepository.findShortlistedCandidatesByRecruiterId(recruiterId);
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (ExternalCandidate candidate : shortlistedCandidates) {
            Map<String, Object> candidateMap = new HashMap<>();
            candidateMap.put("id", candidate.getId());
            candidateMap.put("applicantName", candidate.getFullName());
            candidateMap.put("applicantEmail", candidate.getEmail());
            candidateMap.put("applicantPhone", candidate.getPhone() != null ? candidate.getPhone() : "");
            candidateMap.put("applicantExperience", candidate.getExperienceYears() != null ? candidate.getExperienceYears() : 0);
            candidateMap.put("applicantEducation", candidate.getEducationLevel() != null ? candidate.getEducationLevel() : "Not specified");
            candidateMap.put("matchPercentage", candidate.getMatchPercentage() != null ? candidate.getMatchPercentage() : 0.0);
            candidateMap.put("status", candidate.getStatus());
            candidateMap.put("hasTest", candidate.getHasTestAssigned() != null ? candidate.getHasTestAssigned() : false);
            candidateMap.put("isExternalCandidate", true);
            candidateMap.put("isExistingUser", candidate.isExistingUser());
            candidateMap.put("passwordStatus", candidate.getPasswordStatus());
            candidateMap.put("testAssignmentId", candidate.getTestAssignmentId());
            
            if (candidate.getJobPosting() != null) {
                Map<String, Object> jobInfo = new HashMap<>();
                jobInfo.put("id", candidate.getJobPosting().getId());
                jobInfo.put("title", candidate.getJobPosting().getTitle());
                jobInfo.put("company", candidate.getJobPosting().getCompany());
                candidateMap.put("job", jobInfo);
            }
            
            if (candidate.getExtractedSkills() != null && !candidate.getExtractedSkills().isEmpty()) {
                candidateMap.put("applicantSkills", candidate.getExtractedSkills());
            } else {
                candidateMap.put("applicantSkills", "[]");
            }
            
            candidateMap.put("matchedSkills", candidate.getMatchedSkills() != null ? candidate.getMatchedSkills() : "[]");
            candidateMap.put("missingSkills", candidate.getMissingSkills() != null ? candidate.getMissingSkills() : "[]");
            
            result.add(candidateMap);
        }
        
        logger.info("Found {} shortlisted external candidates for recruiter {}", result.size(), recruiterId);
        return result;
    }

    public List<Map<String, Object>> getExternalCandidatesWithTestResults(Long jobId) {
        List<ExternalCandidate> candidates = candidateRepository.findByJobPostingId(jobId);
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (ExternalCandidate candidate : candidates) {
            Map<String, Object> result = new HashMap<>();
            result.put("candidateId", candidate.getId());
            result.put("fullName", candidate.getFullName());
            result.put("email", candidate.getEmail());
            result.put("phone", candidate.getPhone());
            result.put("matchPercentage", candidate.getMatchPercentage());
            result.put("status", candidate.getStatus());
            result.put("experienceYears", candidate.getExperienceYears());
            result.put("educationLevel", candidate.getEducationLevel());
            result.put("isExistingUser", candidate.isExistingUser());
            result.put("passwordStatus", candidate.getPasswordStatus());
            result.put("shortlistedAt", candidate.getShortlistedAt());
            result.put("hasTestAssigned", candidate.getHasTestAssigned());
            
            result.put("extractedSkills", parseSkillsFromJson(candidate.getExtractedSkills()));
            result.put("matchedSkills", parseSkillsFromJson(candidate.getMatchedSkills()));
            result.put("missingSkills", parseSkillsFromJson(candidate.getMissingSkills()));
            
            results.add(result);
        }
        
        return results;
    }

    public Map<String, Object> getExternalCandidateFullDetails(Long candidateId) {
        Optional<ExternalCandidate> candidateOpt = candidateRepository.findById(candidateId);
        if (candidateOpt.isEmpty()) {
            throw new RuntimeException("Candidate not found: " + candidateId);
        }
        
        ExternalCandidate candidate = candidateOpt.get();
        Map<String, Object> result = new HashMap<>();
        
        result.put("candidateId", candidate.getId());
        result.put("fullName", candidate.getFullName());
        result.put("email", candidate.getEmail());
        result.put("phone", candidate.getPhone());
        result.put("matchPercentage", candidate.getMatchPercentage());
        result.put("status", candidate.getStatus());
        result.put("experienceYears", candidate.getExperienceYears());
        result.put("educationLevel", candidate.getEducationLevel());
        result.put("isExistingUser", candidate.isExistingUser());
        result.put("passwordStatus", candidate.getPasswordStatus());
        result.put("shortlistedAt", candidate.getShortlistedAt());
        result.put("resumeFilePath", candidate.getResumeFilePath());
        result.put("hasTestAssigned", candidate.getHasTestAssigned());
        result.put("testAssignmentId", candidate.getTestAssignmentId());
        
        if (candidate.getJobPosting() != null) {
            Map<String, Object> jobInfo = new HashMap<>();
            jobInfo.put("id", candidate.getJobPosting().getId());
            jobInfo.put("title", candidate.getJobPosting().getTitle());
            jobInfo.put("company", candidate.getJobPosting().getCompany());
            jobInfo.put("location", candidate.getJobPosting().getLocation());
            jobInfo.put("jobType", candidate.getJobPosting().getJobType());
            jobInfo.put("requiredSkills", parseSkillsFromJson(candidate.getJobPosting().getRequiredSkills()));
            result.put("job", jobInfo);
        }
        
        result.put("extractedSkills", parseSkillsFromJson(candidate.getExtractedSkills()));
        result.put("matchedSkills", parseSkillsFromJson(candidate.getMatchedSkills()));
        result.put("missingSkills", parseSkillsFromJson(candidate.getMissingSkills()));
        
        return result;
    }

    public Map<String, Object> getExternalJobStats(Long jobId) {
        Optional<ExternalJobPosting> jobOpt = jobPostingRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            throw new RuntimeException("Job not found: " + jobId);
        }
        
        List<ExternalCandidate> allCandidates = candidateRepository.findByJobPostingId(jobId);
        long pendingCount = allCandidates.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        long shortlistedCount = allCandidates.stream().filter(c -> "SHORTLISTED".equals(c.getStatus())).count();
        
        double averageMatchScore = allCandidates.stream()
            .filter(c -> c.getMatchPercentage() != null)
            .mapToDouble(ExternalCandidate::getMatchPercentage)
            .average()
            .orElse(0.0);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCandidates", allCandidates.size());
        stats.put("pendingCandidates", pendingCount);
        stats.put("shortlistedCandidates", shortlistedCount);
        stats.put("averageMatchScore", Math.round(averageMatchScore * 100.0) / 100.0);
        stats.put("jobTitle", jobOpt.get().getTitle());
        stats.put("company", jobOpt.get().getCompany());
        stats.put("requiredCandidates", jobOpt.get().getRequiredCandidates());
        
        return stats;
    }

    public List<Map<String, Object>> getRecruiterExternalJobsWithStats(Long recruiterId) {
        List<ExternalJobPosting> jobs = jobPostingRepository.findByRecruiterId(recruiterId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (ExternalJobPosting job : jobs) {
            Map<String, Object> jobWithStats = new HashMap<>();
            jobWithStats.put("id", job.getId());
            jobWithStats.put("title", job.getTitle());
            jobWithStats.put("company", job.getCompany());
            jobWithStats.put("description", job.getDescription());
            jobWithStats.put("location", job.getLocation());
            jobWithStats.put("jobType", job.getJobType());
            jobWithStats.put("requiredCandidates", job.getRequiredCandidates());
            jobWithStats.put("createdAt", job.getCreatedAt());
            
            List<ExternalCandidate> allCandidates = candidateRepository.findByJobPostingId(job.getId());
            long pendingCount = allCandidates.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
            long shortlistedCount = allCandidates.stream().filter(c -> "SHORTLISTED".equals(c.getStatus())).count();
            
            double avgMatchScore = allCandidates.stream()
                .filter(c -> c.getMatchPercentage() != null)
                .mapToDouble(ExternalCandidate::getMatchPercentage)
                .average()
                .orElse(0.0);
            
            jobWithStats.put("totalCandidates", allCandidates.size());
            jobWithStats.put("pendingCount", pendingCount);
            jobWithStats.put("shortlistedCount", shortlistedCount);
            jobWithStats.put("averageMatchScore", Math.round(avgMatchScore * 100.0) / 100.0);
            jobWithStats.put("requiredSkills", parseSkillsFromJson(job.getRequiredSkills()));
            
            result.add(jobWithStats);
        }
        
        return result;
    }

    public Map<String, Object> getCandidateAnalysis(Long candidateId) {
        Optional<ExternalCandidate> candidateOpt = candidateRepository.findById(candidateId);
        if (candidateOpt.isEmpty()) {
            throw new RuntimeException("Candidate not found: " + candidateId);
        }
        
        ExternalCandidate candidate = candidateOpt.get();
        Map<String, Object> analysis = new HashMap<>();
        
        analysis.put("candidateId", candidate.getId());
        analysis.put("fullName", candidate.getFullName());
        analysis.put("email", candidate.getEmail());
        analysis.put("phone", candidate.getPhone());
        analysis.put("matchPercentage", candidate.getMatchPercentage());
        analysis.put("status", candidate.getStatus());
        analysis.put("experienceYears", candidate.getExperienceYears());
        analysis.put("educationLevel", candidate.getEducationLevel());
        analysis.put("isExistingUser", candidate.isExistingUser());
        analysis.put("passwordStatus", candidate.getPasswordStatus());
        analysis.put("shortlistedAt", candidate.getShortlistedAt());
        analysis.put("resumeFilePath", candidate.getResumeFilePath());
        analysis.put("hasTestAssigned", candidate.getHasTestAssigned());
        
        analysis.put("extractedSkills", parseSkillsFromJson(candidate.getExtractedSkills()));
        analysis.put("matchedSkills", parseSkillsFromJson(candidate.getMatchedSkills()));
        analysis.put("missingSkills", parseSkillsFromJson(candidate.getMissingSkills()));
        
        if (candidate.getUser() != null) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", candidate.getUser().getId());
            userInfo.put("email", candidate.getUser().getEmail());
            userInfo.put("fullName", candidate.getUser().getFullName());
            analysis.put("user", userInfo);
        }
        
        if (candidate.getJobPosting() != null) {
            Map<String, Object> jobInfo = new HashMap<>();
            jobInfo.put("id", candidate.getJobPosting().getId());
            jobInfo.put("title", candidate.getJobPosting().getTitle());
            jobInfo.put("company", candidate.getJobPosting().getCompany());
            analysis.put("job", jobInfo);
        }
        
        return analysis;
    }

    @Transactional
    public Map<String, Object> scheduleInterviewForExternalCandidate(Long candidateId, LocalDateTime interviewDate, 
                                                                      String interviewLocation, String notes) {
        Optional<ExternalCandidate> candidateOpt = candidateRepository.findById(candidateId);
        if (candidateOpt.isEmpty()) {
            throw new RuntimeException("Candidate not found: " + candidateId);
        }
        
        ExternalCandidate candidate = candidateOpt.get();
        candidate.setStatus("INTERVIEW_SCHEDULED");
        candidateRepository.save(candidate);
        
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Interview scheduled successfully for external candidate");
        result.put("candidateId", candidateId);
        result.put("candidateName", candidate.getFullName());
        result.put("interviewDate", interviewDate);
        result.put("interviewLocation", interviewLocation);
        
        return result;
    }

    @Transactional
    public Map<String, Object> deleteExternalJob(Long jobId, Long recruiterId) {
        Optional<ExternalJobPosting> jobOpt = jobPostingRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            throw new RuntimeException("Job not found: " + jobId);
        }

        ExternalJobPosting job = jobOpt.get();
        if (!job.getRecruiter().getId().equals(recruiterId)) {
            throw new RuntimeException("Not authorized to delete this job");
        }

        candidateRepository.deleteByJobPostingId(jobId);
        jobPostingRepository.deleteById(jobId);

        return Map.of("message", "External job deleted successfully");
    }

    // ========== HELPER METHODS ==========

    private String generateCredentialsCsv(Long jobId, List<ExternalCandidate> candidates, int newUsersCount, int existingUsersCount) {
        try {
            Path credentialsDir = Paths.get("uploads/external_resumes/");
            Files.createDirectories(credentialsDir);

            String fileName = "credentials_job_" + jobId + "_" + System.currentTimeMillis() + ".csv";
            Path filePath = credentialsDir.resolve(fileName);

            StringBuilder csv = new StringBuilder();
            csv.append("Full Name,Email,Password (for new users),Match Score,Experience,Education,User Type\n");

            for (ExternalCandidate candidate : candidates) {
                String passwordDisplay = "";
                String userType = "";
                
                if (candidate.isExistingUser() || (candidate.getUser() != null && candidate.getGeneratedPassword() == null)) {
                    passwordDisplay = "(existing user - use current password)";
                    userType = "EXISTING_USER";
                } else {
                    passwordDisplay = candidate.getGeneratedPassword() != null ? candidate.getGeneratedPassword() : "";
                    userType = "NEW_USER";
                }

                csv.append(escapeCsv(candidate.getFullName())).append(",")
                   .append(escapeCsv(candidate.getEmail())).append(",")
                   .append(escapeCsv(passwordDisplay)).append(",")
                   .append(candidate.getMatchPercentage() != null ? candidate.getMatchPercentage() : 0).append(",")
                   .append(candidate.getExperienceYears() != null ? candidate.getExperienceYears() : 0).append(",")
                   .append(escapeCsv(candidate.getEducationLevel() != null ? candidate.getEducationLevel() : "")).append(",")
                   .append(userType).append("\n");
            }

            csv.append("\n# SUMMARY #\n");
            csv.append("# Total Shortlisted: ").append(candidates.size()).append("\n");
            csv.append("# New Users: ").append(newUsersCount).append("\n");
            csv.append("# Existing Users: ").append(existingUsersCount).append("\n");

            Files.writeString(filePath, csv.toString());
            return "/uploads/external_resumes/" + fileName;

        } catch (IOException e) {
            logger.error("Failed to generate credentials CSV: {}", e.getMessage());
            return "";
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String generateSecurePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }

    private Set<String> parseSkillsFromJson(String json) {
        try {
            if (json != null && !json.trim().isEmpty()) {
                return objectMapper.readValue(json, new TypeReference<Set<String>>() {});
            }
        } catch (Exception e) {
            logger.warn("Failed to parse skills JSON: {}", e.getMessage());
        }
        return new HashSet<>();
    }

    private Map<String, Object> createCandidateSummary(ExternalCandidate candidate) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", candidate.getId());
        summary.put("fullName", candidate.getFullName());
        summary.put("email", candidate.getEmail());
        summary.put("matchPercentage", candidate.getMatchPercentage());
        summary.put("status", candidate.getStatus());
        summary.put("experienceYears", candidate.getExperienceYears());
        summary.put("educationLevel", candidate.getEducationLevel());
        summary.put("isExistingUser", candidate.isExistingUser());
        summary.put("passwordStatus", candidate.getPasswordStatus());
        summary.put("hasTestAssigned", candidate.getHasTestAssigned());
        return summary;
    }
}