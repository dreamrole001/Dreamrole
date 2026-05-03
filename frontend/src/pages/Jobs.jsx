// src/pages/Jobs.jsx
import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Calendar, Star, TrendingUp, Clock, AlertCircle, Briefcase, Filter, X } from 'lucide-react';
import api from '../services/api';
import JobApplicationModal from '../components/JobApplicationModal';
import JobRatingModal from '../components/JobRatingModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Load user skills from localStorage on mount and when event is dispatched
  useEffect(() => {
    loadUserSkillsFromLocalStorage();
    fetchJobs();

    const handleSkillsUpdate = (event) => {
      console.log('🎯 Skills updated event received in Jobs page:', event.detail);
      if (event.detail && event.detail.skills) {
        setUserSkills(event.detail.skills);
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('userSkillsUpdated', handleSkillsUpdate);
    
    return () => {
      window.removeEventListener('userSkillsUpdated', handleSkillsUpdate);
    };
  }, []);

  // Re-fetch jobs when refreshKey changes (skills updated)
  useEffect(() => {
    if (refreshKey > 0) {
      fetchJobs();
    }
  }, [refreshKey]);

  const loadUserSkillsFromLocalStorage = () => {
    try {
      const storedSkills = localStorage.getItem('userSkills');
      if (storedSkills) {
        const skills = JSON.parse(storedSkills);
        setUserSkills(skills);
        setDebugInfo(`Loaded ${skills.length} skills: ${skills.slice(0, 5).join(', ')}${skills.length > 5 ? '...' : ''}`);
      } else {
        setUserSkills([]);
        setDebugInfo('No skills found. Please upload a resume first.');
      }
    } catch (error) {
      console.error('Error loading skills:', error);
      setUserSkills([]);
      setDebugInfo('Error loading skills. Please re-upload your resume.');
    }
  };

  useEffect(() => {
    let filtered = showRecommended && recommendedJobs.length > 0 ? recommendedJobs : jobs;
    
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    if (selectedJobType) {
      filtered = filtered.filter(job =>
        job.jobType?.toLowerCase() === selectedJobType.toLowerCase()
      );
    }
    
    filtered = sortJobs(filtered, sortBy);
    setFilteredJobs(filtered);
  }, [searchTerm, jobs, recommendedJobs, showRecommended, sortBy, selectedLocation, selectedJobType]);

  const parseSkillsFromJson = (skillsJson) => {
    try {
      if (!skillsJson) return [];
      if (typeof skillsJson === 'string') {
        let cleaned = skillsJson.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1);
        }
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
          return JSON.parse(cleaned);
        }
        if (cleaned.includes(',')) {
          return cleaned.split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);
        }
        return [cleaned];
      }
      if (Array.isArray(skillsJson)) {
        return skillsJson;
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const isSkillMatch = (jobSkill, userSkill) => {
    const js = jobSkill.toLowerCase().trim();
    const us = userSkill.toLowerCase().trim();
    
    if (js === us) return true;
    if (us.includes(js) || js.includes(us)) return true;
    
    const variations = {
      'javascript': ['js', 'javascript', 'ecmascript'],
      'node.js': ['node', 'nodejs', 'node.js'],
      'spring boot': ['springboot', 'spring', 'spring-boot'],
      'react': ['react', 'reactjs', 'react.js'],
      'python': ['python', 'py', 'python3'],
      'java': ['java', 'java8', 'java11', 'java17'],
      'html': ['html', 'html5'],
      'css': ['css', 'css3'],
      'rest api': ['rest', 'restapi', 'restful', 'rest api'],
      'mongodb': ['mongo', 'mongodb'],
      'postgresql': ['postgres', 'postgresql'],
      'mysql': ['mysql', 'my sql'],
      'typescript': ['ts', 'typescript'],
      'docker': ['docker', 'docker container'],
      'kubernetes': ['k8s', 'kubernetes'],
      'aws': ['aws', 'amazon web services'],
      'azure': ['azure', 'microsoft azure'],
      'git': ['git', 'github', 'gitlab'],
      'machine learning': ['ml', 'machine learning'],
      'data science': ['data science', 'ds']
    };
    
    for (const [standard, variants] of Object.entries(variations)) {
      if ((variants.includes(js) && variants.includes(us)) ||
          (js === standard && variants.includes(us)) ||
          (us === standard && variants.includes(js))) {
        return true;
      }
    }
    
    return false;
  };

  // FIXED: Only return matchScore >= 50%
  const analyzeJobMatch = (job, userSkillsList) => {
    if (!userSkillsList || userSkillsList.length === 0) {
      return { matchScore: 0, matchedSkills: [], missingSkills: [] };
    }
    
    try {
      const requiredSkills = parseSkillsFromJson(job.requiredSkills);
      
      if (requiredSkills.length === 0) {
        return { matchScore: 0, matchedSkills: [], missingSkills: [] };
      }
      
      const matchedSkills = [];
      const missingSkills = [];
      
      for (const jobSkill of requiredSkills) {
        let matched = false;
        for (const userSkill of userSkillsList) {
          if (isSkillMatch(jobSkill, userSkill)) {
            matched = true;
            matchedSkills.push(jobSkill);
            break;
          }
        }
        if (!matched) {
          missingSkills.push(jobSkill);
        }
      }
      
      const matchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);
      
      // CRITICAL FIX: Only return matchScore if >= 50%, otherwise return 0
      if (matchScore < 50) {
        return { matchScore: 0, matchedSkills: [], missingSkills: [] };
      }
      
      return { matchScore, matchedSkills, missingSkills };
    } catch (error) {
      console.error('Error analyzing job match:', error);
      return { matchScore: 0, matchedSkills: [], missingSkills: [] };
    }
  };

  // FIXED: Only include jobs with matchScore > 0 in recommendations
  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const storedSkills = localStorage.getItem('userSkills');
      let latestUserSkills = [];
      if (storedSkills) {
        latestUserSkills = JSON.parse(storedSkills);
        setUserSkills(latestUserSkills);
      }
      
      const response = await api.get('/jobs');
      
      if (response.data && response.data.length > 0) {
        // Filter out internships
        const onlyJobs = response.data.filter(job => 
          job.jobType !== 'Internship' && 
          job.job_type !== 'Internship' &&
          job.jobType?.toLowerCase() !== 'internship'
        );
        
        const jobsWithScores = onlyJobs.map(job => {
          const analysis = analyzeJobMatch(job, latestUserSkills);
          return {
            ...job,
            matchScore: analysis.matchScore,
            matchedSkills: analysis.matchedSkills,
            missingSkills: analysis.missingSkills,
            requiredSkillsParsed: parseSkillsFromJson(job.requiredSkills),
            preferredSkillsParsed: parseSkillsFromJson(job.preferredSkills)
          };
        });
        
        setJobs(jobsWithScores);
        
        // CRITICAL FIX: Only include jobs with matchScore > 0 in recommendations
        const recommendations = jobsWithScores
          .filter(job => job.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore);
        
        setRecommendedJobs(recommendations);
        
        const matchingJobsCount = recommendations.length;
        setDebugInfo(`Found ${matchingJobsCount} recommended jobs out of ${jobsWithScores.length} total jobs`);
        
        setFilteredJobs(sortJobs(jobsWithScores, sortBy));
      } else {
        setJobs([]);
        setFilteredJobs([]);
        setError('No jobs found.');
        setDebugInfo('No jobs available in the database.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs.');
      setDebugInfo('Failed to fetch jobs from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRatings = async () => {
    if (!currentUser) return;
    
    try {
      const ratings = {};
      const jobsToCheck = showRecommended && recommendedJobs.length > 0 ? recommendedJobs : jobs;
      
      for (const job of jobsToCheck) {
        try {
          const response = await api.get(`/jobs/${job.id}/rating/user/${currentUser.id}`);
          if (response.data.hasRated) {
            ratings[job.id] = response.data;
          }
        } catch (error) {
          console.error(`Error fetching rating for job ${job.id}:`, error);
        }
      }
      setUserRatings(ratings);
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  };

  const sortJobs = (jobsList, sortType) => {
    const jobsCopy = [...jobsList];
    switch (sortType) {
      case 'date':
        return jobsCopy.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      case 'rating':
        return jobsCopy.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'relevance':
        return jobsCopy.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      default:
        return jobsCopy;
    }
  };

  const applyForJob = (job) => {
    setSelectedJobForApplication(job);
    setShowApplicationModal(true);
  };

  const rateJob = (job) => {
    setSelectedJob(job);
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    fetchJobs();
    fetchUserRatings();
    setShowRatingModal(false);
  };

  const handleApplicationSuccess = () => {
    alert('Application submitted successfully!');
    setShowApplicationModal(false);
    setSelectedJobForApplication(null);
    fetchJobs();
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const isRecentJob = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const renderStars = (rating, size = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star key={i} className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'} ${i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      );
    }
    return stars;
  };

  const clearFilters = () => {
    setSelectedLocation('');
    setSelectedJobType('');
    setSearchTerm('');
  };

  const getUniqueLocations = () => {
    const locations = new Set();
    jobs.forEach(job => {
      if (job.location) locations.add(job.location);
    });
    return Array.from(locations);
  };

  const getUniqueJobTypes = () => {
    const types = new Set();
    jobs.forEach(job => {
      if (job.jobType) types.add(job.jobType);
    });
    return Array.from(types);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {showRecommended && recommendedJobs.length > 0 ? '🎯 Recommended Jobs For You' : '📋 All Jobs'}
        </h1>
        <p className="text-gray-600">
          {showRecommended && recommendedJobs.length > 0 
            ? `Based on your ${userSkills.length} skills: ${userSkills.slice(0, 8).join(', ')}${userSkills.length > 8 ? '...' : ''}`
            : `Discover ${filteredJobs.length} job opportunities`}
        </p>
        
        {debugInfo && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            ℹ️ {debugInfo}
          </div>
        )}
        
        {userSkills.length === 0 && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            ⚠️ No skills found. Please upload your resume to get personalized job recommendations.
          </div>
        )}
        
        {userSkills.length > 0 && recommendedJobs.length === 0 && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            ℹ️ Your skills ({userSkills.length} skills: {userSkills.slice(0, 5).join(', ')})
            don't match any job requirements ({jobs.length} jobs available). 
            <br/>Try uploading a resume with different skills or check back later for new opportunities.
          </div>
        )}
      </div>

      {recommendedJobs.length > 0 && (
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShowRecommended(false)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              !showRecommended 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setShowRecommended(true)}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center transition-all ${
              showRecommended 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Recommended for You ({recommendedJobs.length})
          </button>
        </div>
      )}

      {showRecommended && userSkills.length > 0 && recommendedJobs.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            No Matching Jobs Found
          </h3>
          <p className="text-sm text-yellow-700">
            Your skills ({userSkills.slice(0, 5).join(', ')}{userSkills.length > 5 ? '...' : ''}) don't match any available jobs.
            Try uploading a resume with different skills or check back later.
          </p>
        </div>
      )}

      {showRecommended && userSkills.length > 0 && recommendedJobs.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            Your Skills (from uploaded resume):
          </h3>
          <div className="flex flex-wrap gap-2">
            {userSkills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Upload a new resume to update your skills and get better job matches!
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or keyword..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(selectedLocation || selectedJobType) && (
                <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="relevance">Sort by Relevance (Match %)</option>
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Locations</option>
                  {getUniqueLocations().map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Types</option>
                  {getUniqueJobTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-red-600 hover:text-red-800 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">No jobs found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-2">
                      <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                      {job.matchScore > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getMatchColor(job.matchScore)}`}>
                          {job.matchScore}% Match
                        </span>
                      )}
                      {isRecentJob(job.postedDate) && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-gray-600 mb-2">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  {job.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {job.location}
                    </div>
                  )}
                  {job.salaryRange && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {job.salaryRange}
                    </div>
                  )}
                  {job.jobType && (
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                      {job.jobType}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(job.postedDate)}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(job.averageRating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      ({job.totalRatings || 0} {job.totalRatings === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                  {currentUser && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); rateJob(job); }} 
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      {userRatings[job.id] ? 'Update Rating' : 'Rate Job'}
                    </button>
                  )}
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">
                  {job.description?.substring(0, 200)}...
                </p>

                {job.matchedSkills && job.matchedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-green-600 font-semibold mb-2">✓ Your Matched Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.matchedSkills.map((skill, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {job.missingSkills && job.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-yellow-600 font-semibold mb-2">💡 Skills to Learn:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.missingSkills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {job.missingSkills.length > 5 && (
                        <span className="text-gray-500 text-xs">+{job.missingSkills.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkillsParsed?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkillsParsed?.length > 3 && (
                      <span className="text-gray-500 text-xs">+{job.requiredSkillsParsed.length - 3} more</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); rateJob(job); }} 
                      className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Rate
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); applyForJob(job); }} 
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedJob && (
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-xl text-gray-600 mb-4">{selectedJob.company}</p>
            
            {selectedJob.matchScore > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">Match Score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMatchColor(selectedJob.matchScore)}`}>
                    {selectedJob.matchScore}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      selectedJob.matchScore >= 80 ? 'bg-green-500' :
                      selectedJob.matchScore >= 60 ? 'bg-blue-500' :
                      selectedJob.matchScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${selectedJob.matchScore}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-yellow-800">Job Rating</span>
                <div className="flex items-center space-x-1">
                  {renderStars(selectedJob.averageRating, 'md')}
                  <span className="text-sm ml-2 text-gray-600">
                    ({selectedJob.totalRatings || 0} {selectedJob.totalRatings === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowRatingModal(true)} 
                className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
              >
                <Star className="h-4 w-4 mr-2" />
                {userRatings[selectedJob.id] ? 'Update Your Rating' : 'Rate This Job'}
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {selectedJob.location && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{selectedJob.location}</span>
                </div>
              )}
              {selectedJob.salaryRange && (
                <div className="flex items-center text-gray-700">
                  <DollarSign className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{selectedJob.salaryRange}</span>
                </div>
              )}
              {selectedJob.jobType && (
                <div className="flex items-center text-gray-700">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{selectedJob.jobType} • {selectedJob.experienceLevel || 'Not specified'}</span>
                </div>
              )}
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <span>Posted: {formatDate(selectedJob.postedDate)}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.requiredSkillsParsed?.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {selectedJob.matchedSkills && selectedJob.matchedSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2 text-green-500" />
                  Your Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.matchedSkills.map((skill, idx) => (
                    <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedJob.missingSkills && selectedJob.missingSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-yellow-700 mb-3">Skills to Improve</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.missingSkills.map((skill, idx) => (
                    <span key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Consider learning these skills to increase your chances!
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                {selectedJob.description}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
              <button 
                onClick={() => applyForJob(selectedJob)} 
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Apply Now
              </button>
            </div>
          </div>
        )}
      </div>

      {showApplicationModal && selectedJobForApplication && (
        <JobApplicationModal 
          job={selectedJobForApplication} 
          onClose={() => { setShowApplicationModal(false); setSelectedJobForApplication(null); }} 
          onSuccess={handleApplicationSuccess}
        />
      )}

      {showRatingModal && selectedJob && (
        <JobRatingModal 
          job={selectedJob} 
          userRating={userRatings[selectedJob.id]} 
          onClose={() => setShowRatingModal(false)} 
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
};

export default Jobs;