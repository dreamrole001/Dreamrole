import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Job Rating API calls
export const jobRatingAPI = {
  // Rate a job
  rateJob: (jobId, userId, ratingData) =>
    api.post(`/jobs/${jobId}/rate/${userId}`, ratingData),

  // Get job ratings
  getJobRatings: (jobId) =>
    api.get(`/jobs/${jobId}/ratings`),

  // Get user's rating for a job
  getUserRating: (jobId, userId) =>
    api.get(`/jobs/${jobId}/rating/user/${userId}`),

  // Get job rating stats
  getJobRatingStats: (jobId) =>
    api.get(`/jobs/${jobId}/rating/stats`),

  // Delete rating
  deleteRating: (ratingId) =>
    api.delete(`/jobs/ratings/${ratingId}`),
};

// Resume Matching API calls
export const resumeMatchingAPI = {
  // Get applications sorted by match percentage
  getApplicationsSortedByMatch: (jobId, recruiterId) =>
    api.get(`/resume-matching/job/${jobId}/applications/sorted?recruiterId=${recruiterId}`),

  // Get detailed resume analysis for an application
  getResumeAnalysis: (applicationId) =>
    api.get(`/resume-matching/application/${applicationId}/resume-analysis`),

  // Get applications with resume data
  getApplicationsWithResume: (jobId, recruiterId) =>
    api.get(`/resume-matching/job/${jobId}/applications?recruiterId=${recruiterId}`),

  // Recalculate match percentages for a job
  recalculateMatches: (jobId) =>
    api.post(`/resume-matching/job/${jobId}/recalculate`),
};

// Enhanced Job Application API calls
export const jobApplicationAPI = {
  // Apply for job with resume
  applyWithResume: (jobId, userId, applicationData) =>
    api.post(`/jobs/${jobId}/apply-with-resume/${userId}`, applicationData),

  // Simple apply (backward compatibility)
  simpleApply: (jobId, userId, applicationData) =>
    api.post(`/jobs/${jobId}/simple-apply/${userId}`, applicationData),

  // Debug apply endpoint
  debugApply: (jobId, userId, applicationData) =>
    api.post(`/jobs/${jobId}/debug-apply/${userId}`, applicationData),

  // Test apply endpoint
  testApply: (jobId, userId) =>
    api.post(`/jobs/${jobId}/test-apply/${userId}`),
};

