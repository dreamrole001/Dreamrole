// src/main/java/com/jobera/entity/InternshipApplication.java
package com.jobera.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "internship_applications")
public class InternshipApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "internship_id", nullable = false)
    private Long internshipId;
    
    @Column(name = "internship_title")
    private String internshipTitle;
    
    @Column(name = "internship_company")
    private String internshipCompany;
    
    private LocalDateTime applicationDate;
    private String status = "APPLIED";
    
    @Column(columnDefinition = "LONGTEXT")
    private String coverLetter;
    
    @Column(columnDefinition = "JSON")
    private String applicantSkills;
    
    private Integer applicantExperience;
    private String applicantEducation;
    
    @Column(name = "match_percentage")
    private Double matchPercentage = 0.0;
    
    @Column(name = "matched_skills", columnDefinition = "JSON")
    private String matchedSkills;
    
    @Column(name = "missing_skills", columnDefinition = "JSON")
    private String missingSkills;
    
    @PrePersist
    protected void onCreate() {
        applicationDate = LocalDateTime.now();
        if (status == null) {
            status = "APPLIED";
        }
        if (matchPercentage == null) {
            matchPercentage = 0.0;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Long getInternshipId() {
        return internshipId;
    }
    
    public void setInternshipId(Long internshipId) {
        this.internshipId = internshipId;
    }
    
    public String getInternshipTitle() {
        return internshipTitle;
    }
    
    public void setInternshipTitle(String internshipTitle) {
        this.internshipTitle = internshipTitle;
    }
    
    public String getInternshipCompany() {
        return internshipCompany;
    }
    
    public void setInternshipCompany(String internshipCompany) {
        this.internshipCompany = internshipCompany;
    }
    
    public LocalDateTime getApplicationDate() {
        return applicationDate;
    }
    
    public void setApplicationDate(LocalDateTime applicationDate) {
        this.applicationDate = applicationDate;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getCoverLetter() {
        return coverLetter;
    }
    
    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
    
    public String getApplicantSkills() {
        return applicantSkills;
    }
    
    public void setApplicantSkills(String applicantSkills) {
        this.applicantSkills = applicantSkills;
    }
    
    public Integer getApplicantExperience() {
        return applicantExperience;
    }
    
    public void setApplicantExperience(Integer applicantExperience) {
        this.applicantExperience = applicantExperience;
    }
    
    public String getApplicantEducation() {
        return applicantEducation;
    }
    
    public void setApplicantEducation(String applicantEducation) {
        this.applicantEducation = applicantEducation;
    }
    
    public Double getMatchPercentage() {
        return matchPercentage;
    }
    
    public void setMatchPercentage(Double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }
    
    public String getMatchedSkills() {
        return matchedSkills;
    }
    
    public void setMatchedSkills(String matchedSkills) {
        this.matchedSkills = matchedSkills;
    }
    
    public String getMissingSkills() {
        return missingSkills;
    }
    
    public void setMissingSkills(String missingSkills) {
        this.missingSkills = missingSkills;
    }
}