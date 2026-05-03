// frontend/src/components/InternshipRatingModal.jsx
import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import internshipAPI from '../services/internshipService';

const InternshipRatingModal = ({ internship, userRating, onClose, onSuccess }) => {
  const [rating, setRating] = useState(userRating?.rating || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await internshipAPI.rateInternship(internship.id, currentUser.id, {
        rating: rating,
        comment: comment
      });
      onSuccess();
    } catch (error) {
      console.error('Error rating internship:', error);
      setError(error.response?.data?.error || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const currentRating = hoverRating || rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`p-1 transition-transform hover:scale-110 ${
            i <= currentRating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <Star className="h-8 w-8" fill={i <= currentRating ? 'currentColor' : 'none'} />
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Rate This Internship</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 text-lg">{internship.title}</h3>
          <p className="text-gray-600">{internship.company}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <div className="flex justify-center space-x-2 mb-2" onMouseLeave={() => setHoverRating(0)}>
              {renderStars()}
            </div>
            <p className="text-lg font-semibold text-gray-700">
              {hoverRating ? `${hoverRating} stars` : rating ? `${rating} stars` : 'Select Rating'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Share your thoughts about this internship... (optional)"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || rating === 0} className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : (userRating ? 'Update Rating' : 'Submit Rating')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternshipRatingModal;