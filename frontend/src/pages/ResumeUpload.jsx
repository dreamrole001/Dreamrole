// src/pages/ResumeUpload.jsx
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, TrendingUp, Target, XCircle } from 'lucide-react';
import api from '../services/api';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [hasRecommendations, setHasRecommendations] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
      
      if (!allowedTypes.includes('.' + fileExtension)) {
        setError('Please select a PDF, DOC, DOCX, or TXT file');
        setFile(null);
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setUploadStatus('');
      setAnalysis(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setError('');
    setAnalysis(null);
    setHasRecommendations(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Starting upload process...');
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User not logged in');
      }
      
      // Upload to backend
      const uploadResponse = await api.post(`/resumes/upload/${currentUser.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      console.log('Backend upload response:', uploadResponse.data);
      
      if (uploadResponse.data) {
        setUploadStatus('success');
        
        const analysisData = uploadResponse.data;
        
        // Store extracted skills in localStorage
        if (analysisData.skills && analysisData.skills.length > 0) {
          localStorage.setItem('userSkills', JSON.stringify(analysisData.skills));
          console.log('✅ Skills saved to localStorage:', analysisData.skills);
        } else {
          localStorage.removeItem('userSkills');
          console.log('⚠️ No skills found, cleared localStorage');
        }
        
        // Store experience and education
        if (analysisData.experienceYears !== undefined) {
          localStorage.setItem('userExperience', analysisData.experienceYears.toString());
        }
        if (analysisData.educationLevel) {
          localStorage.setItem('userEducation', analysisData.educationLevel);
        }
        
        // Check if there are actual recommendations
        const hasJobRecs = analysisData.job_recommendations && analysisData.job_recommendations.length > 0;
        const hasInternshipRecs = analysisData.internship_recommendations && analysisData.internship_recommendations.length > 0;
        
        setHasRecommendations(hasJobRecs || hasInternshipRecs);
        setAnalysis(analysisData);
        
        // Dispatch event to notify all components that skills have been updated
        const skillsUpdateEvent = new CustomEvent('userSkillsUpdated', {
          detail: { 
            skills: analysisData.skills || [],
            experience: analysisData.experienceYears,
            education: analysisData.educationLevel,
            hasRecommendations: hasJobRecs || hasInternshipRecs
          }
        });
        window.dispatchEvent(skillsUpdateEvent);
        console.log('✅ Dispatched userSkillsUpdated event with', analysisData.skills?.length || 0, 'skills');
        
        // Show appropriate message
        if (!hasJobRecs && !hasInternshipRecs) {
          console.log('⚠️ No matching jobs or internships found for your skills');
        }
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Upload process failed:', error);
      let errorMessage = 'Upload failed. ';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to backend server. Please make sure the backend is running on http://localhost:8080';
      } else if (error.response) {
        errorMessage += `Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      setUploadStatus('error');
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Upload className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white hover:border-blue-400';
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading and analyzing your resume...';
      case 'success':
        return analysis ? 'Resume analyzed successfully!' : 'Resume uploaded successfully!';
      case 'error':
        return error || 'Upload failed. Please try again.';
      default:
        return '';
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatStipend = (stipend) => {
    if (!stipend) return 'Not specified';
    if (typeof stipend === 'number') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stipend);
    }
    return stipend;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload Your Resume</h1>
        <p className="text-gray-600">
          Upload your resume and get personalized job recommendations with AI-powered matching
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${getStatusColor()}`}
        >
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
          />
          
          <label htmlFor="resume-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              {getStatusIcon()}
              <div className="mt-4">
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-gray-700">
                      Drag and drop your resume here
                    </p>
                    <p className="text-gray-500 mt-1">or click to browse</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports PDF, DOC, DOCX, TXT (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
          >
            {isUploading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Target className="h-5 w-5 mr-2" />
                Analyze Resume & Get Matches
              </>
            )}
          </button>
        </div>

        {/* Status Message */}
        {uploadStatus && !error && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            uploadStatus === 'success' 
              ? 'bg-green-100 text-green-800'
              : uploadStatus === 'uploading'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {getStatusMessage()}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-8 border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Resume Analysis Results</h3>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span className="font-semibold">Ready for Job Matching</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Skills */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-gray-800 text-lg">Extracted Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {(!analysis.skills || analysis.skills.length === 0) && (
                    <p className="text-gray-500">No skills detected. Try uploading a more detailed resume.</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  These skills are now used to match you with relevant jobs and internships
                </p>
              </div>

              {/* Experience & Education */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-gray-800 text-lg">Profile Summary</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="text-xl text-gray-700 font-semibold">
                      {analysis.experienceYears || 0} years
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Education Level</p>
                    <p className="text-xl text-gray-700 font-semibold">
                      {analysis.educationLevel || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* JOB RECOMMENDATIONS - FIXED: Only show if there are actual matches */}
            {analysis.job_recommendations && analysis.job_recommendations.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-4 text-gray-800 text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  AI-Powered Job Recommendations ({analysis.job_recommendations.length} matches)
                </h4>
                <p className="text-gray-600 mb-6">
                  Based on your skills and experience, here are roles that match your profile:
                </p>
                <div className="space-y-4">
                  {analysis.job_recommendations.map((job, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-gray-800 text-lg">{job.title}</h5>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchColor(job.matchScore)}`}>
                          {Math.round(job.matchScore)}% Match
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">✅ Matched Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.matchedSkills?.slice(0, 5).map((skill, skillIndex) => (
                              <span key={skillIndex} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {job.matchedSkills?.length > 5 && (
                              <span className="text-gray-500 text-xs">+{job.matchedSkills.length - 5} more</span>
                            )}
                          </div>
                        </div>

                        {job.missingSkills && job.missingSkills.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">💡 Skills to Improve:</p>
                            <div className="flex flex-wrap gap-2">
                              {job.missingSkills.slice(0, 5).map((skill, skillIndex) => (
                                <span key={skillIndex} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {job.missingSkills.length > 5 && (
                                <span className="text-gray-500 text-xs">+{job.missingSkills.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress bar for visual match representation */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Match Score</span>
                          <span>{Math.round(job.matchScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              job.matchScore >= 80 ? 'bg-green-500' :
                              job.matchScore >= 60 ? 'bg-yellow-500' :
                              job.matchScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(job.matchScore, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // SHOW MESSAGE WHEN NO JOB MATCHES FOUND
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-6">
                <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h4 className="font-semibold text-yellow-800 mb-2">No Job Recommendations Available</h4>
                <p className="text-yellow-700">
                  {analysis.skills?.length > 0 
                    ? `We found ${analysis.skills.length} skills (${analysis.skills.slice(0, 5).join(', ')}${analysis.skills.length > 5 ? '...' : ''}) but no jobs currently match these skills.`
                    : "No skills were extracted from your resume. Please upload a resume with clear skills listed."}
                </p>
                <p className="text-yellow-600 text-sm mt-2">
                  Try uploading a resume with skills that match available job requirements.
                </p>
              </div>
            )}

            {/* INTERNSHIP RECOMMENDATIONS - FIXED: Only show if there are actual matches */}
            {analysis.internship_recommendations && analysis.internship_recommendations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-4 text-gray-800 text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Internship Recommendations ({analysis.internship_recommendations.length} matches)
                </h4>
                <div className="space-y-4">
                  {analysis.internship_recommendations.map((internship, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-gray-800 text-lg">{internship.title}</h5>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchColor(internship.matchScore)}`}>
                          {Math.round(internship.matchScore)}% Match
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">✅ Matched Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {internship.matchedSkills?.slice(0, 5).map((skill, skillIndex) => (
                              <span key={skillIndex} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {internship.missingSkills && internship.missingSkills.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">💡 Skills to Improve:</p>
                            <div className="flex flex-wrap gap-2">
                              {internship.missingSkills.slice(0, 5).map((skill, skillIndex) => (
                                <span key={skillIndex} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Match Score</span>
                          <span>{Math.round(internship.matchScore)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              internship.matchScore >= 80 ? 'bg-green-500' :
                              internship.matchScore >= 60 ? 'bg-yellow-500' :
                              internship.matchScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(internship.matchScore, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-center text-white">
              <h3 className="text-xl font-bold mb-2">Ready to Find Your Dream Job?</h3>
              {hasRecommendations ? (
                <>
                  <p className="mb-4">Your resume is now optimized for matching with relevant job opportunities</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => window.location.href = '/jobs'}
                      className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Browse Jobs
                    </button>
                    <button 
                      onClick={() => window.location.href = '/internships'}
                      className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors"
                    >
                      Browse Internships
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-4">Your resume has been analyzed. To get job recommendations, upload a resume with skills that match available job requirements.</p>
                  <button 
                    onClick={() => window.location.href = '/jobs'}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Browse Available Jobs
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;