// Enhanced Resume API calls
export const resumeAPI = {
  // Upload resume
  uploadResume: (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/resumes/upload/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get user resumes
  getUserResumes: (userId) =>
    api.get(`/resumes/user/${userId}`),

  // Get resume analysis
  getResumeAnalysis: (resumeId) =>
    api.get(`/resumes/${resumeId}/analysis`),

  // Get latest resume
  getLatestResume: (userId) =>
    api.get(`/resumes/user/${userId}/latest`),

  // Extract skills from text
  extractSkills: (text) =>
    api.post('/resumes/extract-skills', { text }),
};

// Enhanced Application Status API calls
export const applicationStatusAPI = {
  // Get user applications
  getUserApplications: (userId) =>
    api.get(`/applications/user/${userId}`),

  // Get job applications
  getJobApplications: (jobId) =>
    api.get(`/applications/job/${jobId}`),

  // Update application status
  updateStatus: (applicationId, recruiterId, statusData) =>
    api.put(`/applications/${applicationId}/status?recruiterId=${recruiterId}`, statusData),

  // Mark as viewed
  markAsViewed: (applicationId, recruiterId) =>
    api.put(`/applications/${applicationId}/view?recruiterId=${recruiterId}`),

  // Shortlist application
  shortlist: (applicationId, recruiterId, notes) =>
    api.put(`/applications/${applicationId}/shortlist?recruiterId=${recruiterId}`, { notes }),

  // Schedule interview
  scheduleInterview: (applicationId, recruiterId, interviewData) =>
    api.put(`/applications/${applicationId}/schedule-interview?recruiterId=${recruiterId}`, interviewData),

  // Reject application
  reject: (applicationId, recruiterId, rejectionReason) =>
    api.put(`/applications/${applicationId}/reject?recruiterId=${recruiterId}`, { rejectionReason }),

  // Send offer
  sendOffer: (applicationId, recruiterId, offerDetails) =>
    api.put(`/applications/${applicationId}/send-offer?recruiterId=${recruiterId}`, { offerDetails }),
};

// Enhanced Job Management API calls
export const jobManagementAPI = {
  // Create job posting
  createJob: (recruiterId, jobData) =>
    api.post('/recruiters/jobs', { ...jobData, recruiterId }),

  // Update job posting
  updateJob: (jobId, recruiterId, jobData) =>
    api.put(`/recruiters/jobs/${jobId}`, { ...jobData, recruiterId }),

  // Delete job posting
  deleteJob: (jobId, recruiterId) =>
    api.delete(`/recruiters/jobs/${jobId}?recruiterId=${recruiterId}`),

  // Get recruiter jobs
  getRecruiterJobs: (recruiterId) =>
    api.get(`/recruiters/jobs/recruiter/${recruiterId}`),

  // Get job applications (recruiter)
  getJobApplications: (jobId, recruiterId) =>
    api.get(`/recruiters/jobs/${jobId}/applications?recruiterId=${recruiterId}`),

  // Get job applications (debug - no recruiter verification)
  getJobApplicationsDebug: (jobId) =>
    api.get(`/recruiters/jobs/${jobId}/applications/debug`),
};

// Job Recommendation API calls
export const jobRecommendationAPI = {
  // Get job recommendations for user
  getRecommendations: (userId) =>
    api.get(`/jobs/recommendations/${userId}`),

  // Get detailed recommendations
  getDetailedRecommendations: (userId) =>
    api.get(`/jobs/recommendations/${userId}/detailed`),

  // Get recommendations by skills
  getRecommendationsBySkills: (skills) =>
    api.get('/jobs/recommendations/skills', { params: { skills } }),

  // Search jobs
  searchJobs: (keyword) =>
    api.get('/jobs/search', { params: { keyword } }),
};

// Authentication API calls
export const authAPI = {
  // Register user
  register: (userData) =>
    api.post('/auth/register', userData),

  // Login user
  login: (credentials) =>
    api.post('/auth/login', credentials),

  // Debug login
  debugLogin: (credentials) =>
    api.post('/auth/debug-login', credentials),

  // Logout user
  logout: () =>
    api.post('/auth/logout'),

  // Get current user
  getCurrentUser: () =>
    api.get('/auth/me'),

  // Register recruiter
  registerRecruiter: (recruiterData) =>
    api.post('/recruiters/register', recruiterData),

  // Get recruiter profile
  getRecruiterProfile: (userId) =>
    api.get(`/recruiters/user/${userId}`),

  // Update recruiter profile
  updateRecruiterProfile: (userId, profileData) =>
    api.put(`/recruiters/user/${userId}/profile`, profileData),
};

// Utility API calls
export const utilityAPI = {
  // Health check
  healthCheck: () =>
    api.get('/health'),

  // Test endpoint
  test: () =>
    api.get('/test'),

  // Debug all applications
  debugAllApplications: () =>
    api.get('/jobs/debug/applications'),

  // Debug job applications
  debugJobApplications: (jobId) =>
    api.get(`/jobs/${jobId}/applications/debug`),
};

// Default export for backward compatibility
export default api;

// Convenience function for applying to jobs with resume
export const applyForJobWithResume = (jobId, userId, applicationData) => {
  return jobApplicationAPI.applyWithResume(jobId, userId, applicationData);
};

// Convenience function for getting sorted applications
export const getSortedApplications = (jobId, recruiterId) => {
  return resumeMatchingAPI.getApplicationsSortedByMatch(jobId, recruiterId);
};

// Convenience function for uploading resume and applying
export const uploadResumeAndApply = async (userId, jobId, file, applicationData) => {
  try {
    // First upload the resume
    const uploadResponse = await resumeAPI.uploadResume(userId, file);
    
    // Then apply with the resume data
    const applicationResponse = await jobApplicationAPI.applyWithResume(jobId, userId, {
      ...applicationData,
      resumeFilePath: uploadResponse.data.filePath,
      resumeParsedText: uploadResponse.data.parsedText || 'Resume content extracted'
    });
    
    return applicationResponse;
  } catch (error) {
    throw error;
  }
};