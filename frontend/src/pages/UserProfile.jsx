// src/pages/UserProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Briefcase, GraduationCap, 
  Calendar, MapPin, Edit2, Save, X, Camera, 
  Loader, CheckCircle, XCircle, Award, 
  Linkedin, Github, Globe, 
  Trash2, Code, Heart, Cake, Plus, ExternalLink
} from 'lucide-react';
import api from '../services/api';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    issuer: '',
    date: '',
    credentialId: '',
    url: ''
  });
  const [newEducation, setNewEducation] = useState({
    degree: '',
    institution: '',
    year: '',
    description: '',
    percentage: ''
  });
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });
  
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    age: 0,
    location: '',
    bio: '',
    headline: '',
    website: '',
    linkedin: '',
    github: '',
    skills: [],
    education: [],
    experience: [],
    certifications: [],
    languages: [],
    interests: []
  });

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateOfBirthChange = (e) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setFormData({
      ...formData,
      dateOfBirth: dob,
      age: age
    });
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${currentUser.id}/profile`);
      const userData = response.data;
      
      const age = userData.dateOfBirth ? calculateAge(userData.dateOfBirth) : 0;
      
      setProfile(userData);
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        age: age,
        location: userData.location || '',
        bio: userData.bio || '',
        headline: userData.headline || '',
        website: userData.website || '',
        linkedin: userData.linkedin || '',
        github: userData.github || '',
        skills: userData.skills || [],
        education: userData.education || [],
        experience: userData.experience || [],
        certifications: userData.certifications || [],
        languages: userData.languages || [],
        interests: userData.interests || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await api.put(`/users/${currentUser.id}/profile`, formData);
      setProfile(response.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/users/${currentUser.id}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data && response.data.profilePictureUrl) {
        const imageUrl = response.data.profilePictureUrl;
        setProfile({ ...profile, profilePicture: imageUrl });
        setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
        setSuccess('Profile picture updated successfully!');
        
        // Refresh profile to get the latest data
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    try {
      const response = await api.post(`/users/${currentUser.id}/skills`, { skill: newSkill });
      setFormData(prev => ({ ...prev, skills: [...prev.skills, response.data] }));
      setNewSkill('');
      setShowSkillForm(false);
      setSuccess('Skill added!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await api.delete(`/users/${currentUser.id}/skills/${skillId}`);
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s.id !== skillId)
      }));
      setSuccess('Skill removed');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to remove skill');
    }
  };

  const handleAddEducation = async () => {
    if (!newEducation.degree || !newEducation.institution) {
      setError('Please fill degree and institution');
      return;
    }
    
    try {
      const response = await api.post(`/users/${currentUser.id}/education`, newEducation);
      setFormData(prev => ({ ...prev, education: [...prev.education, response.data.education] }));
      setNewEducation({ degree: '', institution: '', year: '', description: '', percentage: '' });
      setShowEducationForm(false);
      setSuccess('Education added!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to add education');
    }
  };

  const handleRemoveEducation = async (educationId) => {
    try {
      await api.delete(`/users/${currentUser.id}/education/${educationId}`);
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter(e => e.id !== educationId)
      }));
      setSuccess('Education removed');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to remove education');
    }
  };

  const handleAddExperience = async () => {
    if (!newExperience.title || !newExperience.company) {
      setError('Please fill title and company');
      return;
    }
    
    try {
      const response = await api.post(`/users/${currentUser.id}/experience`, newExperience);
      setFormData(prev => ({ ...prev, experience: [...prev.experience, response.data.experience] }));
      setNewExperience({ title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' });
      setShowExperienceForm(false);
      setSuccess('Experience added!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to add experience');
    }
  };

  const handleRemoveExperience = async (experienceId) => {
    try {
      await api.delete(`/users/${currentUser.id}/experience/${experienceId}`);
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter(e => e.id !== experienceId)
      }));
      setSuccess('Experience removed');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to remove experience');
    }
  };

  const handleAddCertificate = async () => {
    if (!newCertificate.name || !newCertificate.issuer) {
      setError('Please fill certificate name and issuer');
      return;
    }
    
    try {
      const response = await api.post(`/users/${currentUser.id}/certifications`, newCertificate);
      setFormData(prev => ({ ...prev, certifications: [...prev.certifications, response.data] }));
      setNewCertificate({ name: '', issuer: '', date: '', credentialId: '', url: '' });
      setShowCertificateForm(false);
      setSuccess('Certificate added!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to add certificate');
    }
  };

  const handleRemoveCertificate = async (certId) => {
    try {
      await api.delete(`/users/${currentUser.id}/certifications/${certId}`);
      setFormData(prev => ({
        ...prev,
        certifications: prev.certifications.filter(c => c.id !== certId)
      }));
      setSuccess('Certificate removed');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to remove certificate');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper to get full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8081${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and career details</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Photo & Quick Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-8">
              {/* Profile Photo */}
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {profile?.profilePicture ? (
                    <img 
                      src={getImageUrl(profile.profilePicture)}
                      alt={formData.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<svg class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                        }
                      }}
                    />
                  ) : (
                    <User className="h-16 w-16 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-1/3 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{formData.fullName}</h2>
                {formData.headline && (
                  <p className="text-gray-600 mt-1">{formData.headline}</p>
                )}
                {formData.location && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {formData.location}
                  </p>
                )}
                {formData.age > 0 && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center justify-center">
                    <Cake className="h-4 w-4 mr-1" />
                    {formData.age} years old
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-3" />
                  <span>{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3" />
                    <span>{formData.phone}</span>
                  </div>
                )}
                {formData.dateOfBirth && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-3" />
                    <span>Born: {formatDate(formData.dateOfBirth)}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-3" />
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      Website
                    </a>
                  </div>
                )}
                {formData.linkedin && (
                  <div className="flex items-center text-gray-600">
                    <Linkedin className="h-4 w-4 mr-3" />
                    <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn
                    </a>
                  </div>
                )}
                {formData.github && (
                  <div className="flex items-center text-gray-600">
                    <Github className="h-4 w-4 mr-3" />
                    <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      GitHub
                    </a>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {saving ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                About Me
              </h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself, your career goals, and what drives you..."
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap">
                  {formData.bio || "No bio added yet. Click 'Edit Profile' to add your personal story."}
                </p>
              )}
            </div>

            {/* Personal Details Section */}
            {isEditing && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleDateOfBirthChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    {formData.age > 0 && <p className="text-sm text-green-600 mt-1">Age: {formData.age} years</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Country" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline</label>
                    <input type="text" name="headline" value={formData.headline} onChange={handleInputChange} placeholder="e.g., Senior Software Engineer" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input type="url" name="website" value={formData.website} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input type="url" name="linkedin" value={formData.linkedin} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                    <input type="url" name="github" value={formData.github} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
              </div>
            )}

            {/* Skills Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Code className="h-5 w-5 text-blue-600 mr-2" />
                  Technical Skills
                </h3>
                {!showSkillForm && isEditing && (
                  <button onClick={() => setShowSkillForm(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <Plus className="h-4 w-4 mr-1" /> Add Skill
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.skills && formData.skills.map((skill, index) => (
                  <span key={skill.id || index} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                    {skill.name || skill.skillName || skill}
                    {isEditing && (
                      <button onClick={() => handleRemoveSkill(skill.id)} className="ml-2 text-blue-600 hover:text-blue-800">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {(!formData.skills || formData.skills.length === 0) && (
                  <p className="text-gray-500 text-sm">No skills added yet.</p>
                )}
              </div>
              {showSkillForm && isEditing && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex space-x-2">
                    <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Enter a skill" className="flex-1 border border-gray-300 rounded-lg px-3 py-2" />
                    <button onClick={handleAddSkill} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
                    <button onClick={() => { setShowSkillForm(false); setNewSkill(''); }} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Work Experience Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Briefcase className="h-5 w-5 text-green-600 mr-2" />
                  Work Experience
                </h3>
                {!showExperienceForm && isEditing && (
                  <button onClick={() => setShowExperienceForm(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <Plus className="h-4 w-4 mr-1" /> Add Experience
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {formData.experience && formData.experience.map((exp, index) => (
                  <div key={exp.id || index} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{exp.title}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                        {exp.location && <p className="text-sm text-gray-500 flex items-center mt-1"><MapPin className="h-3 w-3 mr-1" />{exp.location}</p>}
                        <p className="text-sm text-gray-500 mt-1">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                        {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                      </div>
                      {isEditing && (
                        <button onClick={() => handleRemoveExperience(exp.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!formData.experience || formData.experience.length === 0) && (
                  <p className="text-gray-500 text-sm">No work experience added yet.</p>
                )}
              </div>
              {showExperienceForm && isEditing && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <input type="text" placeholder="Job Title *" value={newExperience.title} onChange={(e) => setNewExperience({...newExperience, title: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Company *" value={newExperience.company} onChange={(e) => setNewExperience({...newExperience, company: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Location" value={newExperience.location} onChange={(e) => setNewExperience({...newExperience, location: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="month" placeholder="Start Date" value={newExperience.startDate} onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})} className="border border-gray-300 rounded-lg px-3 py-2" />
                    {!newExperience.current && <input type="month" placeholder="End Date" value={newExperience.endDate} onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})} className="border border-gray-300 rounded-lg px-3 py-2" />}
                  </div>
                  <label className="flex items-center"><input type="checkbox" checked={newExperience.current} onChange={(e) => setNewExperience({...newExperience, current: e.target.checked})} className="mr-2" /><span className="text-sm text-gray-700">I currently work here</span></label>
                  <textarea placeholder="Description" value={newExperience.description} onChange={(e) => setNewExperience({...newExperience, description: e.target.value})} rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <div className="flex space-x-2">
                    <button onClick={handleAddExperience} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
                    <button onClick={() => { setShowExperienceForm(false); setNewExperience({ title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }); }} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="h-5 w-5 text-purple-600 mr-2" />
                  Education
                </h3>
                {!showEducationForm && isEditing && (
                  <button onClick={() => setShowEducationForm(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <Plus className="h-4 w-4 mr-1" /> Add Education
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {formData.education && formData.education.map((edu, index) => (
                  <div key={edu.id || index} className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.year && <p className="text-sm text-gray-500">Class of {edu.year}</p>}
                        {edu.percentage && <p className="text-sm text-gray-500">Percentage: {edu.percentage}%</p>}
                        {edu.description && <p className="text-sm text-gray-600 mt-1">{edu.description}</p>}
                      </div>
                      {isEditing && (
                        <button onClick={() => handleRemoveEducation(edu.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!formData.education || formData.education.length === 0) && (
                  <p className="text-gray-500 text-sm">No education added yet.</p>
                )}
              </div>
              {showEducationForm && isEditing && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <input type="text" placeholder="Degree *" value={newEducation.degree} onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Institution *" value={newEducation.institution} onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="number" placeholder="Year of Graduation" value={newEducation.year} onChange={(e) => setNewEducation({...newEducation, year: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="number" placeholder="Percentage/CGPA" value={newEducation.percentage} onChange={(e) => setNewEducation({...newEducation, percentage: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <textarea placeholder="Description" value={newEducation.description} onChange={(e) => setNewEducation({...newEducation, description: e.target.value})} rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <div className="flex space-x-2">
                    <button onClick={handleAddEducation} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
                    <button onClick={() => { setShowEducationForm(false); setNewEducation({ degree: '', institution: '', year: '', description: '', percentage: '' }); }} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Award className="h-5 w-5 text-yellow-600 mr-2" />
                  Certifications
                </h3>
                {!showCertificateForm && isEditing && (
                  <button onClick={() => setShowCertificateForm(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <Plus className="h-4 w-4 mr-1" /> Add Certification
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {formData.certifications && formData.certifications.map((cert, index) => (
                  <div key={cert.id || index} className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{cert.name}</h4>
                        <p className="text-gray-600 text-sm">{cert.issuer}</p>
                        {cert.date && <p className="text-xs text-gray-500">Issued: {cert.date}</p>}
                        {cert.credentialId && <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>}
                        {cert.url && (
                          <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center mt-1">
                            View Certificate <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                      {isEditing && (
                        <button onClick={() => handleRemoveCertificate(cert.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!formData.certifications || formData.certifications.length === 0) && (
                  <p className="text-gray-500 text-sm">No certifications added yet.</p>
                )}
              </div>
              {showCertificateForm && isEditing && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <input type="text" placeholder="Certificate Name *" value={newCertificate.name} onChange={(e) => setNewCertificate({...newCertificate, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Issuing Organization *" value={newCertificate.issuer} onChange={(e) => setNewCertificate({...newCertificate, issuer: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="month" placeholder="Issue Date" value={newCertificate.date} onChange={(e) => setNewCertificate({...newCertificate, date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Credential ID" value={newCertificate.credentialId} onChange={(e) => setNewCertificate({...newCertificate, credentialId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <input type="url" placeholder="Certificate URL" value={newCertificate.url} onChange={(e) => setNewCertificate({...newCertificate, url: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  <div className="flex space-x-2">
                    <button onClick={handleAddCertificate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
                    <button onClick={() => { setShowCertificateForm(false); setNewCertificate({ name: '', issuer: '', date: '', credentialId: '', url: '' }); }} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;