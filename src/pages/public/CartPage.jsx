import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import SEO from '../../components/common/SEO';

const DEFAULT_SHIPPING_SETTINGS = {
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  freeShippingEnabled: true,
  freeShippingMin: 3000,
};

export default function CartPage() {
  const { cart, updateCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    API.get('/settings')
      .then((r) => setSettings(r.data.settings || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      setItems([]);
      setLoading(false);
      setFetchError(null);
      return;
    }
    const fetchItems = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const results = await Promise.allSettled(
          cart.items.map(async (ci) => {
            if (ci.productData) {
              return ci;
            }
            try {
              const res = await API.get(`/products/${ci.product}`);
              return { ...ci, productData: res.data.product || res.data };
            } catch (err) {
              return {
                ...ci,
                productData: null,
                loadStatus: err.response?.status || 0,
              };
            }
          })
        );

        const loaded = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        const valid = loaded.filter((item) => item.productData);
        const failed = loaded.filter((item) => !item.productData);
        const hasServerProblem = failed.some((item) => item.loadStatus && item.loadStatus !== 404);

        if (hasServerProblem && valid.length === 0) {
          setFetchError('Could not load product details. Please try again.');
          setItems([]);
          return;
        }

        if (failed.length > 0) {
          await updateCart(
            valid.map((i) => ({
              product: i.product,
              productData: i.productData,
                color: i.color,
              qty: i.qty,
            }))
          );
          if (valid.length > 0) {
            toast.error('Some unavailable items were removed from your cart.');
          }
        }
        setItems(valid);
      } catch (err) {
        setFetchError(err.message || 'Failed to load cart items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [cart.items]);

  const getItemPrice = (item) => {
    return item.productData?.price || 0;
  };

  const subtotal = items.reduce((sum, i) => sum + getItemPrice(i) * i.qty, 0);
  const shippingSettings = { ...DEFAULT_SHIPPING_SETTINGS, ...(settings.shippingSettings || {}) };
  const qualifiesForFreeShipping = shippingSettings.freeShippingEnabled !== false && subtotal >= Number(shippingSettings.freeShippingMin || 0);
  const estimatedDeliveryCharge = qualifiesForFreeShipping ? 0 : Number(shippingSettings.insideDhakaCharge || 0);
  const total = Math.max(0, subtotal - discount + estimatedDeliveryCharge);

  const handleQtyChange = async (idx, newQty) => {
    if (newQty < 1) return;
    const updated = items.map((item, i) =>
      i === idx ? { ...item, qty: newQty } : item
    );
    setItems(updated);
    setOperationLoading(true);
    try {
      await updateCart(
        updated.map((i) => ({
          product: i.product,
          productData: i.productData,
            color: i.color,
          qty: i.qty,
        }))
      );
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update quantity. Please try again.';
      toast.error(msg);
      // Revert on failure
      setItems(items);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleRemove = async (product) => {
    setOperationLoading(true);
    try {
      await removeFromCart(product);
      toast.success('Item removed from cart');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to remove item. Please try again.';
      toast.error(msg);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCoupon = async () => {
    if (!coupon.trim()) {
      setCouponMsg('Please enter a coupon code');
      setDiscount(0);
      return;
    }
    try {
      const res = await API.get(`/coupons/validate/${coupon.trim()}`);
      const c = res.data.coupon || res.data;
      if (!c) {
        throw new Error('Coupon not found');
      }
      const disc =
        c.discountType === 'percentage'
          ? (subtotal * c.discountValue) / 100
          : c.discountValue;
      const finalDisc = Math.min(disc, subtotal);
      setDiscount(finalDisc);
      setCouponMsg(
        `Coupon "${c.code}" applied! You save BDT ${finalDisc.toLocaleString()}`
      );
      toast.success(`Coupon "${c.code}" applied!`);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Invalid or expired coupon code. Please check and try again.';
      setDiscount(0);
      setCouponMsg(msg);
      toast.error(msg);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20">
        <LoadingSpinner size="lg" text="Loading your cart..." />
      </div>
    );
  }

  // Fetch error state
  if (fetchError) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20">
        <ErrorDisplay
          message={fetchError}
          onRetry={() => {
            setFetchError(null);
            setLoading(true);
            // Re-trigger fetch by simulating a cart.items change
            if (cart.items && cart.items.length > 0) {
              const fetchItems = async () => {
                try {
                  const results = await Promise.allSettled(
                    cart.items.map(async (ci) => {
                      if (ci.productData) return ci;
                      const res = await API.get(`/products/${ci.product}`);
                      return { ...ci, productData: res.data.product || res.data };
                    })
                  );
                  const valid = results
                    .filter((r) => r.status === 'fulfilled' && r.value.productData)
                    .map((r) => r.value);
                  setItems(valid);
                  setFetchError(null);
                } catch (err) {
                  setFetchError(err.message || 'Failed to load cart items');
                } finally {
                  setLoading(false);
                }
              };
              fetchItems();
            } else {
              setLoading(false);
            }
          }}
        />
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20">
        <EmptyState
          title="Your Cart is Empty"
          description="Looks like you haven't added anything yet. Start shopping to fill it up!"
          actionLabel="Continue Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-12">
      <SEO
        title="Shopping Cart"
        description="Review your selected Softy items before checkout."
        noIndex
      />
      <h1 className="font-serif text-3xl mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {operationLoading && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 rounded mb-2">
              Updating cart...
            </div>
          )}
          {items.map((item, idx) => (
            <div
              key={item.product}
              className="flex gap-4 sm:gap-6 bg-white p-4 sm:p-5 border border-line rounded"
            >
              <Link
                to={`/product/${item.productData?.slug || item.product}`}
                className="w-24 h-32 sm:w-28 sm:h-36 bg-blush rounded overflow-hidden flex-shrink-0"
              >
                {item.productData?.images?.[0] && (
                  <img
                    src={item.productData.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <Link
                    to={`/product/${item.productData?.slug || item.product}`}
                    className="text-sm sm:text-base font-semibold truncate hover:text-oxblood-dark"
                  >
                    {item.productData?.name || 'Product unavailable'}
                  </Link>
                  <button
                    onClick={() => handleRemove(item.product)}
                    disabled={operationLoading}
                    className="text-charcoal/40 hover:text-oxblood text-lg flex-shrink-0 disabled:opacity-30"
                    aria-label="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {item.color && (
                  <div className="text-xs text-charcoal/60 mt-1">
                    Color: {item.color}
                  </div>
                )}
                <div className="text-oxblood-dark font-semibold mt-2">
                  BDT {getItemPrice(item).toLocaleString()}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-line rounded">
                    <button
                      onClick={() => handleQtyChange(idx, item.qty - 1)}
                      disabled={operationLoading}
                      className="w-8 h-8 flex items-center justify-center text-charcoal/60 hover:text-charcoal disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(idx, item.qty + 1)}
                      disabled={operationLoading}
                      className="w-8 h-8 flex items-center justify-center text-charcoal/60 hover:text-charcoal disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold">
                    BDT {(getItemPrice(item) * item.qty).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white border border-line rounded p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-5">Order Summary</h3>
            <div className="space-y-3 text-sm border-b border-line pb-4 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  {estimatedDeliveryCharge === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `From BDT ${estimatedDeliveryCharge.toLocaleString()}`
                  )}
                </span>
              </div>
              <p className="text-xs text-charcoal/50">
                Final delivery charge is calculated by district at checkout.
              </p>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-BDT {discount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span className="text-oxblood-dark">
                BDT {total.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value);
                  if (couponMsg) {
                    setCouponMsg('');
                    setDiscount(0);
                  }
                }}
                placeholder="Coupon code"
                className="flex-1 border border-line px-3 py-2.5 text-sm rounded"
              />
              <button
                onClick={handleCoupon}
                className="bg-charcoal text-white px-4 py-2.5 text-xs uppercase tracking-wider rounded hover:bg-oxblood-dark transition-colors"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p
                className={`text-xs mb-4 ${
                  discount > 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {couponMsg}
              </p>
            )}
            {qualifiesForFreeShipping && (
              <p className="text-xs text-green-600 mb-4">
                You qualify for free delivery!
              </p>
            )}
            <button
              onClick={() => navigate('/checkout')}
              disabled={operationLoading}
              className="w-full bg-oxblood text-white py-3.5 text-xs tracking-[0.16em] uppercase hover:bg-oxblood-dark transition-colors disabled:opacity-50"
            >
              Proceed to Checkout
            </button>
            <Link
              to="/shop"
              className="block text-center text-xs text-charcoal/60 mt-3 hover:text-oxblood-dark"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
