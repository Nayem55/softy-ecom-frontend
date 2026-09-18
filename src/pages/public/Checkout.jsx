import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import SEO from '../../components/common/SEO';

const BD_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
  'Chattogram', 'Chuadanga', 'Coxs Bazar', 'Cumilla', 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni',
  'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokathi', 'Jhenaidah',
  'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur',
  'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj',
  'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona',
  'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari',
  'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj',
  'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon',
];

const DEFAULT_SHIPPING_SETTINGS = {
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  freeShippingEnabled: true,
  freeShippingMin: 3000,
};

export default function Checkout() {
  const { cart, clearCart, updateCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    district: '',
    city: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    API.get('/settings')
      .then((r) => setSettings(r.data.settings || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const loadItems = useCallback(async () => {
    if (!cart.items || cart.items.length === 0) {
      setItems([]);
      setLoading(false);
      setFetchError(null);
      return;
    }
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
        setFetchError('Could not load product details. Please refresh and try again.');
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
  }, [cart.items]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const getItemPrice = (item) => {
    return item.productData?.price || 0;
  };

  const subtotal = items.reduce(
    (sum, i) => sum + getItemPrice(i) * i.qty,
    0
  );
  const shippingSettings = { ...DEFAULT_SHIPPING_SETTINGS, ...(settings.shippingSettings || {}) };
  const qualifiesForFreeShipping = shippingSettings.freeShippingEnabled !== false && subtotal >= Number(shippingSettings.freeShippingMin || 0);
  const districtIsDhaka = form.district.toLowerCase() === 'dhaka';
  const districtCharge = districtIsDhaka ? Number(shippingSettings.insideDhakaCharge || 0) : Number(shippingSettings.outsideDhakaCharge || 0);
  const deliveryCharge = qualifiesForFreeShipping ? 0 : districtCharge;
  const total = subtotal + deliveryCharge;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^(\+?\d{1,3}[-.\s]?)?\d{7,15}$/.test(form.phone.trim()))
      errors.phone = 'Please enter a valid phone number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Please enter a valid email address';
    if (!form.address.trim()) errors.address = 'Shipping address is required';
    if (!form.district) errors.district = 'Please select your district';
    if (paymentMethod === 'bkash' && !bkashTrxId.trim())
      errors.bkashTrxId = 'Please enter your bKash transaction ID';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Check if cart became empty during checkout
    if (!items || items.length === 0) {
      toast.error('Your cart is empty. Please add items before placing an order.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        product: i.product,
        color: i.color,
        qty: i.qty,
      }));

      const res = await API.post('/orders', {
        items: orderItems,
        shippingInfo: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: `${form.address.trim()}, ${form.city.trim()}, ${form.district}`.replace(/,\s*,/g, ',').replace(/,\s*$/, ''),
          district: form.district,
          city: form.city.trim(),
          notes: form.notes.trim(),
        },
        paymentMethod,
        bkashTrxId: bkashTrxId.trim() || undefined,
        userId: user?._id,
      });

      toast.success('Order placed successfully!');
      await clearCart();
      navigate(`/track-order?orderId=${res.data.order?.orderId || res.data.order?._id}`);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to place your order. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
      // Scroll to top to show the error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20">
        <LoadingSpinner size="lg" text="Preparing checkout..." />
      </div>
    );
  }

  // Fetch error
  if (fetchError) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20">
        <ErrorDisplay message={fetchError} onRetry={loadItems} />
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20">
        <EmptyState
          title="Your cart is empty"
          description="Add some items to your cart before checking out."
          actionLabel="Shop Now"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-12">
      <SEO
        title="Checkout"
        description="Complete your Softy order with delivery across Bangladesh and cash on delivery or bKash manual payment."
        noIndex
      />
      <h1 className="font-serif text-3xl mb-8">Checkout</h1>

      {/* Submit error banner */}
      {submitError && (
        <div className="mb-6">
          <ErrorDisplay
            message={submitError}
            onRetry={handleSubmit}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <div className="bg-white border border-line rounded p-6">
            <h3 className="font-semibold text-lg mb-5">
              Shipping Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  Full Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full border px-4 py-3 text-sm focus:outline-none ${
                    formErrors.name
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-line focus:border-oxblood'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  Phone *
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={`w-full border px-4 py-3 text-sm focus:outline-none ${
                    formErrors.phone
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-line focus:border-oxblood'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full border px-4 py-3 text-sm focus:outline-none ${
                    formErrors.email
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-line focus:border-oxblood'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full border px-4 py-3 text-sm focus:outline-none resize-none ${
                    formErrors.address
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-line focus:border-oxblood'
                  }`}
                />
                {formErrors.address && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  District *
                </label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className={`w-full border px-4 py-3 text-sm focus:outline-none bg-white ${
                    formErrors.district
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-line focus:border-oxblood'
                  }`}
                >
                  <option value="">Select district</option>
                  {BD_DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {formErrors.district && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.district}</p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  Area / City
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Banani, Mirpur, Sadar"
                  className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  Order Notes
                </label>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-line rounded p-6">
            <h3 className="font-semibold text-lg mb-5">Payment Method</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-oxblood bg-oxblood/5'
                    : 'border-line hover:border-charcoal/30'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-oxblood"
                />
                <div>
                  <div className="text-sm font-semibold">
                    Cash on Delivery (COD)
                  </div>
                  <div className="text-xs text-charcoal/60">
                    Pay when you receive your order
                  </div>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${
                  paymentMethod === 'bkash'
                    ? 'border-oxblood bg-oxblood/5'
                    : 'border-line hover:border-charcoal/30'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bkash"
                  checked={paymentMethod === 'bkash'}
                  onChange={() => setPaymentMethod('bkash')}
                  className="accent-oxblood"
                />
                <div>
                  <div className="text-sm font-semibold">
                    bKash Manual Payment
                  </div>
                  <div className="text-xs text-charcoal/60">
                    Send money and provide transaction ID
                  </div>
                </div>
              </label>
            </div>
            {paymentMethod === 'bkash' && (
              <div className="mt-4 p-4 bg-blush/50 rounded">
                <p className="text-xs text-charcoal/70 mb-3">
                  Send <strong>BDT {total.toLocaleString()}</strong> to bKash
                  number:{' '}
                  <strong>{settings.bkashNumber || '01XXXXXXXXX'}</strong>
                </p>
                <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">
                  bKash Transaction ID *
                </label>
                <input
                  value={bkashTrxId}
                  onChange={(e) => {
                    setBkashTrxId(e.target.value);
                    if (formErrors.bkashTrxId) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.bkashTrxId;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Enter transaction ID"
                  className={`w-full border px-4 py-3 text-sm focus:outline-none ${
                    formErrors.bkashTrxId
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-line focus:border-oxblood'
                  }`}
                />
                {formErrors.bkashTrxId && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.bkashTrxId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-line rounded p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-5">Order Summary</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((i) => (
                <div key={i.product} className="flex gap-3 text-sm">
                  <div className="w-14 h-16 bg-blush rounded overflow-hidden flex-shrink-0">
                    {i.productData?.images?.[0] && (
                      <img
                        src={i.productData.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs">
                      {i.productData?.name || 'Unavailable'}
                    </div>
                    <div className="text-xs text-charcoal/50">
                      Qty: {i.qty}
                    </div>
                    <div className="text-xs font-semibold">
                      BDT {(getItemPrice(i) * i.qty).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-line pt-4 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `BDT ${deliveryCharge.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="text-xs text-charcoal/50">
                {form.district ? (
                  qualifiesForFreeShipping ? (
                    `Free shipping applied for orders over BDT ${Number(shippingSettings.freeShippingMin || 0).toLocaleString()}`
                  ) : districtIsDhaka ? (
                    'Inside Dhaka delivery charge applied'
                  ) : (
                    'Outside Dhaka delivery charge applied'
                  )
                ) : (
                  'Select district to calculate delivery charge'
                )}
              </div>
              <div className="mt-2 px-3 py-2 bg-oxblood/5 border border-oxblood/15 rounded-lg">
                <p className="text-xs font-semibold text-oxblood-dark">Standard delivery timeframe: 15–20 days</p>
              </div>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-line pt-4 mb-6">
              <span>Total</span>
              <span className="text-oxblood-dark">
                BDT {total.toLocaleString()}
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-oxblood text-white py-3.5 text-xs tracking-[0.16em] uppercase hover:bg-oxblood-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
