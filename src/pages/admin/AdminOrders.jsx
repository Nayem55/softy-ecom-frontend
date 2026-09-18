import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth, adminAPI } from './AdminLayout';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColor = (s) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
  };
  return map[s] || 'bg-gray-100 text-gray-700';
};

const statusLegend = [
  { status: 'pending', label: 'Pending', color: 'bg-amber-400' },
  { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-400' },
  { status: 'processing', label: 'Processing', color: 'bg-indigo-400' },
  { status: 'shipped', label: 'Shipped', color: 'bg-purple-400' },
  { status: 'delivered', label: 'Delivered', color: 'bg-emerald-400' },
  { status: 'cancelled', label: 'Cancelled', color: 'bg-rose-400' },
];

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatPrice = (n) => `BDT ${Number(n || 0).toLocaleString('en-BD')}`;

const getPaymentInfo = (order) => {
  const paymentMethod = order.paymentMethod || 'Cash on Delivery';
  const method = paymentMethod.toLowerCase();
  const transactionId = order.bkashTransactionId || order.bkashTrxId || order.transactionId || '';
  const isManualPayment = method.includes('bkash') || method.includes('manual');
  const isPaid = order.paymentStatus === 'paid';
  const needsReview = isManualPayment && !!transactionId && !isPaid;

  return { paymentMethod, isManualPayment, isPaid, needsReview };
};

const AdminOrders = () => {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const perPage = 15;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: currentPage, limit: perPage });
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      const res = await adminAPI.get(`/admin/orders?${params}`);
      setOrders(res.data.orders || res.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalOrders(res.data.total || res.data.totalOrders || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleTabChange = (key) => {
    setStatusFilter(key);
    setCurrentPage(1);
  };

  const handleQuickStatus = async (orderId, newStatus) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    const oldStatus = order.status;
    try {
      setUpdatingId(orderId);
      await adminAPI.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o)));
      toast.success(`Order status updated from "${oldStatus}" to "${newStatus}"`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const hasActiveFilters = search || statusFilter;

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      await adminAPI.delete(`/admin/orders/${deleteConfirm}`);
      setOrders((prev) => prev.filter((o) => o._id !== deleteConfirm));
      setTotalOrders((prev) => prev - 1);
      toast.success('Order deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-rose-500 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Order?</h3>
              <p className="text-sm text-gray-600 mb-6">This action cannot be undone. The order will be permanently removed.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <InstructionBox
        title="Orders Management"
        items={['Manage customer orders. Update order status as they progress through fulfillment.']}
        type="info"
      />

      <PageHeader
        title="Orders"
        subtitle={`${totalOrders} total orders`}
      />

      {/* Status Color Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Legend</span>
        {statusLegend.map((s) => (
          <div key={s.status} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-xs text-gray-600 capitalize">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by order ID, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-rose-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner size="lg" text="Loading orders..." />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={fetchOrders} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            }
            title={hasActiveFilters ? 'No orders match your search' : 'No orders yet'}
            description={hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Orders will appear here once customers start purchasing'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Order ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Phone</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Items</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Payment</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden xl:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const customerName = order.user?.name || order.shippingAddress?.name || order.customerName || 'Guest';
                    const phone = order.user?.phone || order.shippingAddress?.phone || order.phone || '-';
                    const itemCount = order.items?.length || order.orderItems?.length || 0;
                    const lastUpdate = order.updatedAt || order.statusChangedAt || order.createdAt;
                    const payment = getPaymentInfo(order);
                    return (
                      <tr
                        key={order._id}
                        className={`transition-colors hover:bg-gray-50 ${payment.isPaid || payment.needsReview ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <Link to={`/admin/orders/${order._id}`} className="font-mono text-rose-600 hover:text-rose-700 font-medium">
                            #{order._id?.slice(-8)?.toUpperCase() || order.orderNumber || '-'}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{customerName}</p>
                          <p className="text-xs text-gray-400 md:hidden">{phone}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-600">{phone}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {itemCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900">{formatPrice(order.total || order.totalAmount)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {payment.isManualPayment ? (
                            <span className="inline-flex w-fit rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                              Bkash Payment
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-600 capitalize">{payment.paymentMethod}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(order.status)}`}
                            title={`Last updated: ${formatDateTime(lastUpdate)}`}
                          >
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-gray-500 text-xs">{formatDate(order.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => handleQuickStatus(order._id, e.target.value)}
                              disabled={updatingId === order._id}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                            <Link
                              to={`/admin/orders/${order._id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm(order._id)}
                              disabled={updatingId === order._id}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Order"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                    .reduce((acc, page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((page, idx) =>
                      page === '...' ? (
                        <span key={`e-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page ? 'bg-rose-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
