// src/pages/RecruiterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Eye, Edit, Trash2, Briefcase, Building, 
  Mail, Phone, Calendar, BookOpen, BarChart3, X, Upload,
  MapPin, CheckCircle, XCircle, Clock, TrendingUp, Award,
  Target, Send, Filter, Download, ChevronDown, ChevronUp,
  Sparkles, UserCheck, Key, FileText, Loader, Star
} from 'lucide-react';
import api from '../services/api';
import JobPostForm from '../components/JobPostForm';
import ApplicationsList from '../components/ApplicationsList';
import TestManagement from '../components/TestManagement';
import ExternalJobManagement from '../components/ExternalJobManagement';
import ExternalJobResults from '../components/ExternalJobResults';

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [showTestManagement, setShowTestManagement] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  
  // External results state
  const [externalJobsWithStats, setExternalJobsWithStats] = useState([]);
  const [showExternalResults, setShowExternalResults] = useState(false);
  const [selectedExternalJobForResults, setSelectedExternalJobForResults] = useState(null);
  const [loadingExternalStats, setLoadingExternalStats] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchRecruiterJobs();
    fetchRecruiterProfile();
  }, []);

  const fetchRecruiterJobs = async () => {
    try {
      setLoading(true);
      console.log('Fetching recruiter jobs for user:', currentUser);
      
      const profileResponse = await api.get(`/recruiters/user/${currentUser.id}`);
      console.log('Recruiter profile response:', profileResponse.data);
      
      if (profileResponse.data.recruiter) {
        const recruiterId = profileResponse.data.recruiter.id;
        console.log('Using recruiter ID:', recruiterId);
        
        const jobsResponse = await api.get(`/recruiters/jobs/recruiter/${recruiterId}`);
        console.log('Recruiter jobs response:', jobsResponse.data);
        setJobs(jobsResponse.data || []);
      } else {
        setError('Recruiter profile not found. Please complete your recruiter profile first.');
      }
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error);
      setError('Failed to load jobs: ' + (error.response?.data?.error || error.message));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruiterProfile = async () => {
    try {
      const response = await api.get(`/recruiters/user/${currentUser.id}`);
      if (response.data.recruiter) {
        setRecruiterProfile(response.data.recruiter);
      }
    } catch (error) {
      console.error('Error fetching recruiter profile:', error);
    }
  };

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/aptitude-tests/recruiter/${recruiterProfile?.id}/results`);
      setTestResults(response.data.assignments || []);
      setShowTestResults(true);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalJobsWithStats = async () => {
    if (!recruiterProfile?.id) return;
    
    try {
      setLoadingExternalStats(true);
      const response = await api.get(`/external-jobs/recruiter/${recruiterProfile.id}/jobs-with-stats`);
      setExternalJobsWithStats(response.data || []);
    } catch (error) {
      console.error('Error fetching external jobs with stats:', error);
      setExternalJobsWithStats([]);
    } finally {
      setLoadingExternalStats(false);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!recruiterProfile) {
        alert('Please complete your recruiter profile first');
        return;
      }

      const requestData = {
        ...jobData,
        recruiterId: recruiterProfile.id
      };

      console.log('Creating job with data:', requestData);
      
      const response = await api.post('/recruiters/jobs', requestData);
      console.log('Job creation response:', response.data);
      
      setShowJobForm(false);
      fetchRecruiterJobs();
      
      alert('Job posted successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateJob = async (jobData) => {
    try {
      const requestData = {
        ...jobData,
        recruiterId: recruiterProfile?.id
      };

      const response = await api.put(`/recruiters/jobs/${editingJob.id}`, requestData);
      console.log('Job update response:', response.data);
      
      setEditingJob(null);
      setShowJobForm(false);
      fetchRecruiterJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await api.delete(`/recruiters/jobs/${jobId}?recruiterId=${recruiterProfile?.id}`);
      fetchRecruiterJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job: ' + (error.response?.data?.error || error.message));
    }
  };

  const viewApplications = (job) => {
    console.log('Viewing applications for job:', job);
    setSelectedJob(job);
    setShowApplications(true);
  };

  const navigateToInterviewPage = () => {
    window.location.href = '/recruiter/interviews';
  };

  const parseSkills = (skillsJson) => {
    try {
      return skillsJson ? JSON.parse(skillsJson) : [];
    } catch {
      return [];
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PASSED':
        return 'bg-emerald-100 text-emerald-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && activeTab !== 'tests' && activeTab !== 'external' && activeTab !== 'external-results') {
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recruiter Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your job postings, view applications, and conduct aptitude tests
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={navigateToInterviewPage}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Interview Management
            </button>
            <button
              onClick={() => {
                setActiveTab('tests');
                setShowTestManagement(true);
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Test Management
            </button>
            <button
              onClick={() => setShowJobForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Post New Job
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="h-5 w-5 mr-2" />
              My Jobs
            </button>
            <button
              onClick={() => {
                setActiveTab('tests');
                setShowTestManagement(true);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Aptitude Tests
            </button>
            <button
              onClick={() => {
                setActiveTab('results');
                fetchTestResults();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Test Results
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'external'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-5 w-5 mr-2" />
              External Jobs
            </button>
            <button
              onClick={() => {
                setActiveTab('external-results');
                fetchExternalJobsWithStats();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'external-results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              External Results
            </button>
          </nav>
        </div>

        {/* Recruiter Profile Info */}
        {recruiterProfile && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{recruiterProfile.companyName}</h2>
                  <p className="text-gray-600">{recruiterProfile.industry}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {recruiterProfile.contactEmail && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {recruiterProfile.contactEmail}
                      </div>
                    )}
                    {recruiterProfile.contactPhone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {recruiterProfile.contactPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
                <p className="text-gray-600">Active Jobs</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Jobs Tab Content */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h3>
                  <p className="text-lg text-gray-600 mb-2">{job.company}</p>
                  
                  <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {job.experienceLevel}
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {job.jobType}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Posted: {formatDate(job.postedDate)}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {job.description?.substring(0, 200)}...
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {parseSkills(job.requiredSkills).slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {parseSkills(job.requiredSkills).length > 5 && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        +{parseSkills(job.requiredSkills).length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => viewApplications(job)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Applications
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingJob(job)}
                      className="flex-1 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="flex-1 inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {job.isActive ? 'Active' : 'Inactive'}
                </div>
                {job.averageRating > 0 && (
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{job.averageRating} ({job.totalRatings} ratings)</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-500 mb-6">Get started by posting your first job opening.</p>
              <button
                onClick={() => setShowJobForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Post Your First Job
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tests Tab Content */}
      {activeTab === 'tests' && showTestManagement && recruiterProfile && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <TestManagement recruiterId={recruiterProfile.id} />
        </div>
      )}

      {/* Test Results Tab Content */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Test Results</h3>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No test results available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResults.map((result) => (
                    <tr key={result.assignmentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.candidateName}</div>
                        <div className="text-sm text-gray-500">{result.candidateEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.testName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.score}/{result.totalQuestions} ({result.percentage}%)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* External Jobs Tab Content */}
      {activeTab === 'external' && recruiterProfile && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ExternalJobManagement recruiterId={recruiterProfile.id} />
        </div>
      )}

      {/* External Results Tab Content */}
      {activeTab === 'external-results' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">External Jobs - Results Overview</h3>
              <p className="text-gray-500 text-sm mt-1">Track shortlisted candidates and schedule interviews</p>
            </div>
            <button
              onClick={() => {
                setActiveTab('external');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create New External Job
            </button>
          </div>
          
          {loadingExternalStats ? (
            <div className="text-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Loading external jobs...</p>
            </div>
          ) : externalJobsWithStats.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No External Jobs Created</h4>
              <p className="text-gray-500 mb-4">Create an external job posting to start receiving applications</p>
              <button
                onClick={() => setActiveTab('external')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create External Job
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {externalJobsWithStats.map(job => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800">{job.title}</h4>
                      <p className="text-gray-600">{job.company}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{job.location || 'Location N/A'}</span>
                        <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" />{job.jobType || 'Full-time'}</span>
                        <span className="flex items-center"><Users className="h-3 w-3 mr-1" />Need: {job.requiredCandidates} candidates</span>
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />Created: {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedExternalJobForResults(job);
                        setShowExternalResults(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </button>
                  </div>
                  
                  {/* Stats for this job */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{job.totalCandidates || 0}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{job.pendingCount || 0}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{job.shortlistedCount || 0}</div>
                        <div className="text-xs text-gray-500">Shortlisted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{job.averageMatchScore || 0}%</div>
                        <div className="text-xs text-gray-500">Avg Match</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{job.requiredCandidates || 0}</div>
                        <div className="text-xs text-gray-500">Required</div>
                      </div>
                    </div>
                    
                    {/* Required Skills Preview */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="mt-3 pt-2">
                        <p className="text-xs text-gray-500 mb-1">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.requiredSkills.slice(0, 8).map((skill, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 8 && (
                            <span className="text-gray-500 text-xs">+{job.requiredSkills.length - 8} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Progress Bar for Shortlisting */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Shortlisting Progress</span>
                        <span>{job.shortlistedCount}/{job.requiredCandidates} candidates</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-green-500 transition-all duration-500"
                          style={{ width: `${Math.min((job.shortlistedCount / job.requiredCandidates) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <JobPostForm
          job={editingJob}
          onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
          onCancel={() => {
            setShowJobForm(false);
            setEditingJob(null);
          }}
        />
      )}

      {/* Applications Modal */}
      {showApplications && selectedJob && (
        <ApplicationsList
          job={selectedJob}
          onClose={() => {
            setShowApplications(false);
            setSelectedJob(null);
          }}
        />
      )}

      {/* External Results Modal */}
      {showExternalResults && selectedExternalJobForResults && (
        <ExternalJobResults
          job={selectedExternalJobForResults}
          onClose={() => {
            setShowExternalResults(false);
            setSelectedExternalJobForResults(null);
          }}
        />
      )}
    </div>
  );
};

export default RecruiterDashboard;