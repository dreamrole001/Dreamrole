// src/components/InternshipEligibilityCheck.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, User, GraduationCap, 
  Briefcase, DollarSign, Users, Shield, Calendar, Loader,
  ChevronRight, FileText, Award, Building, Mail, Phone,
  AlertTriangle, BookOpen, Clock, TrendingUp, IndianRupee,
  Home, School, BookMarked, Target, Sparkles, MapPin,
  Globe, Heart, Zap, Star, CreditCard, Activity, Server,
  HelpCircle, ThumbsUp, ThumbsDown, Info, ArrowRight, ArrowLeft,
  RefreshCw, Save, ExternalLink, CheckSquare, Square
} from 'lucide-react';
import api from '../services/api';

const InternshipEligibilityCheck = ({ internship, onEligibilityPassed, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [eligibilityStatus, setEligibilityStatus] = useState({});
  const [manualAnswers, setManualAnswers] = useState({
    notEmployed: null,
    notFullTimeEducation: null,
    notFromPremiumInstitute: null,
    notHigherDegree: null,
    notPreviousTraining: null,
    notCurrentTraining: null,
    familyIncomeBelow8Lakhs: null,
    familyIncomeAmount: '',
    noGovernmentEmployee: null
  });
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [error, setError] = useState('');
  const [allChecked, setAllChecked] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile data
      const response = await api.get(`/users/${currentUser.id}/profile`);
      const userData = response.data;
      
      console.log('Full profile data:', userData);
      
      // Calculate age
      let age = null;
      let ageEligible = false;
      if (userData.dateOfBirth) {
        age = calculateAge(userData.dateOfBirth);
        ageEligible = age >= 21 && age <= 24;
      }
      
      // Extract education from userData.education array
      let educationLevel = '';
      let institutionName = '';
      let hasHigherDegree = false;
      let educationEligible = false;
      
      // Get education from userData.education array
      if (userData.education && Array.isArray(userData.education) && userData.education.length > 0) {
        console.log('Education array found:', userData.education);
        
        // Sort education by year (most recent first)
        const sortedEducation = [...userData.education].sort((a, b) => {
          if (a.year && b.year) return parseInt(b.year) - parseInt(a.year);
          return 0;
        });
        
        // Get the highest degree
        let highestDegree = '';
        let highestDegreeLevel = 0;
        
        for (const edu of sortedEducation) {
          const degree = edu.degree || '';
          const degreeLower = degree.toLowerCase();
          
          // Assign level to each degree type
          let level = 0;
          if (degreeLower.includes('phd') || degreeLower.includes('doctorate')) level = 5;
          else if (degreeLower.includes('master') || degreeLower.includes('mba') || degreeLower.includes('m.tech') || 
                   degreeLower.includes('m.sc') || degreeLower.includes('m.com') || degreeLower.includes('m.a')) level = 4;
          else if (degreeLower.includes('bachelor') || degreeLower.includes('b.tech') || degreeLower.includes('b.e') ||
                   degreeLower.includes('b.sc') || degreeLower.includes('b.a') || degreeLower.includes('b.com') ||
                   degreeLower.includes('bca') || degreeLower.includes('bba')) level = 3;
          else if (degreeLower.includes('diploma') || degreeLower.includes('polytechnic')) level = 2;
          else if (degreeLower.includes('higher secondary') || degreeLower.includes('12th') || degreeLower.includes('hsc')) level = 1;
          else if (degreeLower.includes('high school') || degreeLower.includes('10th') || degreeLower.includes('ssc')) level = 0;
          
          if (level > highestDegreeLevel) {
            highestDegreeLevel = level;
            highestDegree = degree;
            institutionName = edu.institution || '';
          }
          
          if (!highestDegree && degree) {
            highestDegree = degree;
            institutionName = edu.institution || '';
          }
        }
        
        educationLevel = highestDegree || (userData.education[0]?.degree || '');
        if (!institutionName) institutionName = userData.education[0]?.institution || '';
        
        console.log('Extracted education:', { educationLevel, institutionName, highestDegreeLevel });
      }
      
      // If no education found, try other fields
      if (!educationLevel) {
        if (userData.educationLevel) educationLevel = userData.educationLevel;
        else if (userData.qualification) educationLevel = userData.qualification;
        else if (userData.highestQualification) educationLevel = userData.highestQualification;
        else if (userData.degree) educationLevel = userData.degree;
      }
      
      // Check if the degree is a higher degree
      const educationLower = educationLevel.toLowerCase();
      
      const higherDegreeKeywords = [
        'master', 'mba', 'm.tech', 'm.e', 'm.sc', 'm.a', 'm.com', 'msc', 'ma',
        'phd', 'doctorate', 'doctoral',
        'ca', 'chartered accountant', 'cma', 'cs', 'company secretary',
        'mbbs', 'doctor', 'medical', 'bds', 'dental', 'llb', 'law',
        'pg', 'post graduate', 'postgraduate', 'pgdm', 'pgpm'
      ];
      
      hasHigherDegree = higherDegreeKeywords.some(keyword => 
        educationLower.includes(keyword)
      );
      
      if (educationLower.includes('master')) {
        hasHigherDegree = true;
      }
      
      // Check if education is eligible
      const eligibleKeywords = [
        'high school', 'higher secondary', 'secondary', 'intermediate', 'ssc', 'hsc',
        'diploma', 'polytechnic', 'iti',
        'bachelor', 'b.sc', 'b.a', 'b.com', 'bca', 'bba', 'b.pharma', 'b.tech', 'b.e',
        'graduate', 'graduation', 'undergraduate'
      ];
      
      if (hasHigherDegree) {
        educationEligible = false;
      } else {
        educationEligible = eligibleKeywords.some(keyword => 
          educationLower.includes(keyword)
        );
      }
      
      // Check premium institution
      const premiumInstitutions = [
        'iit', 'indian institute of technology', 'iim', 'indian institute of management',
        'national law university', 'nlu', 'iiser', 'nid', 'national institute of design', 'iiit',
        'bits', 'bits pilani', 'isb', 'xlri', 'fms', 'jmc'
      ];
      
      const institutionLower = institutionName.toLowerCase();
      const isFromPremium = premiumInstitutions.some(inst => institutionLower.includes(inst));
      
      console.log('========== EDUCATION DEBUG ==========');
      console.log('Raw education value:', educationLevel);
      console.log('Institution name:', institutionName);
      console.log('Has higher degree:', hasHigherDegree);
      console.log('Education eligible:', educationEligible);
      console.log('Is from premium:', isFromPremium);
      console.log('=====================================');
      
      setUserProfile({
        fullName: userData.fullName || currentUser?.fullName,
        email: userData.email || currentUser?.email,
        phone: userData.phone,
        age: age,
        ageEligible: ageEligible,
        educationLevel: educationLevel || 'Not specified',
        educationEligible: educationEligible,
        institutionName: institutionName || 'Not specified',
        isFromPremium: isFromPremium,
        hasHigherDegree: hasHigherDegree,
        dateOfBirth: userData.dateOfBirth
      });
      
      // Set initial eligibility status
      setEligibilityStatus({
        age: { 
          passed: ageEligible, 
          message: ageEligible ? `Age: ${age} years - Eligible` : `Age: ${age} years - Must be 21-24 years` 
        },
        education: { 
          passed: educationEligible, 
          message: educationEligible 
            ? `Education: ${educationLevel || 'Not specified'} - Eligible` 
            : hasHigherDegree 
              ? `Education: ${educationLevel || 'Not specified'} - Has higher degree - Not eligible`
              : `Education: ${educationLevel || 'Not specified'} - Not eligible`
        },
        nationality: { passed: true, message: 'Indian National - Eligible' },
        premiumInstitution: { 
          passed: !isFromPremium, 
          message: isFromPremium ? 'From premium institution - Not eligible' : 'Not from premium institution - Eligible' 
        },
        higherDegree: { 
          passed: !hasHigherDegree, 
          message: hasHigherDegree ? `Has higher degree (${educationLevel}) - Not eligible` : 'No higher degree - Eligible' 
        }
      });
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please ensure your profile is complete.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAnswer = (field, value, passValue = null) => {
    setManualAnswers(prev => ({
      ...prev,
      [field]: passValue !== null ? passValue : value
    }));
    
    let passed = false;
    let message = '';
    
    switch(field) {
      case 'notEmployed':
        passed = value === true;
        message = passed ? 'Not employed - Eligible' : 'Employed full-time - Not eligible';
        break;
      case 'notFullTimeEducation':
        passed = value === true;
        message = passed ? 'Not in full-time education - Eligible' : 'In full-time education - Not eligible';
        break;
      case 'notFromPremiumInstitute':
        passed = value === true;
        message = passed ? 'Not from premium institution - Eligible' : 'From premium institution - Not eligible';
        break;
      case 'notHigherDegree':
        passed = value === true;
        message = passed ? 'No higher degree - Eligible' : 'Has higher degree - Not eligible';
        break;
      case 'notPreviousTraining':
        passed = value === true;
        message = passed ? 'No previous training - Eligible' : 'Has previous training - Not eligible';
        break;
      case 'notCurrentTraining':
        passed = value === true;
        message = passed ? 'No current training - Eligible' : 'Has current training - Not eligible';
        break;
      case 'familyIncomeBelow8Lakhs':
        passed = value === true;
        const amount = manualAnswers.familyIncomeAmount;
        message = passed ? `Income: ₹${parseInt(amount).toLocaleString()} - Below ₹8L - Eligible` : 'Income above ₹8L - Not eligible';
        break;
      case 'noGovernmentEmployee':
        passed = value === true;
        message = passed ? 'No government employee in family - Eligible' : 'Government employee in family - Not eligible';
        break;
      default:
        break;
    }
    
    setEligibilityStatus(prev => ({
      ...prev,
      [field]: { passed, message }
    }));
  };

  const handleIncomeAmount = (amount) => {
    const numAmount = parseInt(amount) || 0;
    const isBelow8Lakhs = numAmount < 800000;
    setManualAnswers(prev => ({
      ...prev,
      familyIncomeAmount: amount,
      familyIncomeBelow8Lakhs: isBelow8Lakhs
    }));
    
    setEligibilityStatus(prev => ({
      ...prev,
      familyIncomeBelow8Lakhs: { 
        passed: isBelow8Lakhs, 
        message: isBelow8Lakhs ? `Income: ₹${numAmount.toLocaleString()} - Below ₹8L - Eligible` : `Income: ₹${numAmount.toLocaleString()} - Above ₹8L - Not eligible`
      }
    }));
  };

  const handleSelectAll = () => {
    const newValue = !allChecked;
    setAllChecked(newValue);
    
    setManualAnswers({
      notEmployed: newValue,
      notFullTimeEducation: newValue,
      notFromPremiumInstitute: newValue,
      notHigherDegree: newValue,
      notPreviousTraining: newValue,
      notCurrentTraining: newValue,
      familyIncomeBelow8Lakhs: newValue,
      familyIncomeAmount: newValue ? '500000' : '',
      noGovernmentEmployee: newValue
    });
    
    const updates = {};
    Object.keys(manualAnswers).forEach(key => {
      if (key !== 'familyIncomeAmount') {
        updates[key] = { 
          passed: newValue, 
          message: newValue ? `${getFieldName(key)} - Eligible` : `${getFieldName(key)} - Not eligible`
        };
      }
    });
    updates.familyIncomeBelow8Lakhs = { 
      passed: newValue, 
      message: newValue ? 'Income: ₹5,00,000 - Below ₹8L - Eligible' : 'Income not provided - Not eligible'
    };
    setEligibilityStatus(prev => ({ ...prev, ...updates }));
  };

  const getFieldName = (field) => {
    const names = {
      notEmployed: 'Employment status',
      notFullTimeEducation: 'Education status',
      notFromPremiumInstitute: 'Institution type',
      notHigherDegree: 'Degree type',
      notPreviousTraining: 'Previous training',
      notCurrentTraining: 'Current training',
      familyIncomeBelow8Lakhs: 'Family income',
      noGovernmentEmployee: 'Government employee status'
    };
    return names[field] || field;
  };

  const checkOverallEligibility = () => {
    const allCriteria = [
      eligibilityStatus.age?.passed,
      eligibilityStatus.education?.passed,
      eligibilityStatus.nationality?.passed,
      eligibilityStatus.premiumInstitution?.passed,
      eligibilityStatus.higherDegree?.passed,
      eligibilityStatus.notEmployed?.passed,
      eligibilityStatus.notFullTimeEducation?.passed,
      eligibilityStatus.notFromPremiumInstitute?.passed,
      eligibilityStatus.notHigherDegree?.passed,
      eligibilityStatus.notPreviousTraining?.passed,
      eligibilityStatus.notCurrentTraining?.passed,
      eligibilityStatus.familyIncomeBelow8Lakhs?.passed,
      eligibilityStatus.noGovernmentEmployee?.passed
    ];
    
    return allCriteria.every(criteria => criteria === true);
  };

  const handleContinue = () => {
    if (!checkOverallEligibility()) {
      setError('You do not meet all eligibility criteria. Please review your answers.');
      return;
    }
    
    if (!declarationAccepted) {
      setError('Please accept the declaration to proceed');
      return;
    }
    
    onEligibilityPassed();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="text-center py-12">
            <Loader className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  const isOverallEligible = checkOverallEligibility();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-5xl shadow-xl rounded-xl bg-white max-h-[90vh] overflow-y-auto">
        
        {/* Header - DreamRole Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-3 shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            DreamRole Internship Program
          </h2>
          <p className="text-gray-500 mt-1">Eligibility Verification</p>
          <p className="text-sm text-purple-600 mt-1">Complete your profile to unlock opportunities</p>
        </div>

        {/* Internship Card - DreamRole Styling */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 mb-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">{internship.title}</h3>
              <p className="text-purple-100">{internship.company}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-sm">
              <Clock className="h-3 w-3 inline mr-1" />
              {internship.duration || '6 months'}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            <span className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <Award className="h-3 w-3 mr-1" />
              Stipend: ₹{internship.stipend || '10,000'}/month
            </span>
            <span className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <Briefcase className="h-3 w-3 mr-1" />
              {internship.type || 'Full-time'}
            </span>
            <span className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <MapPin className="h-3 w-3 mr-1" />
              {internship.location || 'Remote/India'}
            </span>
          </div>
        </div>

        {/* Overall Eligibility Banner - DreamRole Colors */}
        <div className={`rounded-xl p-4 mb-6 ${isOverallEligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isOverallEligible ? (
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
              )}
              <div>
                <h3 className={`font-bold text-lg ${isOverallEligible ? 'text-green-800' : 'text-red-800'}`}>
                  {isOverallEligible ? 'You are Eligible!' : 'Not Eligible'}
                </h3>
                <p className={`text-sm ${isOverallEligible ? 'text-green-600' : 'text-red-600'}`}>
                  {isOverallEligible 
                    ? 'Congratulations! You meet all the eligibility criteria for this internship.' 
                    : 'Please review the criteria below. You must meet all requirements to proceed.'}
                </p>
              </div>
            </div>
            {isOverallEligible && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Ready to Apply
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Left Column - Auto-fetched from Profile */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Profile Information (Auto-detected)</h3>
            </div>
            
            {/* User Info Card */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{userProfile?.fullName}</p>
                  <p className="text-xs text-gray-500">{userProfile?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{userProfile?.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="font-medium">{userProfile?.dateOfBirth || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            {/* Auto-validated Criteria */}
            <div className="space-y-3">
              {/* Age Check */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${eligibilityStatus.age?.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  <Calendar className={`h-5 w-5 mr-3 ${eligibilityStatus.age?.passed ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="font-medium text-gray-800">Age Requirement</p>
                    <p className="text-xs text-gray-500">Must be between 21-24 years</p>
                  </div>
                </div>
                <div className="text-right">
                  {eligibilityStatus.age?.passed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Eligible</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Not Eligible</span>
                    </div>
                  )}
                  <p className="text-xs mt-1">{eligibilityStatus.age?.message}</p>
                </div>
              </div>
              
              {/* Nationality Check */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-3 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-800">Nationality</p>
                    <p className="text-xs text-gray-500">Must be Indian citizen</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Eligible</span>
                  </div>
                  <p className="text-xs mt-1 text-green-600">Indian National - Eligible</p>
                </div>
              </div>
              
              {/* Education Check */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${eligibilityStatus.education?.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  <GraduationCap className={`h-5 w-5 mr-3 ${eligibilityStatus.education?.passed ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="font-medium text-gray-800">Educational Qualification</p>
                    <p className="text-xs text-gray-500">High School to Bachelor's degree</p>
                  </div>
                </div>
                <div className="text-right">
                  {eligibilityStatus.education?.passed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Eligible</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Not Eligible</span>
                    </div>
                  )}
                  <p className="text-xs mt-1">{eligibilityStatus.education?.message}</p>
                </div>
              </div>
              
              {/* Premium Institution Check */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${eligibilityStatus.premiumInstitution?.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  <Building className={`h-5 w-5 mr-3 ${eligibilityStatus.premiumInstitution?.passed ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="font-medium text-gray-800">Institution Type</p>
                    <p className="text-xs text-gray-500">Not from premium institute</p>
                  </div>
                </div>
                <div className="text-right">
                  {eligibilityStatus.premiumInstitution?.passed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Eligible</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Not Eligible</span>
                    </div>
                  )}
                  <p className="text-xs mt-1">{eligibilityStatus.premiumInstitution?.message}</p>
                </div>
              </div>
              
              {/* Higher Degree Check */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${eligibilityStatus.higherDegree?.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  <BookOpen className={`h-5 w-5 mr-3 ${eligibilityStatus.higherDegree?.passed ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="font-medium text-gray-800">Degree Type</p>
                    <p className="text-xs text-gray-500">No Master's or Higher Degree</p>
                  </div>
                </div>
                <div className="text-right">
                  {eligibilityStatus.higherDegree?.passed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Eligible</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Not Eligible</span>
                    </div>
                  )}
                  <p className="text-xs mt-1">{eligibilityStatus.higherDegree?.message}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Manual Selection */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Additional Information (Please Confirm)</h3>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
              >
                {allChecked ? <Square className="h-4 w-4 mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
                {allChecked ? 'Deselect All' : 'Select All (If all are Yes)'}
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Employment Status */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Employment Status</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('notEmployed', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notEmployed === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Not Employed
                  </button>
                  <button
                    onClick={() => handleManualAnswer('notEmployed', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notEmployed === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ Employed
                  </button>
                </div>
                {eligibilityStatus.notEmployed && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.notEmployed.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.notEmployed.message}
                  </p>
                )}
              </div>
              
              {/* Education Status */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <School className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Education Status</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('notFullTimeEducation', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notFullTimeEducation === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Not in Full-time Education
                  </button>
                  <button
                    onClick={() => handleManualAnswer('notFullTimeEducation', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notFullTimeEducation === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ In Full-time Education
                  </button>
                </div>
                {eligibilityStatus.notFullTimeEducation && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.notFullTimeEducation.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.notFullTimeEducation.message}
                  </p>
                )}
              </div>
              
              {/* Premium Institution (Manual confirmation) */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Not from Premium Institute</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('notFromPremiumInstitute', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notFromPremiumInstitute === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Yes, Confirm
                  </button>
                  <button
                    onClick={() => handleManualAnswer('notFromPremiumInstitute', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notFromPremiumInstitute === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ No, I am from Premium Institute
                  </button>
                </div>
                {eligibilityStatus.notFromPremiumInstitute && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.notFromPremiumInstitute.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.notFromPremiumInstitute.message}
                  </p>
                )}
              </div>
              
              {/* Higher Degree */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">No Master's or Higher Degree</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('notHigherDegree', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notHigherDegree === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Yes, Confirm
                  </button>
                  <button
                    onClick={() => handleManualAnswer('notHigherDegree', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notHigherDegree === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ No, I have Higher Degree
                  </button>
                </div>
                {eligibilityStatus.notHigherDegree && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.notHigherDegree.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.notHigherDegree.message}
                  </p>
                )}
              </div>
              
              {/* Previous Training */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">No previous internship training</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('notPreviousTraining', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notPreviousTraining === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Yes, Confirm
                  </button>
                  <button
                    onClick={() => handleManualAnswer('notPreviousTraining', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notPreviousTraining === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ No, I have previous training
                  </button>
                </div>
                {eligibilityStatus.notPreviousTraining && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.notPreviousTraining.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.notPreviousTraining.message}
                  </p>
                )}
              </div>
              
              {/* Current Training */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">No ongoing training</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('notCurrentTraining', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notCurrentTraining === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Yes, Confirm
                  </button>
                  <button
                    onClick={() => handleManualAnswer('notCurrentTraining', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.notCurrentTraining === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ No, I have ongoing training
                  </button>
                </div>
                {eligibilityStatus.notCurrentTraining && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.notCurrentTraining.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.notCurrentTraining.message}
                  </p>
                )}
              </div>
              
              {/* Family Income */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Family Income (Annual)</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={manualAnswers.familyIncomeAmount}
                    onChange={(e) => handleIncomeAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="Enter amount in rupees"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('familyIncomeBelow8Lakhs', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.familyIncomeBelow8Lakhs === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Below ₹8,00,000
                  </button>
                  <button
                    onClick={() => handleManualAnswer('familyIncomeBelow8Lakhs', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.familyIncomeBelow8Lakhs === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ ₹8,00,000 or Above
                  </button>
                </div>
                {eligibilityStatus.familyIncomeBelow8Lakhs && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.familyIncomeBelow8Lakhs.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.familyIncomeBelow8Lakhs.message}
                  </p>
                )}
              </div>
              
              {/* Government Employee in Family */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">No government employee in family</span>
                  </div>
                  <span className="text-xs text-gray-400">Required</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleManualAnswer('noGovernmentEmployee', true, true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.noGovernmentEmployee === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Yes, Confirm
                  </button>
                  <button
                    onClick={() => handleManualAnswer('noGovernmentEmployee', false, false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      manualAnswers.noGovernmentEmployee === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ No, family member is government employee
                  </button>
                </div>
                {eligibilityStatus.noGovernmentEmployee && (
                  <p className={`text-xs mt-2 ${eligibilityStatus.noGovernmentEmployee.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityStatus.noGovernmentEmployee.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Declaration Section */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Declaration & Undertaking
          </h3>
          
          <div className="bg-white rounded-lg p-4 mb-4 max-h-32 overflow-y-auto text-sm border border-gray-200">
            <p className="text-gray-700">
              I hereby declare that all the information provided by me is true and correct to the best of my knowledge. 
              I understand that providing false information will lead to immediate disqualification from the DreamRole 
              Internship Program. I confirm that I meet all the eligibility criteria for this internship opportunity.
            </p>
          </div>
          
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">
              I hereby confirm that all the information provided is true and correct to the best of my knowledge.
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!declarationAccepted || !isOverallEligible}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
          >
            Continue to Application
            <ChevronRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternshipEligibilityCheck;