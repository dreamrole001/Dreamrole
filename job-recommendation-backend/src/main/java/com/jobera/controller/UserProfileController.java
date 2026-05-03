// src/main/java/com/jobera/controller/UserProfileController.java
package com.jobera.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobera.entity.Resume;
import com.jobera.entity.User;
import com.jobera.entity.UserCertification;
import com.jobera.entity.UserEducation;
import com.jobera.entity.UserExperience;
import com.jobera.entity.UserSkill;
import com.jobera.repository.ResumeRepository;
import com.jobera.repository.UserCertificationRepository;
import com.jobera.repository.UserEducationRepository;
import com.jobera.repository.UserExperienceRepository;
import com.jobera.repository.UserRepository;
import com.jobera.repository.UserSkillRepository;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserProfileController {
    
    private static final String FIELD_FULL_NAME = "fullName";
    private static final String FIELD_PHONE = "phone";
    private static final String FIELD_DATE_OF_BIRTH = "dateOfBirth";
    private static final String FIELD_LOCATION = "location";
    private static final String FIELD_BIO = "bio";
    private static final String FIELD_HEADLINE = "headline";
    private static final String FIELD_WEBSITE = "website";
    private static final String FIELD_LINKEDIN = "linkedin";
    private static final String FIELD_GITHUB = "github";
    private static final String ERROR_KEY = "error";
    private static final String MESSAGE_KEY = "message";
    
    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserEducationRepository userEducationRepository;
    private final UserExperienceRepository userExperienceRepository;
    private final UserCertificationRepository userCertificationRepository;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper;
    
    public UserProfileController(
            UserRepository userRepository,
            UserSkillRepository userSkillRepository,
            UserEducationRepository userEducationRepository,
            UserExperienceRepository userExperienceRepository,
            UserCertificationRepository userCertificationRepository,
            ResumeRepository resumeRepository) {
        this.userRepository = userRepository;
        this.userSkillRepository = userSkillRepository;
        this.userEducationRepository = userEducationRepository;
        this.userExperienceRepository = userExperienceRepository;
        this.userCertificationRepository = userCertificationRepository;
        this.resumeRepository = resumeRepository;
        this.objectMapper = new ObjectMapper();
    }
    
    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            List<UserSkill> skills = userSkillRepository.findByUserId(userId);
            List<UserEducation> education = userEducationRepository.findByUserId(userId);
            List<UserExperience> experience = userExperienceRepository.findByUserId(userId);
            List<UserCertification> certifications = userCertificationRepository.findByUserId(userId);
            
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put(FIELD_FULL_NAME, user.getFullName());
            profile.put("email", user.getEmail());
            profile.put(FIELD_PHONE, user.getPhone());
            profile.put(FIELD_DATE_OF_BIRTH, user.getDateOfBirth());
            profile.put(FIELD_LOCATION, user.getLocation());
            profile.put(FIELD_BIO, user.getBio());
            profile.put(FIELD_HEADLINE, user.getHeadline());
            profile.put(FIELD_WEBSITE, user.getWebsite());
            profile.put(FIELD_LINKEDIN, user.getLinkedin());
            profile.put(FIELD_GITHUB, user.getGithub());
            profile.put("profilePicture", user.getProfilePicture());
            profile.put("skills", skills);
            profile.put("education", education);
            profile.put("experience", experience);
            profile.put("certifications", certifications);
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(ERROR_KEY, e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/{userId}/complete-profile")
    public ResponseEntity<Map<String, Object>> getCompleteUserProfile(@PathVariable Long userId) {
        try {
            System.out.println("=== GET COMPLETE USER PROFILE ===");
            System.out.println("User ID: " + userId);
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // Get skills from user_skills table
            List<UserSkill> skills = userSkillRepository.findByUserId(userId);
            List<String> skillNames = skills.stream()
                .map(UserSkill::getSkillName)
                .collect(Collectors.toList());
            
            // Get latest resume
            Optional<Resume> latestResume = resumeRepository.findFirstByUserIdOrderByUploadDateDesc(userId);
            
            Map<String, Object> completeProfile = new HashMap<>();
            completeProfile.put("id", user.getId());
            completeProfile.put(FIELD_FULL_NAME, user.getFullName());
            completeProfile.put("email", user.getEmail());
            completeProfile.put(FIELD_PHONE, user.getPhone());
            completeProfile.put(FIELD_DATE_OF_BIRTH, user.getDateOfBirth());
            completeProfile.put(FIELD_LOCATION, user.getLocation());
            completeProfile.put(FIELD_BIO, user.getBio());
            completeProfile.put(FIELD_HEADLINE, user.getHeadline());
            completeProfile.put(FIELD_WEBSITE, user.getWebsite());
            completeProfile.put(FIELD_LINKEDIN, user.getLinkedin());
            completeProfile.put(FIELD_GITHUB, user.getGithub());
            completeProfile.put("profilePicture", user.getProfilePicture());
            completeProfile.put("skills", skillNames);
            
            if (latestResume.isPresent()) {
                Resume resume = latestResume.get();
                completeProfile.put("educationLevel", resume.getEducationLevel() != null ? resume.getEducationLevel() : "Not specified");
                completeProfile.put("experienceYears", resume.getExperienceYears() != null ? resume.getExperienceYears() : 0);
                completeProfile.put("resumeSkills", parseSkillsFromJson(resume.getSkills()));
                completeProfile.put("hasResume", true);
                completeProfile.put("resumeId", resume.getId());
                completeProfile.put("resumeFileName", resume.getFileName());
            } else {
                completeProfile.put("educationLevel", "Not specified");
                completeProfile.put("experienceYears", 0);
                completeProfile.put("resumeSkills", new ArrayList<>());
                completeProfile.put("hasResume", false);
            }
            
            // Calculate age if date of birth is available
            if (user.getDateOfBirth() != null) {
                LocalDate birthDate = user.getDateOfBirth();
                LocalDate today = LocalDate.now();
                int age = Period.between(birthDate, today).getYears();
                completeProfile.put("age", age);
                completeProfile.put("ageEligible", age >= 21 && age <= 24);
            } else {
                completeProfile.put("age", null);
                completeProfile.put("ageEligible", false);
            }
            
            System.out.println("✅ Complete profile fetched for user: " + user.getFullName());
            System.out.println("   Age: " + completeProfile.get("age"));
            System.out.println("   Education: " + completeProfile.get("educationLevel"));
            System.out.println("   Experience: " + completeProfile.get("experienceYears") + " years");
            System.out.println("   Skills: " + skillNames.size());
            
            return ResponseEntity.ok(completeProfile);
            
        } catch (Exception e) {
            System.err.println("❌ Error fetching complete profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch profile: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{userId}/age")
    public ResponseEntity<Map<String, Object>> getUserAge(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            Integer age = null;
            boolean ageValid = false;
            String message = "Age not provided";
            
            if (user.getDateOfBirth() != null) {
                LocalDate birthDate = user.getDateOfBirth();
                LocalDate today = LocalDate.now();
                age = Period.between(birthDate, today).getYears();
                ageValid = age >= 21 && age <= 24;
                message = ageValid ? "Age eligible" : "Age must be between 21 and 24 years";
            }
            
            return ResponseEntity.ok(Map.of(
                "dateOfBirth", user.getDateOfBirth(),
                "age", age,
                "isEligible", ageValid,
                "message", message
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to calculate age: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> profileData) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            if (profileData.containsKey(FIELD_FULL_NAME)) {
                user.setFullName((String) profileData.get(FIELD_FULL_NAME));
            }
            if (profileData.containsKey(FIELD_PHONE)) {
                user.setPhone((String) profileData.get(FIELD_PHONE));
            }
            if (profileData.containsKey(FIELD_DATE_OF_BIRTH) && profileData.get(FIELD_DATE_OF_BIRTH) != null) {
                String dobStr = (String) profileData.get(FIELD_DATE_OF_BIRTH);
                if (!dobStr.isEmpty()) {
                    user.setDateOfBirth(LocalDate.parse(dobStr));
                }
            }
            if (profileData.containsKey(FIELD_LOCATION)) {
                user.setLocation((String) profileData.get(FIELD_LOCATION));
            }
            if (profileData.containsKey(FIELD_BIO)) {
                user.setBio((String) profileData.get(FIELD_BIO));
            }
            if (profileData.containsKey(FIELD_HEADLINE)) {
                user.setHeadline((String) profileData.get(FIELD_HEADLINE));
            }
            if (profileData.containsKey(FIELD_WEBSITE)) {
                user.setWebsite((String) profileData.get(FIELD_WEBSITE));
            }
            if (profileData.containsKey(FIELD_LINKEDIN)) {
                user.setLinkedin((String) profileData.get(FIELD_LINKEDIN));
            }
            if (profileData.containsKey(FIELD_GITHUB)) {
                user.setGithub((String) profileData.get(FIELD_GITHUB));
            }
            
            User savedUser = userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put(FIELD_FULL_NAME, savedUser.getFullName());
            response.put("email", savedUser.getEmail());
            response.put(FIELD_PHONE, savedUser.getPhone());
            response.put(FIELD_DATE_OF_BIRTH, savedUser.getDateOfBirth());
            response.put(FIELD_LOCATION, savedUser.getLocation());
            response.put(FIELD_BIO, savedUser.getBio());
            response.put(FIELD_HEADLINE, savedUser.getHeadline());
            response.put(FIELD_WEBSITE, savedUser.getWebsite());
            response.put(FIELD_LINKEDIN, savedUser.getLinkedin());
            response.put(FIELD_GITHUB, savedUser.getGithub());
            response.put("profilePicture", savedUser.getProfilePicture());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(ERROR_KEY, "Failed to update profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/{userId}/profile-picture")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Create upload directory if it doesn't exist
            String uploadDir = "uploads/profiles/";
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created upload directory: " + uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = userId + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            Path filePath = uploadPath.resolve(fileName);
            
            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved to: " + filePath);
            
            // Store relative path (for web access)
            String fileUrl = "/uploads/profiles/" + fileName;
            
            // Update user profile picture
            User user = userOpt.get();
            user.setProfilePicture(fileUrl);
            userRepository.save(user);
            
            System.out.println("Profile picture updated for user " + userId + ": " + fileUrl);
            
            Map<String, String> response = new HashMap<>();
            response.put(MESSAGE_KEY, "Profile picture uploaded successfully");
            response.put("profilePictureUrl", fileUrl);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            System.err.println("Error uploading profile picture: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to upload image: " + e.getMessage()));
        }
    }
    
    @GetMapping("/check-uploads")
    public ResponseEntity<Map<String, Object>> checkUploads() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            Path uploadPath = Paths.get("uploads/profiles/").toAbsolutePath().normalize();
            result.put("uploadPath", uploadPath.toString());
            result.put("uploadPathExists", Files.exists(uploadPath));
            
            if (Files.exists(uploadPath)) {
                List<String> files = Files.list(uploadPath)
                        .map(path -> path.getFileName().toString())
                        .collect(Collectors.toList());
                result.put("files", files);
                result.put("fileCount", files.size());
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/skills")
    public ResponseEntity<Map<String, Object>> addSkill(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            UserSkill skill = new UserSkill();
            skill.setUser(userOpt.get());
            skill.setSkillName(request.get("skill"));
            
            UserSkill saved = userSkillRepository.save(skill);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("name", saved.getSkillName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to add skill: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{userId}/skills/{skillId}")
    public ResponseEntity<Map<String, String>> removeSkill(
            @PathVariable Long userId,
            @PathVariable Long skillId) {
        try {
            userSkillRepository.deleteById(skillId);
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Skill removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to remove skill: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/education")
    public ResponseEntity<Map<String, Object>> addEducation(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> educationData) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            UserEducation education = new UserEducation();
            education.setUser(userOpt.get());
            education.setDegree((String) educationData.get("degree"));
            education.setInstitution((String) educationData.get("institution"));
            education.setYear((String) educationData.get("year"));
            education.setPercentage((String) educationData.get("percentage"));
            education.setDescription((String) educationData.get("description"));
            
            UserEducation saved = userEducationRepository.save(education);
            
            Map<String, Object> response = new HashMap<>();
            response.put(MESSAGE_KEY, "Education added successfully");
            response.put("education", saved);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to add education: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{userId}/education/{educationId}")
    public ResponseEntity<Map<String, String>> removeEducation(
            @PathVariable Long userId,
            @PathVariable Long educationId) {
        try {
            userEducationRepository.deleteById(educationId);
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Education removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to remove education: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/experience")
    public ResponseEntity<Map<String, Object>> addExperience(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> experienceData) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            UserExperience experience = new UserExperience();
            experience.setUser(userOpt.get());
            experience.setTitle((String) experienceData.get("title"));
            experience.setCompany((String) experienceData.get("company"));
            experience.setLocation((String) experienceData.get("location"));
            experience.setStartDate((String) experienceData.get("startDate"));
            experience.setEndDate((String) experienceData.get("endDate"));
            experience.setCurrent((Boolean) experienceData.getOrDefault("current", false));
            experience.setDescription((String) experienceData.get("description"));
            
            UserExperience saved = userExperienceRepository.save(experience);
            
            Map<String, Object> response = new HashMap<>();
            response.put(MESSAGE_KEY, "Experience added successfully");
            response.put("experience", saved);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to add experience: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{userId}/experience/{experienceId}")
    public ResponseEntity<Map<String, String>> removeExperience(
            @PathVariable Long userId,
            @PathVariable Long experienceId) {
        try {
            userExperienceRepository.deleteById(experienceId);
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Experience removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to remove experience: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/certifications")
    public ResponseEntity<Map<String, Object>> addCertification(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            UserCertification cert = new UserCertification();
            cert.setUser(userOpt.get());
            cert.setName(request.get("name"));
            cert.setIssuer(request.get("issuer"));
            cert.setDate(request.get("date"));
            cert.setCredentialId(request.get("credentialId"));
            cert.setUrl(request.get("url"));
            
            UserCertification saved = userCertificationRepository.save(cert);
            
            Map<String, Object> response = new HashMap<>();
            response.put(MESSAGE_KEY, "Certification added successfully");
            response.put("id", saved.getId());
            response.put("name", saved.getName());
            response.put("issuer", saved.getIssuer());
            response.put("date", saved.getDate());
            response.put("credentialId", saved.getCredentialId());
            response.put("url", saved.getUrl());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to add certification: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{userId}/certifications/{certId}")
    public ResponseEntity<Map<String, String>> removeCertification(
            @PathVariable Long userId,
            @PathVariable Long certId) {
        try {
            userCertificationRepository.deleteById(certId);
            return ResponseEntity.ok(Map.of(MESSAGE_KEY, "Certification removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(ERROR_KEY, "Failed to remove certification: " + e.getMessage()));
        }
    }
    
    // Helper method to parse skills from JSON
    private List<String> parseSkillsFromJson(String skillsJson) {
        if (skillsJson == null || skillsJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            if (skillsJson.startsWith("[") && skillsJson.endsWith("]")) {
                return objectMapper.readValue(skillsJson, new TypeReference<List<String>>() {});
            } else {
                // Handle comma-separated string
                String cleaned = skillsJson.replace("[", "").replace("]", "").replace("\"", "");
                String[] skills = cleaned.split(",");
                List<String> result = new ArrayList<>();
                for (String skill : skills) {
                    String trimmed = skill.trim();
                    if (!trimmed.isEmpty()) {
                        result.add(trimmed);
                    }
                }
                return result;
            }
        } catch (Exception e) {
            System.err.println("Error parsing skills JSON: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}