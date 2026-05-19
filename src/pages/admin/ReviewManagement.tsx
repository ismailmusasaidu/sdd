import { useEffect, useState } from 'react';
import { Check, X, Trash2, AlertCircle, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  provider_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  provider_profiles?: {
    full_name: string;
  };
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [newReview, setNewReview] = useState({
    provider_id: '',
    customer_name: '',
    rating: 5,
    comment: ''
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchProviders();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('provider_reviews')
        .select('*, provider_profiles(full_name)');

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('id, full_name')
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const updateReviewStatus = async (reviewId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('provider_reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error('Error updating review:', err);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('provider_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReview.provider_id) {
      alert('Please select a provider');
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_reviews')
        .insert([{
          provider_id: newReview.provider_id,
          customer_name: newReview.customer_name,
          rating: newReview.rating,
          comment: newReview.comment,
          status: 'approved'
        }]);

      if (error) throw error;

      setNewReview({
        provider_id: '',
        customer_name: '',
        rating: 5,
        comment: ''
      });
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      console.error('Error adding review:', err);
      alert('Failed to add review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-gray-600">Manage and approve provider reviews</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
        >
          {showForm ? 'Cancel' : 'Add Review'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Review</h2>
          <form onSubmit={addReview} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Provider</label>
              <select
                value={newReview.provider_id}
                onChange={(e) => setNewReview({ ...newReview, provider_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="">Select a provider</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Customer Name</label>
              <input
                type="text"
                value={newReview.customer_name}
                onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })}
                placeholder="Customer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Rating</label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{r} Stars</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Comment</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Review comment"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
                rows={4}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Add Review
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{reviews.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{review.customer_name}</p>
                    <p className="text-sm text-gray-600">
                      Provider: {review.provider_profiles?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <div className="flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                    {review.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'rejected')}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
