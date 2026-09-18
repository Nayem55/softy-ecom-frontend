import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAdminAuth, adminAPI } from './AdminLayout';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const ALL_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColor = (s) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return map[s] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const statusDot = (s) => {
  const map = {
    pending: 'bg-amber-500',
    confirmed: 'bg-blue-500',
    processing: 'bg-indigo-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-emerald-500',
    cancelled: 'bg-rose-500',
  };
  return map[s] || 'bg-gray-400';
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatPrice = (n) => `BDT ${Number(n || 0).toLocaleString('en-BD')}`;

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAdminAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.get(`/admin/orders/${id}`);
      setOrder(res.data.order || res.data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
      if (err.response?.status === 404) {
        setError('Order not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await adminAPI.put(`/admin/orders/${id}/status`, { status: newStatus });
      setOrder((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Order status updated to "${newStatus}"`);
      setConfirmStatus(null);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusClick = (newStatus) => {
    if (order.status === newStatus) return;
    setConfirmStatus(newStatus);
  };

  const confirmAndUpdate = () => {
    if (confirmStatus) {
      updateStatus(confirmStatus);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await adminAPI.delete(`/admin/orders/${id}`);
      toast.success('Order deleted successfully');
      navigate('/admin/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner size="lg" text="Loading order details..." />
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-6">
        <ErrorDisplay message={error} onRetry={fetchOrder} />
        <div className="text-center">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <ErrorDisplay message="Order not found" />
        <div className="text-center">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const customerName = order.user?.name || order.shippingAddress?.name || order.customerName || 'Guest';
  const phone = order.user?.phone || order.shippingAddress?.phone || order.phone || '-';
  const email = order.user?.email || order.email || '-';
  const address = order.shippingAddress || order.address || {};
  const addressLine = [address.street || address.address, address.city, address.district, address.division, address.zip || address.postalCode].filter(Boolean).join(', ') || '-';
  const bkashTransactionId = order.bkashTransactionId || order.bkashTrxId || order.transactionId || '';
  const items = order.items || order.orderItems || [];
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const paymentMethod = order.paymentMethod || 'Cash on Delivery';
  const isManualPayment = paymentMethod.toLowerCase().includes('bkash') || paymentMethod.toLowerCase().includes('manual');
  const isPaid = order.paymentStatus === 'paid';
  const needsPaymentReview = isManualPayment && !!bkashTransactionId && !isPaid;

  return (
    <div className="space-y-6">
      <InstructionBox
        title="Order Management"
        items={['View and manage this order. Update the status as it progresses.']}
        type="info"
      />

      <PageHeader
        title={`Order #${(order._id?.slice(-8)?.toUpperCase() || order.orderNumber || '').toUpperCase()}`}
        subtitle={`Placed on ${formatDate(order.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Orders
            </Link>
          </div>
        }
      />

      {(isPaid || needsPaymentReview) && (
        <div
          className={`rounded-xl border p-4 ${
            isPaid
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">
                {isPaid ? 'Payment Marked as Paid' : 'Manual Payment Submitted'}
              </p>
              <p className="mt-1 text-sm">
                {isPaid
                  ? 'This order is marked paid. Verify fulfillment status before shipping.'
                  : 'Customer submitted a manual payment. Check the transaction ID before confirming payment.'}
              </p>
            </div>
            {bkashTransactionId && (
              <div className="rounded-md bg-white/70 px-3 py-2 text-left sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Transaction ID</p>
                <p className="mt-0.5 font-mono text-sm font-bold">{bkashTransactionId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmStatus(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-amber-500 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Status Change</h3>
              <p className="text-sm text-gray-600 mb-1">
                Change order status from <strong className="capitalize">{order.status}</strong> to <strong className="capitalize">{confirmStatus}</strong>?
              </p>
              <p className="text-xs text-gray-400 mb-6">This action will be recorded in the order history.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmStatus(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndUpdate}
                  disabled={updating}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  {updating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-rose-500 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Order?</h3>
              <p className="text-sm text-gray-600 mb-6">This action cannot be undone. The order will be permanently removed.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Order items + timeline (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          {!isCancelled && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Order Timeline</h2>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
                <div
                  className="absolute top-4 left-4 h-0.5 origin-left bg-rose-500 transition-transform duration-500"
                  style={{ transform: `scaleX(${currentIdx >= 0 ? currentIdx / (STATUS_FLOW.length - 1) : 0})`, right: '1rem' }}
                />
                {STATUS_FLOW.map((s, idx) => {
                  const reached = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={s} className="relative z-10 flex flex-col items-center">
                      <div className="rounded-full bg-white p-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          reached ? `${statusDot(s)} text-white` : 'bg-gray-200 text-gray-500'
                        } ${isCurrent ? 'ring-4 ring-rose-100' : ''}`}>
                          {reached ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] mt-2 font-medium capitalize ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
              <svg className="w-10 h-10 mx-auto text-rose-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="font-bold text-rose-700">Order Cancelled</p>
              <p className="text-sm text-rose-500 mt-1">This order has been cancelled</p>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Order Items ({items.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {item.image || item.product?.images?.[0] ? (
                      <img src={item.image || item.product?.images?.[0]} alt={item.name || item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name || item.product?.name || 'Product'}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {item.color && <span>Color: {item.color}</span>}
                      <span>Qty: {item.quantity || item.qty || 1}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                    {(item.quantity || item.qty || 1) > 1 && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatPrice(item.price * (item.quantity || item.qty || 1))} total</p>
                    )}
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          {/* Quick Status Update */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Update Status</h2>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.map((s) => {
                const isCurrent = order.status === s;
                const isCancel = s === 'cancelled';
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusClick(s)}
                    disabled={updating || isCurrent}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all border ${
                      isCurrent
                        ? `${statusColor(s)} border-current`
                        : isCancel
                        ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isCurrent && (
                      <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {s}
                  </button>
                );
              })}
            </div>
            {updating && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                Updating...
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Shipping Address</p>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{addressLine}</p>
              </div>
              {address.note && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Order Note</p>
                  <p className="text-sm text-gray-600 mt-0.5 italic">"{address.note}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Price Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(order.subtotal || order.itemsTotal)}</span>
              </div>
              {(order.discount > 0 || order.couponDiscount > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span className="font-medium text-emerald-600">-{formatPrice(order.discount || order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Charge</span>
                <span className="font-medium text-gray-900">{formatPrice(order.deliveryCharge || order.shippingCost || 0)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(order.total || order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Payment Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Method</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">{order.paymentMethod || 'Cash on Delivery'}</p>
              </div>
              {order.paymentMethod?.toLowerCase().includes('bkash') && bkashTransactionId && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">bKash Transaction ID</p>
                  <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">{bkashTransactionId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Payment Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.paymentStatus || 'pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
