// src/components/TestManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, BookOpen, Clock, Target, Users, CheckCircle, XCircle, 
  X, Award, BarChart3, Eye, Send, Filter, Download, Calendar,
  ChevronDown, ChevronUp, Sparkles, Briefcase, Building, Loader
} from 'lucide-react';
import api from '../services/api';
import DreamRoleTestCreator from './DreamRoleTestCreator';

const TestManagement = ({ recruiterId }) => {
  const [tests, setTests] = useState([]);
  const [dreamRoleTests, setDreamRoleTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDreamRoleCreator, setShowDreamRoleCreator] = useState(false);
  const [showAddQuestions, setShowAddQuestions] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [externalCandidates, setExternalCandidates] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [testStats, setTestStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests');
  const [expandedTest, setExpandedTest] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  const [newTest, setNewTest] = useState({
    testName: '',
    description: '',
    durationMinutes: 60,
    passingScore: 60
  });
  
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    category: 'Quantitative',
    difficultyLevel: 1
  });
  
  const [questions, setQuestions] = useState([]);
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTestForResults, setSelectedTestForResults] = useState(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  useEffect(() => {
    if (recruiterId) {
      fetchTests();
      fetchDreamRoleTests();
      fetchTestStats();
      fetchShortlistedCandidates();
      fetchExternalShortlistedCandidates();
    }
  }, [recruiterId]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      console.log('Fetching manual tests for recruiter:', recruiterId);
      const response = await api.get(`/aptitude-tests/recruiter/${recruiterId}`);
      console.log('Manual tests fetched:', response.data);
      
      const manualTests = response.data || [];
      setTests(manualTests);
      console.log('Manual tests set to state:', manualTests.length);
      
    } catch (error) {
      console.error('Error fetching manual tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDreamRoleTests = async () => {
    try {
      console.log('Fetching DreamRole tests for recruiter:', recruiterId);
      const response = await api.get(`/dream-role-tests/recruiter/${recruiterId}`);
      console.log('DreamRole tests fetched:', response.data);
      setDreamRoleTests(response.data || []);
    } catch (error) {
      console.error('Error fetching DreamRole tests:', error);
      setDreamRoleTests([]);
    }
  };

  const fetchTestStats = async () => {
    try {
      const response = await api.get(`/aptitude-tests/stats/recruiter/${recruiterId}`);
      setTestStats(response.data);
    } catch (error) {
      console.error('Error fetching test stats:', error);
    }
  };

  const fetchShortlistedCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/recruiter/${recruiterId}/by-status?status=SHORTLISTED`);
      setCandidates(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalShortlistedCandidates = async () => {
    try {
      console.log('Fetching external shortlisted candidates for recruiter:', recruiterId);
      const response = await api.get(`/external-jobs/recruiter/${recruiterId}/shortlisted-candidates-for-test`);
      console.log('External candidates response:', response.data);
      
      const transformedCandidates = (response.data || []).map(candidate => ({
        id: candidate.id,
        candidateId: candidate.id,  // IMPORTANT: Add this for consistency
        applicantName: candidate.applicantName,
        applicantEmail: candidate.applicantEmail,
        applicantPhone: candidate.applicantPhone,
        applicantExperience: candidate.applicantExperience || 0,
        applicantEducation: candidate.applicantEducation || 'Not specified',
        applicantSkills: candidate.applicantSkills || '[]',
        matchPercentage: candidate.matchPercentage || 0,
        matchedSkills: candidate.matchedSkills,
        missingSkills: candidate.missingSkills,
        status: candidate.status,
        hasTest: candidate.hasTest || false,
        isExternalCandidate: true,
        isExistingUser: candidate.isExistingUser,
        passwordStatus: candidate.passwordStatus,
        job: candidate.job,
        testAssignmentId: candidate.testAssignmentId
      }));
      
      setExternalCandidates(transformedCandidates);
      console.log('Transformed external candidates:', transformedCandidates.length);
    } catch (error) {
      console.error('Error fetching external shortlisted candidates:', error);
      setExternalCandidates([]);
    }
  };

  const fetchTestResults = async (testId, isDreamRole = false) => {
    try {
      setLoading(true);
      console.log('Fetching results for test:', testId, 'isDreamRole:', isDreamRole);
      
      if (isDreamRole) {
        const test = dreamRoleTests.find(t => t.id === testId);
        setSelectedTestForResults(test);
        const response = await api.get(`/dream-role-tests/test/${testId}/results/unscheduled`);
        console.log('DreamRole test results:', response.data);
        setTestResults(response.data.results || []);
      } else {
        const test = tests.find(t => t.id === testId);
        setSelectedTestForResults(test);
        const response = await api.get(`/aptitude-tests/test/${testId}/results/unscheduled`);
        console.log('Manual test results:', response.data);
        setTestResults(response.data.results || []);
      }
      
      setShowTestResults(true);
    } catch (error) {
      console.error('Error fetching test results:', error);
      alert('Failed to fetch test results: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    try {
      if (!newTest.testName) {
        alert('Please enter test name');
        return;
      }

      const response = await api.post('/aptitude-tests/create', {
        recruiterId,
        ...newTest
      });
      
      alert('Manual test created successfully! Now add questions.');
      await fetchTests();
      setSelectedTest(response.data.test);
      setShowCreateForm(false);
      setShowAddQuestions(true);
      setNewTest({
        testName: '',
        description: '',
        durationMinutes: 60,
        passingScore: 60
      });
    } catch (error) {
      console.error('Error creating manual test:', error);
      alert('Failed to create test: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question || !newQuestion.optionA || !newQuestion.optionB || 
        !newQuestion.optionC || !newQuestion.optionD || !newQuestion.correctAnswer) {
      alert('Please fill all fields');
      return;
    }
    
    setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
    setNewQuestion({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      category: 'Quantitative',
      difficultyLevel: 1
    });
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    
    try {
      const response = await api.post(`/aptitude-tests/${selectedTest.id}/add-multiple-questions`, questions);
      alert(response.data.message);
      setShowAddQuestions(false);
      setQuestions([]);
      await fetchTests();
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Failed to save questions: ' + (error.response?.data?.error || error.message));
    }
  };

  // FIXED: handleAssignTest for external candidates
  const handleAssignTest = async (candidateId, testId, isDreamRole = false, isExternalCandidate = false) => {
    try {
      console.log("=== ASSIGN TEST CALLED ===");
      console.log("Candidate ID:", candidateId);
      console.log("Test ID:", testId);
      console.log("Is DreamRole:", isDreamRole);
      console.log("Is External Candidate:", isExternalCandidate);
      console.log("Deadline Hours:", deadlineHours);
      
      let response;
      
      if (isExternalCandidate) {
        // Special endpoint for external candidates - FIXED endpoint path
        console.log("Calling external candidate test assignment endpoint...");
        console.log("Request payload:", {
          candidateId: candidateId,
          testId: testId,
          deadlineHours: deadlineHours,
          isDreamRoleTest: isDreamRole
        });
        
        response = await api.post('/external-jobs/assign-test', {
          candidateId: candidateId,
          testId: testId,
          deadlineHours: deadlineHours,
          isDreamRoleTest: isDreamRole
        });
        console.log("External test assignment response:", response.data);
      } else if (isDreamRole) {
        console.log("Calling DreamRole test assignment...");
        response = await api.post('/dream-role-tests/assign', {
          testId,
          applicationId: candidateId,
          deadlineHours
        });
      } else {
        console.log("Calling manual test assignment...");
        response = await api.post('/aptitude-tests/assign', {
          testId,
          applicationId: candidateId,
          deadlineHours
        });
      }
      
      if (response.data && (response.data.message || response.data.assignmentId)) {
        alert('Test assigned successfully! The candidate can now take the test.');
        
        // Refresh both lists
        await fetchShortlistedCandidates();
        await fetchExternalShortlistedCandidates();
      }
      
    } catch (error) {
      console.error('Error assigning test:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to assign test: ';
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.status === 405) {
        errorMessage += 'Method not allowed. Please check if the backend endpoint is properly configured.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Endpoint not found. Please check if the backend is running.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Please check backend logs.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate) return;
    
    if (!interviewDate || !interviewTime || !interviewLocation) {
      alert('Please fill all required fields');
      return;
    }

    setSchedulingLoading(true);
    
    try {
      const dateTimeString = `${interviewDate}T${interviewTime}:00`;
      
      await api.put(`/applications/${selectedCandidate.applicationId}/schedule-interview?recruiterId=${recruiterId}`, {
        interviewDate: dateTimeString,
        interviewLocation: interviewLocation,
        notes: interviewNotes || `Interview scheduled for ${new Date(dateTimeString).toLocaleString()} at ${interviewLocation}`
      });
      
      alert('Interview scheduled successfully! The candidate has been moved to Interview Management page.');
      setShowInterviewModal(false);
      setSelectedCandidate(null);
      setInterviewDate('');
      setInterviewTime('');
      setInterviewLocation('');
      setInterviewNotes('');
      
      setTestResults(prevResults => 
        prevResults.filter(result => result.applicationId !== selectedCandidate.applicationId)
      );
      
      fetchTestStats();
      
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview: ' + (error.response?.data?.error || error.message));
    } finally {
      setSchedulingLoading(false);
    }
  };

  const loadTestQuestions = async (testId) => {
    try {
      const response = await api.get(`/aptitude-tests/${testId}/questions`);
      setSelectedTest(tests.find(t => t.id === testId));
      setExpandedTest(expandedTest === testId ? null : testId);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>;
      case 'EXPIRED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Expired</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const openScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setShowInterviewModal(true);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getFilteredCandidates = () => {
    let allCandidates = [...candidates, ...externalCandidates];
    
    const uniqueCandidates = [];
    const emailSet = new Set();
    for (const candidate of allCandidates) {
      if (!emailSet.has(candidate.applicantEmail)) {
        emailSet.add(candidate.applicantEmail);
        uniqueCandidates.push(candidate);
      }
    }
    
    let filtered = uniqueCandidates;
    
    if (searchTerm) {
      filtered = filtered.filter(candidate => 
        candidate.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.applicantEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus === 'assigned') {
      filtered = filtered.filter(c => c.hasTest === true);
    } else if (filterStatus === 'not-assigned') {
      filtered = filtered.filter(c => c.hasTest !== true);
    }
    
    return filtered;
  };

  const filteredCandidates = getFilteredCandidates();

  if (loading && activeTab !== 'tests') {
    return (
      <div className="text-center py-8">
        <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      {testStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Assigned</div>
            <div className="text-2xl font-bold">{testStats.totalAssigned || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-blue-600">{testStats.completed || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Passed</div>
            <div className="text-2xl font-bold text-green-600">{testStats.passed || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Avg Score</div>
            <div className="text-2xl font-bold text-purple-600">{testStats.averageScore || 0}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pass Rate</div>
            <div className="text-2xl font-bold text-orange-600">{testStats.passRate || 0}%</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'tests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            My Tests
          </button>
          <button
            onClick={() => {
              setActiveTab('assign');
              fetchShortlistedCandidates();
              fetchExternalShortlistedCandidates();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'assign'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="h-5 w-5 mr-2" />
            Assign Tests
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Results & Analytics
          </button>
        </nav>
      </div>

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Your Tests</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Manual Test
              </button>
              <button
                onClick={() => setShowDreamRoleCreator(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create DreamRole Test
              </button>
            </div>
          </div>

          {/* Manual Tests */}
          <div className="mb-8">
            <h4 className="font-medium text-gray-700 mb-3">Manual Tests</h4>
            {tests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {tests.map(test => (
                  <div key={test.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-lg">{test.testName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {test.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{test.description || 'No description'}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1 text-blue-600" />
                            <span>{test.totalQuestions || 0}/40 Questions</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-purple-600" />
                            <span>{test.durationMinutes} minutes</span>
                          </div>
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1 text-green-600" />
                            <span>Pass: {test.passingScore}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadTestQuestions(test.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded-lg"
                        >
                          View Questions
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTest(test);
                            setActiveTab('assign');
                          }}
                          className="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-200 rounded-lg"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => fetchTestResults(test.id, false)}
                          className="text-purple-600 hover:text-purple-800 text-sm px-3 py-1 border border-purple-200 rounded-lg"
                        >
                          Results
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No manual tests created yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Create Your First Manual Test
                </button>
              </div>
            )}
          </div>

          {/* DreamRole Tests */}
          {dreamRoleTests.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 text-purple-600 mr-2" />
                DreamRole Tests (Auto-generated Aptitude)
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {dreamRoleTests.map(test => (
                  <div key={test.id} className="bg-purple-50 rounded-lg shadow border border-purple-200 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-lg">{test.testName}</h4>
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs">
                            {test.targetBranch}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1 text-purple-600" />
                            <span>{test.technicalQuestionsAdded || 0}/10 Tech Questions</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-purple-600" />
                            <span>{test.durationMinutes} minutes</span>
                          </div>
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1 text-purple-600" />
                            <span>Pass: {test.passingScore}%</span>
                          </div>
                          <div className="flex items-center">
                            <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
                            <span>40 Aptitude + 10 Tech</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTest(test);
                            setActiveTab('assign');
                          }}
                          className="text-purple-600 hover:text-purple-800 text-sm px-3 py-1 border border-purple-200 rounded-lg"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => fetchTestResults(test.id, true)}
                          className="text-purple-600 hover:text-purple-800 text-sm px-3 py-1 border border-purple-200 rounded-lg"
                        >
                          Results
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tests.length === 0 && dreamRoleTests.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No tests created yet</p>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Create Manual Test
                </button>
                <button
                  onClick={() => setShowDreamRoleCreator(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                >
                  Create DreamRole Test
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Tests Tab */}
      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold mb-3">Select Test</h4>
              
              {tests.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Manual Tests</h5>
                  <select
                    value={selectedTest?.id || ''}
                    onChange={(e) => {
                      const testId = e.target.value;
                      if (testId) {
                        const test = tests.find(t => t.id === parseInt(testId));
                        setSelectedTest({...test, type: 'manual'});
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                  >
                    <option value="">Choose a manual test</option>
                    {tests.map(test => (
                      <option key={test.id} value={test.id}>
                        {test.testName} ({test.totalQuestions || 0} questions)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {dreamRoleTests.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <Sparkles className="h-3 w-3 text-purple-600 mr-1" />
                    DreamRole Tests
                  </h5>
                  <select
                    value={selectedTest?.id || ''}
                    onChange={(e) => {
                      const testId = e.target.value;
                      if (testId) {
                        const test = dreamRoleTests.find(t => t.id === parseInt(testId));
                        setSelectedTest({...test, type: 'dreamrole'});
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choose a DreamRole test</option>
                    {dreamRoleTests.map(test => (
                      <option key={test.id} value={test.id}>
                        {test.testName} ({test.targetBranch}) - {test.technicalQuestionsAdded || 0}/10 tech
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {tests.length === 0 && dreamRoleTests.length === 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800 font-medium">No tests available</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please create a test first in the "My Tests" tab.
                  </p>
                </div>
              )}
              
              {selectedTest && (
                <div className={`p-3 rounded-lg ${
                  selectedTest.type === 'dreamrole' ? 'bg-purple-50' : 'bg-blue-50'
                }`}>
                  <h5 className="font-medium mb-2">Test Details</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedTest.testName}</p>
                    <p><span className="font-medium">Duration:</span> {selectedTest.durationMinutes} minutes</p>
                    <p><span className="font-medium">Passing Score:</span> {selectedTest.passingScore}%</p>
                    {selectedTest.type === 'dreamrole' ? (
                      <>
                        <p><span className="font-medium">Branch:</span> {selectedTest.targetBranch}</p>
                        <p><span className="font-medium">Questions:</span> 40 Aptitude + {selectedTest.technicalQuestionsAdded || 0} Technical</p>
                      </>
                    ) : (
                      <p><span className="font-medium">Questions:</span> {selectedTest.totalQuestions || 0}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Deadline (hours)</label>
                <input
                  type="number"
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="1"
                  max="168"
                />
              </div>
            </div>
          </div>
          
          {/* Candidates List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">Shortlisted Candidates</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="not-assigned">Not Assigned</option>
                    <option value="assigned">Assigned</option>
                  </select>
                </div>
              </div>
              
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No shortlisted candidates found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Candidates will appear here after they are shortlisted from job applications or external jobs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCandidates.map(candidate => (
                    <div key={candidate.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h5 className="font-medium">{candidate.applicantName}</h5>
                            
                            {candidate.isExternalCandidate && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center">
                                <Briefcase className="h-3 w-3 mr-1" />
                                External Job
                              </span>
                            )}
                            
                            {candidate.isExistingUser && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                Existing User
                              </span>
                            )}
                            
                            {candidate.matchPercentage > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {Math.round(candidate.matchPercentage)}% Match
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{candidate.applicantEmail}</p>
                          
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 flex-wrap gap-2">
                            {candidate.job ? (
                              <>
                                <span className="flex items-center">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  {candidate.job.title}
                                </span>
                                <span className="flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {candidate.job.company}
                                </span>
                              </>
                            ) : (
                              <span>Job: {candidate.job?.title || 'Regular Application'}</span>
                            )}
                            <span>Exp: {candidate.applicantExperience} years</span>
                          </div>
                        </div>
                        
                        {candidate.hasTest ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Test Assigned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAssignTest(
                              candidate.id, 
                              selectedTest?.id, 
                              selectedTest?.type === 'dreamrole',
                              candidate.isExternalCandidate || false
                            )}
                            disabled={!selectedTest}
                            className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center ${
                              selectedTest
                                ? selectedTest.type === 'dreamrole'
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Assign Test
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tests List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold mb-3">Your Tests</h4>
              
              {tests.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Manual Tests</h5>
                  {tests.map(test => (
                    <button
                      key={test.id}
                      onClick={() => fetchTestResults(test.id, false)}
                      className={`w-full text-left p-3 rounded-lg border mb-2 ${
                        showTestResults && selectedTestForResults?.id === test.id && !selectedTestForResults?.targetBranch
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium">{test.testName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {test.totalQuestions} questions • {test.durationMinutes} mins
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {dreamRoleTests.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <Sparkles className="h-3 w-3 text-purple-600 mr-1" />
                    DreamRole Tests
                  </h5>
                  {dreamRoleTests.map(test => (
                    <button
                      key={test.id}
                      onClick={() => fetchTestResults(test.id, true)}
                      className={`w-full text-left p-3 rounded-lg border mb-2 ${
                        showTestResults && selectedTestForResults?.id === test.id && selectedTestForResults?.targetBranch
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium">{test.testName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {test.targetBranch} • {test.durationMinutes} mins
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2">
            {showTestResults && (
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-semibold mb-4">Test Results: {selectedTestForResults?.testName}</h4>
                <p className="text-sm text-gray-500 mb-4">Showing candidates who need interviews scheduled</p>
                
                {testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">All candidates from this test have been moved to Interview Management</p>
                    <p className="text-sm text-gray-400 mt-2">No pending candidates to schedule interviews for.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {testResults.filter(r => r.passed).length}
                        </div>
                        <div className="text-xs text-gray-600">Need Interview</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {testResults.filter(r => !r.passed && r.status === 'COMPLETED').length}
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {testResults.filter(r => r.status === 'PENDING').length}
                        </div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {testResults.map((result, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">{result.candidateName}</h5>
                                {getStatusBadge(result.status)}
                              </div>
                              <p className="text-sm text-gray-600">{result.candidateEmail}</p>
                              
                              {result.status === 'COMPLETED' && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-600">Score</span>
                                    <span className="text-sm font-medium">
                                      {result.score}/{result.totalQuestions} ({result.percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        result.passed ? 'bg-green-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${result.percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                      Passing Score: {result.passingScore}%
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs font-medium ${
                                        result.passed ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {result.passed ? 'PASSED' : 'FAILED'}
                                      </span>
                                      
                                      {result.passed && (
                                        <button
                                          onClick={() => openScheduleInterview({
                                            applicationId: result.applicationId,
                                            candidateName: result.candidateName,
                                            candidateEmail: result.candidateEmail,
                                            testName: result.testName,
                                            score: result.score,
                                            percentage: result.percentage
                                          })}
                                          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center"
                                        >
                                          <Calendar className="h-3 w-3 mr-1" />
                                          Schedule Interview
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {result.completedAt && (
                                <p className="text-xs text-gray-400 mt-2">
                                  Completed: {new Date(result.completedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Manual Test Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create Manual Test</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Name *</label>
                <input
                  type="text"
                  value={newTest.testName}
                  onChange={(e) => setNewTest({...newTest, testName: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Software Developer Test"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Brief description of the test"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={newTest.durationMinutes}
                    onChange={(e) => setNewTest({...newTest, durationMinutes: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="15"
                    max="180"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    value={newTest.passingScore}
                    onChange={(e) => setNewTest({...newTest, passingScore: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="30"
                    max="90"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Questions Modal */}
      {showAddQuestions && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold">Add Questions to "{selectedTest.testName}"</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add questions for the manual test. Current: {questions.length} questions
                </p>
              </div>
              <button onClick={() => setShowAddQuestions(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Question Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Add New Question</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Question *</label>
                    <textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows="2"
                      placeholder="Enter question"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Option A *</label>
                      <input
                        type="text"
                        value={newQuestion.optionA}
                        onChange={(e) => setNewQuestion({...newQuestion, optionA: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Option B *</label>
                      <input
                        type="text"
                        value={newQuestion.optionB}
                        onChange={(e) => setNewQuestion({...newQuestion, optionB: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Option C *</label>
                      <input
                        type="text"
                        value={newQuestion.optionC}
                        onChange={(e) => setNewQuestion({...newQuestion, optionC: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Option D *</label>
                      <input
                        type="text"
                        value={newQuestion.optionD}
                        onChange={(e) => setNewQuestion({...newQuestion, optionD: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Correct Answer *</label>
                      <select
                        value={newQuestion.correctAnswer}
                        onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Category</label>
                      <select
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="Quantitative">Quantitative</option>
                        <option value="Logical">Logical</option>
                        <option value="Verbal">Verbal</option>
                        <option value="Technical">Technical</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Explanation (Optional)</label>
                    <textarea
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows="2"
                      placeholder="Explain the correct answer"
                    />
                  </div>
                  
                  <button
                    onClick={handleAddQuestion}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                </div>
              </div>
              
              {/* Questions List */}
              <div>
                <h4 className="font-medium mb-3">Added Questions ({questions.length}/40)</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {questions.map((q, index) => (
                    <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-3 text-sm relative group">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">Q{index + 1}: {q.question.substring(0, 50)}...</span>
                        <button
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {q.category}
                        </span>
                        <span className="text-xs text-gray-500">Correct: {q.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setShowAddQuestions(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestions}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    Save All Questions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DreamRole Test Creator Modal */}
      {showDreamRoleCreator && (
        <DreamRoleTestCreator
          recruiterId={recruiterId}
          onClose={() => setShowDreamRoleCreator(false)}
          onSuccess={() => {
            fetchDreamRoleTests();
            setShowDreamRoleCreator(false);
          }}
        />
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && selectedCandidate && (
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
                <span className="font-medium">Candidate:</span> {selectedCandidate.candidateName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Score: {selectedCandidate.score}/{selectedCandidate.percentage}% • Test Passed
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
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  placeholder="e.g., Conference Room B, Zoom Meeting"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

              {(interviewDate && interviewTime && interviewLocation) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2">Interview Preview:</h4>
                  <p className="text-sm text-blue-700">
                    <strong>Date:</strong> {new Date(`${interviewDate}T${interviewTime}`).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Time:</strong> {new Date(`${interviewDate}T${interviewTime}`).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Location:</strong> {interviewLocation}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    After scheduling, this candidate will be permanently removed from this list.
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {schedulingLoading ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;