import API from '../../api/axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import SEO from '../../components/common/SEO';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  processing: 'bg-violet-100 text-violet-800',
  shipped: 'bg-oxblood/10 text-oxblood',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-slate-100 text-slate-600',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get('/orders/my');
      setOrders(data.orders || data || []);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to load your orders. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError(null);
      setOrders([]);
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Not logged in — show login prompt
  if (!user) {
    return (
      <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
        <SEO
          title="My Orders"
          description="Sign in to view your Softy order history and delivery status."
          noIndex
        />
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 font-display text-3xl font-bold text-charcoal sm:text-4xl">
            My Orders
          </h1>
          <EmptyState
            title="Please log in to view your orders"
            description="You need to be signed in to see your order history."
            actionLabel="Log In"
            actionLink="/login?redirect=/my-orders"
          />
        </div>
      </section>
    );
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr || 'Unknown date';
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
      <SEO
        title="My Orders"
        description="View your Softy order history, shipping details, and order status."
        noIndex
      />
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-display text-3xl font-bold text-charcoal sm:text-4xl">
          My Orders
        </h1>

        {loading ? (
          <LoadingSpinner size="lg" text="Loading your orders..." />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={fetchOrders} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="You haven't placed any orders yet"
            description="When you place an order, it will appear here. Start shopping to place your first order!"
            actionLabel="Start Shopping"
            actionLink="/shop"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="overflow-hidden rounded-xl border border-line bg-white"
              >
                {/* Order Header */}
                <button
                  onClick={() => toggleExpand(order._id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-ivory"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-mono text-sm font-semibold text-charcoal">
                      #{order._id?.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-sm text-charcoal/50">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColors[order.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="font-display text-lg font-bold text-charcoal">
                      BDT {order.total?.toLocaleString()}
                    </span>
                    <svg
                      className={`h-5 w-5 text-charcoal/40 transition-transform ${
                        expandedOrder === order._id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Detail */}
                {expandedOrder === order._id && (
                  <div className="border-t border-line bg-ivory/50 px-6 py-5">
                    {/* Items */}
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-charcoal/50">
                      Items
                    </h3>
                    <div className="mb-4 space-y-3">
                      {order.items?.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 rounded-lg bg-white p-3"
                          >
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name || 'Product'}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-charcoal">
                                {item.name || 'Product'}
                              </p>
                              <p className="text-sm text-charcoal/50">
                                Qty: {item.quantity || item.qty || 0} &middot; BDT{' '}
                                {(item.price || 0)?.toLocaleString()}
                              </p>
                            </div>
                            <span className="font-semibold text-charcoal">
                              BDT{' '}
                              {(
                                (item.price || 0) * (item.quantity || item.qty || 0)
                              )?.toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-charcoal/50">
                          No item details available
                        </p>
                      )}
                    </div>

                    {/* Shipping Info */}
                    {order.shippingAddress && (
                      <div className="mb-4 rounded-lg bg-white p-4">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-charcoal/50">
                          Shipping Address
                        </h3>
                        <p className="text-sm text-charcoal/70">
                          {order.shippingAddress.name}
                          <br />
                          {order.shippingAddress.address}
                          <br />
                          {order.shippingAddress.city}
                          {order.shippingAddress.district &&
                            `, ${order.shippingAddress.district}`}
                          <br />
                          Phone: {order.shippingAddress.phone}
                        </p>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="flex items-center justify-between border-t border-line pt-3">
                      <Link
                        to={`/track-order?orderId=${encodeURIComponent(order.orderId || order.orderNumber || order._id)}`}
                        className="text-sm font-semibold text-oxblood underline-offset-2 hover:underline"
                      >
                        View Full Details
                      </Link>
                      <div className="text-right">
                        <p className="text-xs text-charcoal/50">
                          Total ({order.items?.length || 0} items)
                        </p>
                        <p className="font-display text-xl font-bold text-charcoal">
                          BDT {order.total?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
