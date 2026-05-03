// src/main/java/com/jobera/entity/Application.java
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "job_posting_id", nullable = true)  // IMPORTANT: Allow null for external candidates
    private JobPosting jobPosting;
    
    private LocalDateTime applicationDate;
    
    @Column(nullable = false)
    private String status = "APPLICATION_SUBMITTED";
    
    @Column(columnDefinition = "LONGTEXT")
    private String coverLetter;
    
    @Column(name = "applicant_name")
    private String applicantName;
    
    @Column(name = "applicant_email")
    private String applicantEmail;
    
    @Column(name = "applicant_phone")
    private String applicantPhone;
    
    @Column(columnDefinition = "JSON")
    private String applicantSkills;
    
    @Column(name = "applicant_experience")
    private Integer applicantExperience;
    
    @Column(name = "applicant_education")
    private String applicantEducation;
    
    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;
    
    @Column(name = "interview_date")
    private LocalDateTime interviewDate;
    
    @Column(name = "interview_location")
    private String interviewLocation;
    
    @Column(name = "recruiter_notes", columnDefinition = "TEXT")
    private String recruiterNotes;
    
    @Column(name = "viewed_by_recruiter")
    private Boolean viewedByRecruiter = false;
    
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;
    
    // Resume matching fields
    @Column(name = "match_percentage")
    private Double matchPercentage = 0.0;
    
    @Column(name = "matched_skills", columnDefinition = "JSON")
    private String matchedSkills;
    
    @Column(name = "missing_skills", columnDefinition = "JSON")
    private String missingSkills;
    
    @Column(name = "resume_file_path")
    private String resumeFilePath;
    
    @Column(name = "resume_parsed_text", columnDefinition = "LONGTEXT")
    private String resumeParsedText;

    @PrePersist
    protected void onCreate() {
        applicationDate = LocalDateTime.now();
        statusUpdatedAt = LocalDateTime.now();
        if (status == null) {
            status = "APPLICATION_SUBMITTED";
        }
        if (viewedByRecruiter == null) {
            viewedByRecruiter = false;
        }
        if (matchPercentage == null) {
            matchPercentage = 0.0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        statusUpdatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Application() {}
    
    public Application(User user, JobPosting jobPosting, String coverLetter) {
        this.user = user;
        this.jobPosting = jobPosting;
        this.coverLetter = coverLetter;
        this.applicantName = user.getFullName();
        this.applicantEmail = user.getEmail();
        this.applicantPhone = user.getPhone();
        this.status = "APPLICATION_SUBMITTED";
    }
    
    public Application(User user, JobPosting jobPosting, String coverLetter, 
                      String applicantSkills, Integer applicantExperience, 
                      String applicantEducation) {
        this.user = user;
        this.jobPosting = jobPosting;
        this.coverLetter = coverLetter;
        this.applicantName = user.getFullName();
        this.applicantEmail = user.getEmail();
        this.applicantPhone = user.getPhone();
        this.applicantSkills = applicantSkills;
        this.applicantExperience = applicantExperience;
        this.applicantEducation = applicantEducation;
        this.status = "APPLICATION_SUBMITTED";
    }
    
    // Enhanced constructor for resume applications
    public Application(User user, JobPosting jobPosting, String coverLetter, 
                      String applicantSkills, Integer applicantExperience, 
                      String applicantEducation, String resumeFilePath, 
                      String resumeParsedText) {
        this.user = user;
        this.jobPosting = jobPosting;
        this.coverLetter = coverLetter;
        this.applicantName = user.getFullName();
        this.applicantEmail = user.getEmail();
        this.applicantPhone = user.getPhone();
        this.applicantSkills = applicantSkills;
        this.applicantExperience = applicantExperience;
        this.applicantEducation = applicantEducation;
        this.resumeFilePath = resumeFilePath;
        this.resumeParsedText = resumeParsedText;
        this.status = "APPLICATION_SUBMITTED";
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public JobPosting getJobPosting() { return jobPosting; }
    public void setJobPosting(JobPosting jobPosting) { this.jobPosting = jobPosting; }
    
    public LocalDateTime getApplicationDate() { return applicationDate; }
    public void setApplicationDate(LocalDateTime applicationDate) { this.applicationDate = applicationDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }
    
    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }
    
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }
    
    public String getApplicantPhone() { return applicantPhone; }
    public void setApplicantPhone(String applicantPhone) { this.applicantPhone = applicantPhone; }
    
    public String getApplicantSkills() { return applicantSkills; }
    public void setApplicantSkills(String applicantSkills) { this.applicantSkills = applicantSkills; }
    
    public Integer getApplicantExperience() { return applicantExperience; }
    public void setApplicantExperience(Integer applicantExperience) { this.applicantExperience = applicantExperience; }
    
    public String getApplicantEducation() { return applicantEducation; }
    public void setApplicantEducation(String applicantEducation) { this.applicantEducation = applicantEducation; }
    
    public LocalDateTime getStatusUpdatedAt() { return statusUpdatedAt; }
    public void setStatusUpdatedAt(LocalDateTime statusUpdatedAt) { this.statusUpdatedAt = statusUpdatedAt; }
    
    public LocalDateTime getInterviewDate() { return interviewDate; }
    public void setInterviewDate(LocalDateTime interviewDate) { this.interviewDate = interviewDate; }
    
    public String getInterviewLocation() { return interviewLocation; }
    public void setInterviewLocation(String interviewLocation) { this.interviewLocation = interviewLocation; }
    
    public String getRecruiterNotes() { return recruiterNotes; }
    public void setRecruiterNotes(String recruiterNotes) { this.recruiterNotes = recruiterNotes; }
    
    public Boolean getViewedByRecruiter() { return viewedByRecruiter; }
    public void setViewedByRecruiter(Boolean viewedByRecruiter) { this.viewedByRecruiter = viewedByRecruiter; }
    
    public LocalDateTime getViewedAt() { return viewedAt; }
    public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
    
    public Double getMatchPercentage() { return matchPercentage; }
    public void setMatchPercentage(Double matchPercentage) { this.matchPercentage = matchPercentage; }
    
    public String getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(String matchedSkills) { this.matchedSkills = matchedSkills; }
    
    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) { this.missingSkills = missingSkills; }
    
    public String getResumeFilePath() { return resumeFilePath; }
    public void setResumeFilePath(String resumeFilePath) { this.resumeFilePath = resumeFilePath; }
    
    public String getResumeParsedText() { return resumeParsedText; }
    public void setResumeParsedText(String resumeParsedText) { this.resumeParsedText = resumeParsedText; }
    
    // Helper Methods
    public String getSafeApplicantName() {
        if (this.applicantName != null && !this.applicantName.trim().isEmpty()) {
            return this.applicantName;
        }
        return this.user != null ? this.user.getFullName() : "Unknown Applicant";
    }
    
    public String getSafeApplicantEmail() {
        if (this.applicantEmail != null && !this.applicantEmail.trim().isEmpty()) {
            return this.applicantEmail;
        }
        return this.user != null ? this.user.getEmail() : "No email provided";
    }
    
    public String getSafeApplicantPhone() {
        if (this.applicantPhone != null && !this.applicantPhone.trim().isEmpty()) {
            return this.applicantPhone;
        }
        return this.user != null ? this.user.getPhone() : "No phone provided";
    }
    
    public boolean hasResume() {
        return this.resumeFilePath != null && !this.resumeFilePath.trim().isEmpty();
    }
    
    public boolean isRecent() {
        return applicationDate != null && 
               applicationDate.isAfter(LocalDateTime.now().minusDays(7));
    }
    
    // Status helper methods
    public boolean isApplicationSubmitted() {
        return "APPLICATION_SUBMITTED".equals(status);
    }
    
    public boolean isViewedByRecruiter() {
        return Boolean.TRUE.equals(viewedByRecruiter);
    }
    
    public boolean isShortlisted() {
        return "SHORTLISTED".equals(status);
    }
    
    public boolean isInterviewScheduled() {
        return "INTERVIEW_SCHEDULED".equals(status);
    }
    
    public boolean isRejected() {
        return "REJECTED".equals(status);
    }
    
    public boolean isOfferSent() {
        return "OFFER_SENT".equals(status);
    }
    
    // Status update methods
    public void markAsViewed() {
        this.viewedByRecruiter = true;
        this.viewedAt = LocalDateTime.now();
        if ("APPLICATION_SUBMITTED".equals(this.status)) {
            this.status = "VIEWED_BY_RECRUITER";
        }
    }
    
    public void shortlist() {
        this.status = "SHORTLISTED";
        this.statusUpdatedAt = LocalDateTime.now();
    }
    
    public void scheduleInterview(LocalDateTime interviewDate, String location) {
        this.status = "INTERVIEW_SCHEDULED";
        this.interviewDate = interviewDate;
        this.interviewLocation = location;
        this.statusUpdatedAt = LocalDateTime.now();
    }
    
    public void reject() {
        this.status = "REJECTED";
        this.statusUpdatedAt = LocalDateTime.now();
    }
    
    public void sendOffer() {
        this.status = "OFFER_SENT";
        this.statusUpdatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "Application{" +
                "id=" + id +
                ", applicantName='" + getSafeApplicantName() + '\'' +
                ", jobTitle='" + (jobPosting != null ? jobPosting.getTitle() : "External Job") + '\'' +
                ", status='" + status + '\'' +
                ", applicationDate=" + applicationDate +
                ", hasResume=" + hasResume() +
                ", matchPercentage=" + matchPercentage +
                '}';
    }
}