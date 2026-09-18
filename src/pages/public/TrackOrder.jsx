import API from '../../api/axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../../components/common/SEO';

const timelineSteps = [
  { key: 'pending', label: 'Order Placed', icon: '\uD83D\uDCCB' },
  { key: 'confirmed', label: 'Confirmed', icon: '\u2705' },
  { key: 'processing', label: 'Processing', icon: '\u2699\uFE0F' },
  { key: 'shipped', label: 'Shipped', icon: '\uD83D\uDE9A' },
  { key: 'delivered', label: 'Delivered', icon: '\uD83D\uDCE6' },
];

const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const initialId = searchParams.get('orderId');
    if (initialId) {
      setOrderId(initialId);
      handleTrack(initialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrack = async (id) => {
    const trackingId = id || orderId;
    if (!trackingId.trim()) {
      toast.error('Please enter an Order ID');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setOrder(null);
      const { data } = await API.get(`/orders/track/${trackingId.trim()}`);
      setOrder(data.order || data);
      setSearchParams({ orderId: trackingId.trim() });
    } catch (err) {
      setOrder(null);
      toast.error(
        err.response?.data?.message || 'Order not found. Please check the ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTrack();
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getTimelineIndex = (status) => {
    const idx = statusOrder.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
      <SEO
        title="Track Your Order"
        description="Track your Softy order status and delivery progress using your order ID."
        noIndex
      />
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-display text-3xl font-bold text-charcoal sm:text-4xl">
            Track Your Order
          </h1>
          <p className="text-charcoal/50">
            Enter your Order ID to see the latest status and shipping details.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g. 6651a2b3c4d5e6f7)"
              className="w-full rounded-md border border-line bg-white py-3.5 pl-12 pr-4 font-mono text-charcoal placeholder-charcoal/30 transition-colors focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-oxblood px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-oxblood-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Tracking...
              </span>
            ) : (
              'Track Order'
            )}
          </button>
        </form>

        {/* Results */}
        {loading && (
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-charcoal/5" />
            <div className="h-32 animate-pulse rounded-xl bg-charcoal/5" />
          </div>
        )}

        {!loading && searched && !order && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white py-16 text-center">
            <svg
              className="mb-4 h-16 w-16 text-charcoal/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-charcoal">
              Order Not Found
            </h2>
            <p className="text-charcoal/50">
              We couldn't find an order with that ID. Please double-check and try
              again.
            </p>
          </div>
        )}

        {!loading && order && (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                    Order ID
                  </p>
                  <p className="font-mono text-lg font-bold text-charcoal">
                    #{order._id?.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                    Placed On
                  </p>
                  <p className="text-sm text-charcoal/70">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-line pt-4">
                <span className="text-sm text-charcoal/50">Status:</span>
                <span className="rounded-full bg-oxblood/10 px-3 py-1 text-xs font-semibold text-oxblood capitalize">
                  {order.status}
                </span>
                {order.total && (
                  <span className="ml-auto font-display text-xl font-bold text-charcoal">
                    BDT {order.total?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="rounded-2xl border border-line bg-white p-6">
              <h3 className="mb-6 font-display text-lg font-bold text-charcoal">
                Order Timeline
              </h3>
              <div className="relative">
                {timelineSteps.map((step, idx) => {
                  const currentIdx = getTimelineIndex(order.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={step.key}
                      className="relative flex items-start gap-4 pb-8 last:pb-0"
                    >
                      {/* Vertical Line */}
                      {idx < timelineSteps.length - 1 && (
                        <div
                          className={`absolute left-5 top-10 h-full w-0.5 ${
                            isCompleted && idx < currentIdx
                              ? 'bg-oxblood'
                              : 'bg-charcoal/10'
                          }`}
                        />
                      )}

                      {/* Dot */}
                      <div
                        className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg ${
                          isCurrent
                            ? 'bg-oxblood text-white shadow-lg shadow-oxblood/30'
                            : isCompleted
                            ? 'bg-oxblood/10 text-oxblood'
                            : 'bg-charcoal/5 text-charcoal/30'
                        }`}
                      >
                        {isCompleted ? '\u2713' : step.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p
                          className={`font-medium ${
                            isCurrent
                              ? 'text-charcoal'
                              : isCompleted
                              ? 'text-charcoal/70'
                              : 'text-charcoal/30'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="mt-0.5 text-sm text-charcoal/50">
                            Current status
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="mb-4 font-display text-lg font-bold text-charcoal">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 rounded-lg bg-ivory/50 p-3"
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-charcoal">{item.name}</p>
                        <p className="text-sm text-charcoal/50">
                          Qty: {item.quantity} &middot; BDT 
                          {item.price?.toLocaleString()}
                        </p>
                      </div>
                      <span className="font-semibold text-charcoal">
                        BDT {(item.price * item.quantity)?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Info */}
            {order.shippingAddress && (
              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="mb-3 font-display text-lg font-bold text-charcoal">
                  Shipping Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                      Name
                    </p>
                    <p className="text-sm text-charcoal/70">
                      {order.shippingAddress.name}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                      Phone
                    </p>
                    <p className="text-sm text-charcoal/70">
                      {order.shippingAddress.phone}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                      Address
                    </p>
                    <p className="text-sm text-charcoal/70">
                      {order.shippingAddress.address}
                      <br />
                      {order.shippingAddress.city},{' '}
                      {order.shippingAddress.district}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
