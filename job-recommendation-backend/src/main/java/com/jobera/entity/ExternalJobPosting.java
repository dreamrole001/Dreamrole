// src/main/java/com/jobera/entity/ExternalJobPosting.java
package com.jobera.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_job_postings")
public class ExternalJobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "recruiter_id", nullable = false)
    private Recruiter recruiter;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String company;
    
    @Column(columnDefinition = "LONGTEXT")
    private String description;
    
    @Column(columnDefinition = "JSON")
    private String requiredSkills;
    
    @Column(columnDefinition = "JSON")
    private String preferredSkills;
    
    private String location;
    private String salaryRange;
    private String jobType;
    private String experienceLevel;
    
    @Column(nullable = false)
    private Integer requiredCandidates = 0;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            requiredSkills = "[]";
        }
        if (preferredSkills == null || preferredSkills.isEmpty()) {
            preferredSkills = "[]";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Recruiter getRecruiter() { return recruiter; }
    public void setRecruiter(Recruiter recruiter) { this.recruiter = recruiter; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) {
        if (requiredSkills == null || requiredSkills.trim().isEmpty()) {
            this.requiredSkills = "[]";
        } else {
            this.requiredSkills = requiredSkills;
        }
    }
    
    public String getPreferredSkills() { return preferredSkills; }
    public void setPreferredSkills(String preferredSkills) {
        if (preferredSkills == null || preferredSkills.trim().isEmpty()) {
            this.preferredSkills = "[]";
        } else {
            this.preferredSkills = preferredSkills;
        }
    }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
    
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
    
    public Integer getRequiredCandidates() { return requiredCandidates; }
    public void setRequiredCandidates(Integer requiredCandidates) { this.requiredCandidates = requiredCandidates; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}