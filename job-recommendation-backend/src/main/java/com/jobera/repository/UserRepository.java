// src/main/java/com/jobera/repository/UserRepository.java
package com.jobera.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.jobera.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find user by email (case-sensitive)
     * @param email the email address to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if a user exists with the given email (case-sensitive)
     * @param email the email address to check
     * @return true if a user with the email exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Find user by email (case-insensitive)
     * This is useful for external candidates where email case might vary
     * @param email the email address to search for (case-insensitive)
     * @return Optional containing the user if found
     */
    Optional<User> findByEmailIgnoreCase(String email);
    
    /**
     * Find user by phone number
     * @param phone the phone number to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByPhone(String phone);
    
    /**
     * Check if a user exists with the given phone number
     * @param phone the phone number to check
     * @return true if a user with the phone number exists, false otherwise
     */
    boolean existsByPhone(String phone);
    
    /**
     * Find all active users
     * @return List of active users
     */
    List<User> findByIsActiveTrue();
    
    /**
     * Find users by role ID
     * @param roleId the role ID (1=USER, 2=ADMIN, 3=RECRUITER)
     * @return List of users with the specified role
     */
    List<User> findByRoleId(Long roleId);
    
    /**
     * Count users by role ID
     * @param roleId the role ID
     * @return count of users with the specified role
     */
    long countByRoleId(Long roleId);
    
    /**
     * Search users by name or email (case-insensitive)
     * @param searchTerm the search term
     * @return List of matching users
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchUsers(@Param("searchTerm") String searchTerm);
    
    /**
     * Find users who registered after a specific date
     * @param date the cutoff date
     * @return List of users registered after the date
     */
    @Query("SELECT u FROM User u WHERE u.createdAt >= :date")
    List<User> findUsersRegisteredAfter(@Param("date") LocalDateTime date);
}