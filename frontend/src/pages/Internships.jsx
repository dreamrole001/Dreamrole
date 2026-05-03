// src/pages/Internships.jsx
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Star, TrendingUp, Clock, Briefcase, Award, Loader, X, AlertCircle, Filter, DollarSign } from 'lucide-react';
import api from '../services/api';
import JobApplicationModal from '../components/JobApplicationModal';
import InternshipEligibilityCheck from '../components/InternshipEligibilityCheck';

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [recommendedInternships, setRecommendedInternships] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedInternshipForApplication, setSelectedInternshipForApplication] = useState(null);
  const [showEligibilityCheck, setShowEligibilityCheck] = useState(false);
  const [selectedInternshipForEligibility, setSelectedInternshipForEligibility] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [stats, setStats] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Load user skills from localStorage on mount and when event is dispatched
  useEffect(() => {
    loadUserSkillsFromLocalStorage();
    fetchInternships();
    fetchStats();

    const handleSkillsUpdate = (event) => {
      console.log('🎯 Skills updated event received in Internships page:', event.detail);
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

  // Re-fetch internships when refreshKey changes (skills updated)
  useEffect(() => {
    if (refreshKey > 0) {
      fetchInternships();
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
    let filtered = showRecommended && recommendedInternships.length > 0 ? recommendedInternships : internships;
    
    if (searchTerm) {
      filtered = filtered.filter(internship =>
        internship.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(internship =>
        internship.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    
    if (selectedDuration) {
      filtered = filtered.filter(internship =>
        internship.duration?.toString().includes(selectedDuration)
      );
    }
    
    filtered = sortInternships(filtered, sortBy);
    setFilteredInternships(filtered);
  }, [searchTerm, internships, recommendedInternships, showRecommended, sortBy, selectedLocation, selectedDuration]);

  const parseSkillsFromJson = (skillsJson) => {
    try {
      if (!skillsJson) return [];
      if (typeof skillsJson === 'string') {
        if (skillsJson.startsWith('[') && skillsJson.endsWith(']')) {
          return JSON.parse(skillsJson);
        }
        return skillsJson.split(',').map(s => s.trim()).filter(s => s);
      }
      if (Array.isArray(skillsJson)) {
        return skillsJson;
      }
      return [];
    } catch (e) {
      console.warn('Failed to parse skills JSON:', skillsJson);
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
      'mongodb': ['mongo', 'mongodb']
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
  const analyzeInternshipMatch = (internship, skills) => {
    if (!skills || skills.length === 0) {
      return { matchScore: 0, matchedSkills: [], missingSkills: [], requiredSkills: [] };
    }
    
    try {
      let requiredSkills = [];
      
      if (internship.requiredSkills) {
        requiredSkills = parseSkillsFromJson(internship.requiredSkills);
      }
      
      if (requiredSkills.length === 0) {
        return { matchScore: 0, matchedSkills: [], missingSkills: [], requiredSkills: [] };
      }
      
      const userSkillsLower = skills.map(s => s.toLowerCase());
      const matchedSkills = [];
      const missingSkills = [];
      
      for (const jobSkill of requiredSkills) {
        const jobSkillLower = jobSkill.toLowerCase();
        let matched = false;
        
        for (const userSkill of userSkillsLower) {
          if (isSkillMatch(jobSkill, userSkill)) {
            matched = true;
            break;
          }
        }
        
        if (matched) {
          matchedSkills.push(jobSkill);
        } else {
          missingSkills.push(jobSkill);
        }
      }
      
      const matchScore = requiredSkills.length > 0 
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 0;
      
      // CRITICAL FIX: Only return matchScore if >= 50%, otherwise return 0
      if (matchScore < 50) {
        return { matchScore: 0, matchedSkills: [], missingSkills: [], requiredSkills: [] };
      }
      
      return { matchScore, matchedSkills, missingSkills, requiredSkills };
    } catch (error) {
      console.error('Error analyzing internship match:', error);
      return { matchScore: 0, matchedSkills: [], missingSkills: [], requiredSkills: [] };
    }
  };

  // FIXED: Only include internships with matchScore > 0 in recommendations
  const fetchInternships = async () => {
    try {
      setIsLoading(true);
      
      const storedSkills = localStorage.getItem('userSkills');
      let latestUserSkills = [];
      if (storedSkills) {
        latestUserSkills = JSON.parse(storedSkills);
        setUserSkills(latestUserSkills);
      }
      
      const response = await api.get('/internships');
      
      if (response.data && response.data.length > 0) {
        const internshipsWithMatches = response.data.map(internship => {
          const analysis = analyzeInternshipMatch(internship, latestUserSkills);
          return {
            ...internship,
            matchScore: analysis.matchScore,
            matchedSkills: analysis.matchedSkills,
            missingSkills: analysis.missingSkills,
            requiredSkillsArray: analysis.requiredSkills
          };
        });
        
        setInternships(internshipsWithMatches);
        
        // CRITICAL FIX: Only include internships with matchScore > 0 in recommendations
        const recommendations = internshipsWithMatches
          .filter(internship => internship.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore);
        
        setRecommendedInternships(recommendations);
        
        const matchingCount = recommendations.length;
        setDebugInfo(`Found ${matchingCount} recommended internships out of ${internshipsWithMatches.length} total internships`);
        
        setFilteredInternships(sortInternships(internshipsWithMatches, sortBy));
      } else {
        setInternships([]);
        setFilteredInternships([]);
        setError('No internships found.');
        setDebugInfo('No internships available in the database.');
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      setError('Failed to load internships');
      setDebugInfo('Failed to fetch internships from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/internships/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserRatings = async () => {
    if (!currentUser) return;
    try {
      const ratings = {};
      const internshipsToCheck = showRecommended && recommendedInternships.length > 0 ? recommendedInternships : internships;
      for (const internship of internshipsToCheck) {
        try {
          const response = await api.get(`/internships/${internship.id}/rating/user/${currentUser.id}`);
          if (response.data.hasRated) {
            ratings[internship.id] = response.data;
          }
        } catch (error) {
          console.error(`Error fetching rating for internship ${internship.id}:`, error);
        }
      }
      setUserRatings(ratings);
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  };

  const sortInternships = (list, type) => {
    const copy = [...list];
    switch (type) {
      case 'date':
        return copy.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      case 'stipend':
        return copy.sort((a, b) => (b.stipend || 0) - (a.stipend || 0));
      case 'duration':
        return copy.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      case 'relevance':
        return copy.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      default:
        return copy;
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedInternship) return;
    if (ratingValue === 0) {
      alert('Please select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/internships/${selectedInternship.id}/rate/${currentUser.id}`, {
        rating: ratingValue,
        comment: ratingComment
      });
      alert('Rating submitted successfully!');
      setShowRatingModal(false);
      setSelectedInternship(null);
      fetchInternships();
      fetchUserRatings();
    } catch (error) {
      console.error('Error rating:', error);
      alert(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
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

  const formatStipend = (stipend) => {
    if (!stipend) return 'Not specified';
    if (typeof stipend === 'number') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stipend);
    }
    return stipend;
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
    setSelectedDuration('');
    setSearchTerm('');
  };

  const getUniqueLocations = () => {
    const locations = new Set();
    internships.forEach(internship => {
      if (internship.location) locations.add(internship.location);
    });
    return Array.from(locations);
  };

  const getUniqueDurations = () => {
    const durations = new Set();
    internships.forEach(internship => {
      if (internship.duration) durations.add(internship.duration.toString());
    });
    return Array.from(durations).sort((a, b) => parseInt(a) - parseInt(b));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading internships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {showRecommended && recommendedInternships.length > 0 ? '🎯 Recommended Internships For You' : '📋 All Internships'}
        </h1>
        <p className="text-gray-600">
          {showRecommended && recommendedInternships.length > 0 
            ? `Based on your ${userSkills.length} skills: ${userSkills.slice(0, 5).join(', ')}${userSkills.length > 5 ? '...' : ''}`
            : `Discover ${filteredInternships.length} internship opportunities`}
        </p>
        
        {debugInfo && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            ℹ️ {debugInfo}
          </div>
        )}
        
        {userSkills.length === 0 && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            ⚠️ No skills found. Please upload your resume to get personalized internship recommendations.
          </div>
        )}
        
        {userSkills.length > 0 && recommendedInternships.length === 0 && (
          <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            ℹ️ Your skills ({userSkills.length} skills: {userSkills.slice(0, 5).join(', ')})
            don't match any internship requirements. 
            <br/>Try uploading a resume with different skills or check back later for new opportunities.
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalInternships || 0}</div>
            <div className="text-sm text-gray-500">Total Internships</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeInternships || 0}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatStipend(stats.averageStipend)}</div>
            <div className="text-sm text-gray-500">Avg Stipend</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalApplications || 0}</div>
            <div className="text-sm text-gray-500">Applications</div>
          </div>
        </div>
      )}

      {/* Internship Eligibility Criteria Section */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Award className="h-6 w-6 mr-2 text-green-600" />
          Internship Eligibility Criteria
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-green-700 mb-3 flex items-center">
              <Star className="h-4 w-4 mr-1 text-green-500" />
              Eligible Candidates:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Age between <strong>21 and 24 years</strong>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                High School, Higher Secondary, ITI, Diploma, or Bachelor's Degree
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Not employed full-time
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Not engaged in full-time education (online/distance learning allowed)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Family annual income less than ₹8,00,000
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                No family member as permanent government employee
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-red-700 mb-3 flex items-center">
              <X className="h-4 w-4 mr-1 text-red-500" />
              Not Eligible:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                IITs, IIMs, National Law Universities graduates
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                CA, CMA, CS, MBBS, BDS, MBA, Master's, PhD
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                Completed any apprenticeship/internship under government schemes
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                Currently employed full-time
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                Enrolled in full-time regular education
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic">
            Note: This internship follows the Government of India's internship scheme guidelines. Please ensure you meet all eligibility criteria before applying.
          </p>
        </div>
      </div>

      {recommendedInternships.length > 0 && (
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShowRecommended(false)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              !showRecommended 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Internships ({internships.length})
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
            Recommended for You ({recommendedInternships.length})
          </button>
        </div>
      )}

      {showRecommended && userSkills.length > 0 && recommendedInternships.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            No Matching Internships Found
          </h3>
          <p className="text-sm text-yellow-700">
            Your skills ({userSkills.slice(0, 5).join(', ')}{userSkills.length > 5 ? '...' : ''}) don't match any available internships.
            Try uploading a resume with different skills or check back later.
          </p>
        </div>
      )}

      {showRecommended && userSkills.length > 0 && recommendedInternships.length > 0 && (
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
            Upload a new resume to update your skills and get better internship matches!
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search internships by title, company, or keyword..."
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
              {(selectedLocation || selectedDuration) && (
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
              <option value="stipend">Sort by Stipend</option>
              <option value="duration">Sort by Duration</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Any Duration</option>
                  {getUniqueDurations().map(duration => (
                    <option key={duration} value={duration}>{duration} months</option>
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
          {filteredInternships.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">No internships found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredInternships.map((internship) => (
              <div 
                key={internship.id} 
                className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                onClick={() => setSelectedInternship(internship)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-2">
                      <h3 className="text-xl font-semibold text-gray-800">{internship.title}</h3>
                      {internship.matchScore > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getMatchColor(internship.matchScore)}`}>
                          {internship.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-gray-600 mb-2">{internship.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  {internship.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {internship.location}
                    </div>
                  )}
                  {internship.duration && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {internship.duration} months
                    </div>
                  )}
                  {internship.stipend && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {formatStipend(internship.stipend)}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    Posted: {formatDate(internship.postedDate)}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(internship.averageRating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      ({internship.totalRatings || 0} {internship.totalRatings === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                  {currentUser && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedInternship(internship); setRatingValue(userRatings[internship.id]?.rating || 0); setRatingComment(userRatings[internship.id]?.comment || ''); setShowRatingModal(true); }} 
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      {userRatings[internship.id] ? 'Update Rating' : 'Rate Internship'}
                    </button>
                  )}
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">
                  {internship.description?.substring(0, 150)}...
                </p>

                {internship.matchedSkills && internship.matchedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-green-600 font-semibold mb-2">✓ Your Matched Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {internship.matchedSkills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {internship.missingSkills && internship.missingSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-yellow-600 font-semibold mb-2">💡 Skills to Learn:</p>
                    <div className="flex flex-wrap gap-2">
                      {internship.missingSkills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {internship.requiredSkillsArray?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                    {internship.requiredSkillsArray?.length > 3 && (
                      <span className="text-gray-500 text-xs">+{internship.requiredSkillsArray.length - 3} more</span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedInternshipForEligibility(internship); 
                      setShowEligibilityCheck(true); 
                    }} 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedInternship && (
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedInternship.title}</h2>
              <button 
                onClick={() => setSelectedInternship(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-xl text-gray-600 mb-4">{selectedInternship.company}</p>
            
            {selectedInternship.matchScore > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">Match Score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMatchColor(selectedInternship.matchScore)}`}>
                    {selectedInternship.matchScore}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      selectedInternship.matchScore >= 80 ? 'bg-green-500' :
                      selectedInternship.matchScore >= 60 ? 'bg-blue-500' :
                      selectedInternship.matchScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${selectedInternship.matchScore}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-yellow-800">Internship Rating</span>
                <div className="flex items-center space-x-1">
                  {renderStars(selectedInternship.averageRating, 'md')}
                  <span className="text-sm ml-2 text-gray-600">
                    ({selectedInternship.totalRatings || 0} {selectedInternship.totalRatings === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setRatingValue(userRatings[selectedInternship.id]?.rating || 0); setRatingComment(userRatings[selectedInternship.id]?.comment || ''); setShowRatingModal(true); }} 
                className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
              >
                <Star className="h-4 w-4 mr-2" />
                {userRatings[selectedInternship.id] ? 'Update Your Rating' : 'Rate This Internship'}
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {selectedInternship.location && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{selectedInternship.location}</span>
                </div>
              )}
              {selectedInternship.duration && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{selectedInternship.duration} months</span>
                </div>
              )}
              {selectedInternship.stipend && (
                <div className="flex items-center text-gray-700">
                  <Award className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{formatStipend(selectedInternship.stipend)}</span>
                </div>
              )}
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-3 text-gray-400" />
                <span>Posted: {formatDate(selectedInternship.postedDate)}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedInternship.requiredSkillsArray?.map((skill, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {selectedInternship.matchedSkills && selectedInternship.matchedSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2 text-green-500" />
                  Your Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInternship.matchedSkills.map((skill, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedInternship.missingSkills && selectedInternship.missingSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-yellow-700 mb-3">Skills to Improve</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInternship.missingSkills.map((skill, i) => (
                    <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
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
              <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                {selectedInternship.description}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
              <button 
                onClick={() => { 
                  setSelectedInternshipForEligibility(selectedInternship); 
                  setShowEligibilityCheck(true); 
                }} 
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Apply Now
              </button>
            </div>
          </div>
        )}
      </div>

      {showApplicationModal && selectedInternshipForApplication && (
        <JobApplicationModal 
          job={selectedInternshipForApplication} 
          onClose={() => { setShowApplicationModal(false); setSelectedInternshipForApplication(null); }} 
          onSuccess={() => { setShowApplicationModal(false); setSelectedInternshipForApplication(null); alert('Application submitted!'); fetchInternships(); }} 
        />
      )}

      {/* Eligibility Check Modal */}
      {showEligibilityCheck && selectedInternshipForEligibility && (
        <InternshipEligibilityCheck
          internship={selectedInternshipForEligibility}
          onEligibilityPassed={() => {
            setShowEligibilityCheck(false);
            setSelectedInternshipForApplication(selectedInternshipForEligibility);
            setShowApplicationModal(true);
          }}
          onClose={() => {
            setShowEligibilityCheck(false);
            setSelectedInternshipForEligibility(null);
          }}
        />
      )}

      {showRatingModal && selectedInternship && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Rate {selectedInternship.title}</h2>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center space-x-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRatingValue(star)} className="focus:outline-none">
                      <Star className={`h-10 w-10 ${star <= ratingValue ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {ratingValue === 1 && 'Poor'}
                  {ratingValue === 2 && 'Fair'}
                  {ratingValue === 3 && 'Good'}
                  {ratingValue === 4 && 'Very Good'}
                  {ratingValue === 5 && 'Excellent'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                <textarea 
                  value={ratingComment} 
                  onChange={(e) => setRatingComment(e.target.value)} 
                  rows={4} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent" 
                  placeholder="Share your thoughts about this internship..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => setShowRatingModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button 
                  onClick={handleRatingSubmit} 
                  disabled={submitting || ratingValue === 0} 
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Internships;