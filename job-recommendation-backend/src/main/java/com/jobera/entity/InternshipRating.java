package com.jobera.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "internship_ratings")
public class InternshipRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "job_posting_id", nullable = false)
    private Long jobPostingId;
    
    @Column(name = "internship_title")
    private String internshipTitle;
    
    @Column(name = "internship_company")
    private String internshipCompany;
    
    @Column(nullable = false)
    private Integer rating;
    
    private String comment;
    
    @Column(updatable = false)
    private LocalDateTime ratedAt;
    
    @PrePersist
    protected void onCreate() {
        ratedAt = LocalDateTime.now();
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
    
    public Long getJobPostingId() { 
        return jobPostingId; 
    }
    
    public void setJobPostingId(Long jobPostingId) { 
        this.jobPostingId = jobPostingId; 
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
    
    public Integer getRating() { 
        return rating; 
    }
    
    public void setRating(Integer rating) { 
        this.rating = rating; 
    }
    
    public String getComment() { 
        return comment; 
    }
    
    public void setComment(String comment) { 
        this.comment = comment; 
    }
    
    public LocalDateTime getRatedAt() { 
        return ratedAt; 
    }
    
    public void setRatedAt(LocalDateTime ratedAt) { 
        this.ratedAt = ratedAt; 
    }
}