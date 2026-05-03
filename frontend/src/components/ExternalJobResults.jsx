// src/components/ExternalJobResults.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Award, CheckCircle, XCircle, Clock, Calendar, 
  MapPin, User, Mail, Phone, Briefcase, TrendingUp,
  Star, Target, AlertCircle, Loader, Eye, ChevronDown, ChevronUp,
  Users, GraduationCap, Code, Send
} from 'lucide-react';
import api from '../services/api';

const ExternalJobResults = ({ job, onClose }) => {
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [schedulingMessage, setSchedulingMessage] = useState('');

  useEffect(() => {
    if (job && job.id) {
      fetchCandidates();
      fetchStats();
    }
  }, [job]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/external-jobs/${job.id}/candidates-with-results`);
      setCandidates(response.data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/external-jobs/${job.id}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate) return;
    
    if (!interviewDate || !interviewTime || !interviewLocation) {
      alert('Please fill all required fields');
      return;
    }

    setSchedulingLoading(true);
    setSchedulingMessage('Scheduling interview...');
    
    try {
      const dateTimeString = `${interviewDate}T${interviewTime}:00`;
      
      const response = await api.post(`/external-jobs/candidates/${selectedCandidate.candidateId}/schedule-interview`, {
        interviewDate: dateTimeString,
        interviewLocation: interviewLocation,
        notes: interviewNotes
      });
      
      if (response.data.message) {
        alert('Interview scheduled successfully!');
        setShowInterviewModal(false);
        setSelectedCandidate(null);
        setInterviewDate('');
        setInterviewTime('');
        setInterviewLocation('');
        setInterviewNotes('');
        setSchedulingMessage('');
        
        // Refresh candidates
        await fetchCandidates();
        await fetchStats();
      }
      
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview: ' + (error.response?.data?.error || error.message));
      setSchedulingMessage('');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center"><Clock className="h-3 w-3 mr-1" />Pending</span>;
      case 'SHORTLISTED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Shortlisted</span>;
      case 'INTERVIEW_SCHEDULED':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center"><Calendar className="h-3 w-3 mr-1" />Interview Scheduled</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center"><XCircle className="h-3 w-3 mr-1" />Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
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

  const parseSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    try {
      return JSON.parse(skills);
    } catch {
      return [];
    }
  };

  const CandidateCard = ({ candidate }) => {
    const isExpanded = expandedCandidate === candidate.candidateId;
    const extractedSkills = parseSkills(candidate.extractedSkills);
    const matchedSkills = parseSkills(candidate.matchedSkills);
    const missingSkills = parseSkills(candidate.missingSkills);
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <h4 className="font-semibold text-gray-800">{candidate.fullName}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(candidate.matchPercentage)}`}>
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {Math.round(candidate.matchPercentage)}% Match
              </span>
              {getStatusBadge(candidate.status)}
              {candidate.isExistingUser && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Existing User
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500 flex-wrap gap-2">
              <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{candidate.email}</span>
              {candidate.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" />{candidate.phone}</span>}
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              <span className="flex items-center text-gray-600"><Briefcase className="h-3 w-3 mr-1" />{candidate.experienceYears || 0} years exp</span>
              <span className="flex items-center text-gray-600"><GraduationCap className="h-3 w-3 mr-1" />{candidate.educationLevel || 'Not specified'}</span>
            </div>
            
            {/* Match Score Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Match Score</span>
                <span className="font-medium">{Math.round(candidate.matchPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    candidate.matchPercentage >= 80 ? 'bg-green-500' :
                    candidate.matchPercentage >= 60 ? 'bg-yellow-500' :
                    candidate.matchPercentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(candidate.matchPercentage, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Skills Preview */}
            {extractedSkills.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {extractedSkills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {extractedSkills.length > 5 && (
                    <span className="text-gray-500 text-xs">+{extractedSkills.length - 5} more</span>
                  )}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setExpandedCandidate(isExpanded ? null : candidate.candidateId)} 
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {isExpanded ? 'Show Less' : 'View Full Analysis'}
            </button>
            
            {isExpanded && (
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                {/* All Skills */}
                {extractedSkills.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Star className="h-4 w-4 mr-1 text-blue-600" />
                      All Extracted Skills ({extractedSkills.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {extractedSkills.map((skill, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Matched Skills */}
                {matchedSkills.length > 0 && (
                  <div className="p-2 bg-green-50 rounded">
                    <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Matched Skills ({matchedSkills.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {matchedSkills.map((skill, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Missing Skills */}
                {missingSkills.length > 0 && (
                  <div className="p-2 bg-red-50 rounded">
                    <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Skills to Improve ({missingSkills.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {missingSkills.map((skill, idx) => (
                        <span key={idx} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-4 flex flex-col space-y-2">
            {candidate.status === 'SHORTLISTED' && (
              <button
                onClick={() => {
                  setSelectedCandidate(candidate);
                  setShowInterviewModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </button>
            )}
            {candidate.status === 'INTERVIEW_SCHEDULED' && (
              <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Interview Scheduled
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const InterviewModal = () => {
    if (!selectedCandidate) return null;

    const interviewDateTime = interviewDate && interviewTime 
      ? new Date(`${interviewDate}T${interviewTime}`) 
      : null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Schedule Interview</h3>
            <button 
              onClick={() => setShowInterviewModal(false)} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">Candidate:</span> {selectedCandidate.fullName}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Match Score: {Math.round(selectedCandidate.matchPercentage)}% • Shortlisted
            </p>
            <p className="text-xs text-green-600">
              Email: {selectedCandidate.email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={getMinDate()}
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Location <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  placeholder="e.g., Conference Room B, Zoom Meeting, Google Meet"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Any instructions for the candidate..."
              />
            </div>

            {interviewDateTime && interviewLocation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Interview Preview:</h4>
                <p className="text-sm text-blue-700">
                  <strong>Date:</strong> {interviewDateTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Time:</strong> {interviewDateTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Location:</strong> {interviewLocation}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Candidate: {selectedCandidate.fullName} ({selectedCandidate.email})
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowInterviewModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleInterview}
              disabled={schedulingLoading || !interviewDate || !interviewTime || !interviewLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {schedulingLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  {schedulingMessage || 'Scheduling...'}
                </>
              ) : (
                'Schedule Interview'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="text-center py-8">
            <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-xl rounded-lg bg-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">External Job Results</h2>
            <p className="text-gray-600">{job.title} at {job.company}</p>
            <p className="text-sm text-gray-500 mt-1">Job ID: {job.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCandidates || 0}</div>
              <div className="text-xs text-gray-600">Total Candidates</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingCandidates || 0}</div>
              <div className="text-xs text-gray-600">Pending Review</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.shortlistedCandidates || 0}</div>
              <div className="text-xs text-gray-600">Shortlisted</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageMatchScore || 0}%</div>
              <div className="text-xs text-gray-600">Avg Match Score</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.requiredCandidates || 0}</div>
              <div className="text-xs text-gray-600">Required</div>
            </div>
          </div>
        )}

        {/* Candidates List */}
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500">Upload resumes to see candidates here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map(candidate => (
              <CandidateCard key={candidate.candidateId} candidate={candidate} />
            ))}
          </div>
        )}

        {/* Interview Modal */}
        {showInterviewModal && <InterviewModal />}
      </div>
    </div>
  );
};

export default ExternalJobResults;