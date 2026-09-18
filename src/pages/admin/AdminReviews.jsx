import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (d) => {
  if (!d) return '---';
  return new Date(d).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-xs text-gray-500 ml-1">({rating})</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
const ConfirmDelete = ({ productName, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4" onClick={onCancel}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <p className="text-gray-600 mb-1 text-center">Are you sure you want to delete this review?</p>
      <p className="font-semibold text-gray-900 mb-6 text-center text-sm">&quot;{productName}&quot;</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold tracking-wider uppercase transition-colors">Delete</button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | approved | pending
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---- Fetch reviews ---- */
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.get('/admin/reviews');
      setReviews(res.data.reviews || res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err.response?.data?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* ---- Handlers ---- */
  const handleApprove = async (review) => {
    try {
      await adminAPI.put(`/admin/reviews/${review._id}`, { isApproved: true });
      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, isApproved: true } : r))
      );
      toast.success('Review approved and visible on the product page.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve review.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/admin/reviews/${deleteTarget._id}`);
      toast.success('Review deleted.');
      setDeleteTarget(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  /* ---- Filtered list ---- */
  const filteredReviews = reviews.filter((r) => {
    if (filter === 'approved') return r.isApproved;
    if (filter === 'pending') return !r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  /* ---- Helpers ---- */
  const getProductName = (review) => {
    if (review.product?.name) return review.product.name;
    if (typeof review.product === 'string') return review.product;
    return 'Unknown Product';
  };

  const getUserName = (review) => {
    if (review.user?.name) return review.user.name;
    if (review.user?.email) return review.user.email;
    if (typeof review.user === 'string') return review.user;
    return 'Anonymous';
  };

  const getEmptyStateContent = () => {
    if (filter === 'all') {
      return {
        title: 'No reviews yet',
        description: 'Customer product reviews will appear here once submitted from the storefront.',
      };
    }
    return {
      title: 'No pending reviews',
      description: 'All customer reviews have been reviewed and approved.',
    };
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle={
          loading
            ? 'Loading reviews...'
            : `${reviews.length} total review${reviews.length !== 1 ? 's' : ''} (${pendingCount} pending, ${approvedCount} approved)`
        }
      />

      <InstructionBox
        title="About Reviews"
        items={[
          'Moderate customer product reviews before they appear on the storefront.',
          'Pending reviews require your approval before becoming visible on the product detail page.',
          'Approved reviews help build trust and encourage other customers to purchase.',
          'You can delete spam or inappropriate reviews at any time.',
        ]}
      />

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchReviews} />}

      {/* Filter tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all' ? 'bg-oxblood text-ivory' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'approved' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Approved ({approvedCount})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading reviews..." />
      ) : !error && filteredReviews.length === 0 ? (
        <EmptyState {...getEmptyStateContent()} />
      ) : !error && (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className={`bg-white rounded-xl border p-5 transition-colors ${
                review.isApproved ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {/* User avatar */}
                    <div className="w-9 h-9 rounded-full bg-oxblood/10 flex items-center justify-center text-oxblood text-sm font-bold shrink-0">
                      {getUserName(review).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{getUserName(review)}</p>
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      review.isApproved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  {/* Product */}
                  <p className="text-xs text-gray-500 mb-2">
                    <span className="font-medium">Product:</span>{' '}
                    <span className="text-gray-700">{getProductName(review)}</span>
                  </p>

                  {/* Stars */}
                  <div className="mb-2">
                    <StarRating rating={review.rating || 0} />
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {review.comment}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                      title="Approve"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(review)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-medium rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDelete
          productName={getProductName(deleteTarget)}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
