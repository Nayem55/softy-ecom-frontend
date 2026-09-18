import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- Fetch subscribers ---- */
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.get('/admin/newsletter');
      setSubscribers(res.data.subscribers || res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch newsletter subscribers:', err);
      setError(err.response?.data?.message || 'Failed to load subscribers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  /* ---- Export as CSV ---- */
  const exportCSV = () => {
    if (subscribers.length === 0) return;

    const headers = ['Email', 'Subscribed Date'];
    const rows = subscribers.map((s) => [
      s.email || '',
      s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-BD') : '',
    ]);

    const csvContent =
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${subscribers.length} subscribers to CSV.`);
  };

  /* ---- Helpers ---- */
  const formatDate = (d) => {
    if (!d) return '---';
    return new Date(d).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        subtitle={
          loading
            ? 'Loading subscribers...'
            : `${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''} — View and export newsletter subscribers`
        }
        actions={
          <div className="flex items-center gap-3">
            {!loading && subscribers.length > 0 && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-oxblood/10 text-oxblood text-sm font-semibold">
                {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={exportCSV}
              disabled={loading || subscribers.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          </div>
        }
      />

      <InstructionBox
        title="About Subscribers"
        items={[
          'Emails are collected from the subscribe form on the storefront.',
          'You can export all subscriber emails as a CSV file for use in email marketing campaigns.',
          'The CSV includes email addresses and subscription dates.',
        ]}
      />

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchSubscribers} />}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading subscribers..." />
      ) : !error && subscribers.length === 0 ? (
        <EmptyState
          title="No subscribers yet"
          description="Newsletter signups from the storefront subscribe form will appear here."
        />
      ) : !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscribers.map((s, idx) => (
                  <tr key={s._id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-oxblood/10 flex items-center justify-center text-oxblood text-sm font-bold shrink-0">
                          {(s.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{s.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(s.createdAt || s.subscribedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
