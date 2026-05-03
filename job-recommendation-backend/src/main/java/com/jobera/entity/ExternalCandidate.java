// src/main/java/com/jobera/entity/ExternalCandidate.java
package com.jobera.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "external_candidates",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_candidate_email_job",
            columnNames = {"email", "job_posting_id"}
        )
    }
)
public class ExternalCandidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "job_posting_id", nullable = false)
    private ExternalJobPosting jobPosting;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    private String phone;

    @Column(columnDefinition = "LONGTEXT")
    private String resumeText;

    @Column(columnDefinition = "JSON")
    private String extractedSkills;

    private Integer experienceYears;
    private String educationLevel;

    private Double matchPercentage;

    @Column(columnDefinition = "JSON")
    private String matchedSkills;

    @Column(columnDefinition = "JSON")
    private String missingSkills;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private String resumeFilePath;

    private String generatedPassword;

    @Column(name = "is_existing_user")
    private Boolean isExistingUser = false;

    @Column(name = "password_status")
    private String passwordStatus;

    private LocalDateTime shortlistedAt;

    // Test assignment tracking fields
    @Column(name = "has_test_assigned")
    private Boolean hasTestAssigned = false;

    @Column(name = "test_assigned_at")
    private LocalDateTime testAssignedAt;

    @Column(name = "test_id")
    private Long testId;

    @Column(name = "test_type")
    private String testType;

    @Column(name = "test_assignment_id")
    private Long testAssignmentId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (extractedSkills == null || extractedSkills.isEmpty()) {
            extractedSkills = "[]";
        }
        if (matchedSkills == null || matchedSkills.isEmpty()) {
            matchedSkills = "[]";
        }
        if (missingSkills == null || missingSkills.isEmpty()) {
            missingSkills = "[]";
        }
        if (matchPercentage == null) {
            matchPercentage = 0.0;
        }
        if (isExistingUser == null) {
            isExistingUser = false;
        }
        if (hasTestAssigned == null) {
            hasTestAssigned = false;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ExternalJobPosting getJobPosting() { return jobPosting; }
    public void setJobPosting(ExternalJobPosting jobPosting) { this.jobPosting = jobPosting; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getResumeText() { return resumeText; }
    public void setResumeText(String resumeText) { this.resumeText = resumeText; }

    public String getExtractedSkills() { return extractedSkills; }
    public void setExtractedSkills(String extractedSkills) {
        if (extractedSkills == null || extractedSkills.isEmpty()) {
            this.extractedSkills = "[]";
        } else {
            this.extractedSkills = extractedSkills;
        }
    }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getEducationLevel() { return educationLevel; }
    public void setEducationLevel(String educationLevel) { this.educationLevel = educationLevel; }

    public Double getMatchPercentage() { return matchPercentage; }
    public void setMatchPercentage(Double matchPercentage) { this.matchPercentage = matchPercentage; }

    public String getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(String matchedSkills) {
        if (matchedSkills == null || matchedSkills.isEmpty()) {
            this.matchedSkills = "[]";
        } else {
            this.matchedSkills = matchedSkills;
        }
    }

    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) {
        if (missingSkills == null || missingSkills.isEmpty()) {
            this.missingSkills = "[]";
        } else {
            this.missingSkills = missingSkills;
        }
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResumeFilePath() { return resumeFilePath; }
    public void setResumeFilePath(String resumeFilePath) { this.resumeFilePath = resumeFilePath; }

    public String getGeneratedPassword() { return generatedPassword; }
    public void setGeneratedPassword(String generatedPassword) { this.generatedPassword = generatedPassword; }

    public Boolean getIsExistingUser() { return isExistingUser; }
    public void setIsExistingUser(Boolean isExistingUser) { this.isExistingUser = isExistingUser; }

    public String getPasswordStatus() { return passwordStatus; }
    public void setPasswordStatus(String passwordStatus) { this.passwordStatus = passwordStatus; }

    public LocalDateTime getShortlistedAt() { return shortlistedAt; }
    public void setShortlistedAt(LocalDateTime shortlistedAt) { this.shortlistedAt = shortlistedAt; }

    public Boolean getHasTestAssigned() { return hasTestAssigned; }
    public void setHasTestAssigned(Boolean hasTestAssigned) { this.hasTestAssigned = hasTestAssigned; }

    public LocalDateTime getTestAssignedAt() { return testAssignedAt; }
    public void setTestAssignedAt(LocalDateTime testAssignedAt) { this.testAssignedAt = testAssignedAt; }

    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public Long getTestAssignmentId() { return testAssignmentId; }
    public void setTestAssignmentId(Long testAssignmentId) { this.testAssignmentId = testAssignmentId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Helper methods
    public boolean isNewUser() {
        return generatedPassword != null && !generatedPassword.isEmpty() && !Boolean.TRUE.equals(isExistingUser);
    }

    public boolean isExistingUser() {
        return Boolean.TRUE.equals(isExistingUser);
    }
}