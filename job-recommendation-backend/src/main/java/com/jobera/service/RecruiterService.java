package com.jobera.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.jobera.entity.Recruiter;
import com.jobera.entity.User;
import com.jobera.repository.RecruiterRepository;
import com.jobera.repository.UserRepository;

@Service
public class RecruiterService {
    
    private final RecruiterRepository recruiterRepository;
    private final UserRepository userRepository;
    
    public RecruiterService(RecruiterRepository recruiterRepository, UserRepository userRepository) {
        this.recruiterRepository = recruiterRepository;
        this.userRepository = userRepository;
    }

    public Recruiter registerRecruiter(Long userId, String companyName, String companyDescription, 
                                      String companyWebsite, String companySize, String industry,
                                      String contactEmail, String contactPhone) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            throw new RecruiterException("User not found with ID: " + userId);
        }
        
        if (recruiterRepository.existsByUserId(userId)) {
            throw new RecruiterException("User is already registered as a recruiter");
        }
        
        // Check if company name is already taken
        if (recruiterRepository.findByCompanyName(companyName).isPresent()) {
            throw new RecruiterException("Company name already exists: " + companyName);
        }
        
        Recruiter recruiter = new Recruiter();
        recruiter.setUser(user.get());
        recruiter.setCompanyName(companyName);
        recruiter.setCompanyDescription(companyDescription);
        recruiter.setCompanyWebsite(companyWebsite);
        recruiter.setCompanySize(companySize);
        recruiter.setIndustry(industry);
        recruiter.setContactEmail(contactEmail);
        recruiter.setContactPhone(contactPhone);
        
        // Update user role to recruiter - MAKE SURE THIS IS 3L
        User userEntity = user.get();
        userEntity.setRoleId(3L); // ROLE_RECRUITER
        userRepository.save(userEntity);
        
        return recruiterRepository.save(recruiter);
    }
    
    public Optional<Recruiter> getRecruiterByUserId(Long userId) {
        return recruiterRepository.findByUserId(userId);
    }
    
    public Recruiter updateRecruiterProfile(Long userId, String companyDescription, 
                                           String companyWebsite, String companySize, String industry,
                                           String contactEmail, String contactPhone) {
        Optional<Recruiter> recruiterOpt = recruiterRepository.findByUserId(userId);
        if (recruiterOpt.isEmpty()) {
            throw new RecruiterException("Recruiter not found for user ID: " + userId);
        }
        
        Recruiter recruiter = recruiterOpt.get();
        if (companyDescription != null) recruiter.setCompanyDescription(companyDescription);
        if (companyWebsite != null) recruiter.setCompanyWebsite(companyWebsite);
        if (companySize != null) recruiter.setCompanySize(companySize);
        if (industry != null) recruiter.setIndustry(industry);
        if (contactEmail != null) recruiter.setContactEmail(contactEmail);
        if (contactPhone != null) recruiter.setContactPhone(contactPhone);
        
        return recruiterRepository.save(recruiter);
    }
    
    public static class RecruiterException extends RuntimeException {
        public RecruiterException(String message) {
            super(message);
        }
    }
}