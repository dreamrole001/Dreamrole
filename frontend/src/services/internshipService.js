// frontend/src/services/internshipService.js
import api from './api';

export const internshipAPI = {
  // Get all internships (from job_postings where job_type = 'Internship')
  getAllInternships: () => api.get('/internships'),
  
  // Get recommended internships (same logic as jobs)
  getRecommendedInternships: (userId) => api.get(`/internships/recommendations/${userId}`),
  
  // Apply for internship - USES SAME LOGIC AS JOBS
  applyForInternship: (internshipId, userId, applicationData) => 
    api.post(`/internships/${internshipId}/apply/${userId}`, applicationData),
  
  // Rate internship - USES SAME LOGIC AS JOBS
  rateInternship: (internshipId, userId, ratingData) => 
    api.post(`/internships/${internshipId}/rate/${userId}`, ratingData),
  
  // Get user rating (same as jobs)
  getUserRating: (internshipId, userId) => 
    api.get(`/internships/${internshipId}/rating/user/${userId}`),
  
  // Get stats (same as jobs)
  getInternshipStats: () => api.get('/internships/stats')
};

export default internshipAPI;