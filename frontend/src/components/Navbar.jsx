// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Briefcase, Upload, Home, User, LogOut, Building, BarChart3, 
  Calendar, UserCircle, LayoutDashboard, ChevronDown, GraduationCap
} from 'lucide-react';
import authService from '../services/auth';

const isAdmin = (user) => user && user.role === 'ROLE_ADMIN';

const Navbar = ({ onAuthChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    authService.logout();
    if (onAuthChange) onAuthChange(null);
    navigate('/');
  };

  // Regular user nav items
  const userNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/internships', icon: GraduationCap, label: 'Internships' },
    { path: '/upload', icon: Upload, label: 'Upload Resume' },
  ];

  // Admin nav items
  const adminNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/admin/dashboard', icon: BarChart3, label: 'Admin Dashboard' },
  ];

  // Recruiter nav items
  const recruiterNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/recruiter/dashboard', icon: Building, label: 'Recruiter Dashboard' },
    { path: '/recruiter/interviews', icon: Calendar, label: 'Interview Management' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/internships', icon: GraduationCap, label: 'Internships' },
  ];

  // Determine which nav items to show based on user role
  const navItems = isAdmin(currentUser) ? adminNavItems : 
                  currentUser?.role === 'ROLE_RECRUITER' ? recruiterNavItems : userNavItems;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">DreamRole</span>
          </div>
          
          {currentUser ? (
            <div className="flex items-center space-x-8">
              {/* Navigation Links - Desktop */}
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  <UserCircle className="h-8 w-8 text-gray-600" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">{currentUser.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {currentUser.role === 'ROLE_RECRUITER' ? 'Recruiter' : 
                       currentUser.role === 'ROLE_ADMIN' ? 'Admin' : 'Job Seeker'}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{currentUser.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                    
                    {/* Menu Items */}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3 text-gray-500" />
                      My Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-3 text-gray-500" />
                      Dashboard
                    </Link>
                    <Link
                      to="/jobs"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Briefcase className="h-4 w-4 mr-3 text-gray-500" />
                      Jobs
                    </Link>
                    <Link
                      to="/internships"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <GraduationCap className="h-4 w-4 mr-3 text-gray-500" />
                      Internships
                    </Link>
                    
                    {currentUser.role === 'ROLE_RECRUITER' && (
                      <Link
                        to="/recruiter/interviews"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                        Interview Management
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <div className="flex space-x-2">
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  to="/recruiter/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Building className="h-4 w-4 mr-1" />
                  Recruiter
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;