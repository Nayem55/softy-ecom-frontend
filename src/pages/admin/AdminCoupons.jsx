import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  code: '',
  discountType: 'flat',
  discountValue: '',
  minOrder: '',
  maxUses: '',
  expiresAt: '',
  isActive: true,
};

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

const formatCurrency = (n) => `BDT ${Number(n).toLocaleString()}`;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
const Modal = ({ children, onClose, title }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="bg-oxblood px-6 py-5 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-ivory font-bold tracking-widest uppercase text-sm">{title}</h2>
          <button onClick={onClose} className="text-ivory/60 hover:text-ivory transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const ConfirmDelete = ({ name, onConfirm, onCancel }) => (
  <Modal title="Delete Coupon" onClose={onCancel}>
    <div className="p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <p className="text-gray-600 mb-1">Are you sure you want to delete coupon</p>
      <p className="font-semibold text-gray-900 mb-6">&quot;{name}&quot;?</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold tracking-wider uppercase transition-colors">Delete</button>
      </div>
    </div>
  </Modal>
);

const CouponForm = ({ initial, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      maxUses: form.maxUses ? Number(form.maxUses) : 0,
      expiresAt: form.expiresAt || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
            Coupon Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="code"
            required
            value={form.code}
            onChange={handleChange}
            placeholder="e.g. SUMMER25"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 uppercase"
          />
          <p className="text-xs text-gray-400 mt-1">Unique identifier customers enter at checkout.</p>
        </div>

        {/* Discount Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Discount Type</label>
          <select
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
          >
            <option value="flat">Flat (BDT )</option>
            <option value="percentage">Percentage (%)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Flat = fixed BDT amount off. Percentage = % off the total.</p>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
            Discount Value <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            name="discountValue"
            required
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={handleChange}
            placeholder={form.discountType === 'flat' ? 'e.g. 500' : 'e.g. 10'}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
          />
        </div>

        {/* Min Order */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Minimum Order</label>
          <input
            type="number"
            name="minOrder"
            min="0"
            value={form.minOrder}
            onChange={handleChange}
            placeholder="0 = no minimum"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
          />
          <p className="text-xs text-gray-400 mt-1">Minimum cart subtotal required to apply this coupon.</p>
        </div>

        {/* Max Uses */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Max Uses</label>
          <input
            type="number"
            name="maxUses"
            min="0"
            value={form.maxUses}
            onChange={handleChange}
            placeholder="0 = unlimited"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
          />
          <p className="text-xs text-gray-400 mt-1">Total number of times this coupon can be used. 0 = unlimited.</p>
        </div>

        {/* Expires At */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Expiry Date</label>
          <input
            type="date"
            name="expiresAt"
            value={form.expiresAt ? form.expiresAt.split('T')[0] : ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
          />
        </div>

        {/* Active */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer mt-6">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-oxblood hover:bg-oxblood-dark text-ivory text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" /> : initial ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ---- Fetch coupons ---- */
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.get('/admin/coupons');
      setCoupons(res.data.coupons || res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError(err.response?.data?.message || 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  /* ---- Handlers ---- */
  const handleCreate = () => {
    setEditCoupon(null);
    setShowForm(true);
  };

  const handleEdit = (coupon) => {
    setEditCoupon(coupon);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editCoupon) {
        await adminAPI.put(`/admin/coupons/${editCoupon._id}`, formData);
        toast.success('Coupon updated successfully!');
      } else {
        await adminAPI.post('/admin/coupons', formData);
        toast.success('Coupon created successfully!');
      }
      setShowForm(false);
      setEditCoupon(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/admin/coupons/${deleteTarget._id}`);
      toast.success('Coupon deleted.');
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon.');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await adminAPI.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}.`);
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to update coupon status.');
    }
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Create discount coupons for customers. Coupons can be flat amount or percentage based."
        actions={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-oxblood text-ivory text-sm font-medium rounded-lg hover:bg-oxblood-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Coupon
          </button>
        }
      />

      <InstructionBox
        title="About Coupons"
        items={[
          'Coupons can be flat amount (fixed BDT off) or percentage based.',
          'The code is what customers enter at checkout to apply the discount.',
          'Set a minimum order value to restrict coupon usage on small carts.',
          'Max uses controls how many total times the coupon can be redeemed (0 = unlimited).',
          'Coupons expire at 11:59 PM on the expiry date set.',
        ]}
      />

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchCoupons} />}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading coupons..." />
      ) : !error && coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          description="Create your first coupon to offer discounts and promote sales."
          actionLabel="Create Your First Coupon"
          onAction={handleCreate}
        />
      ) : !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Discount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Min Order</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Uses</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => {
                  const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-oxblood/10 text-oxblood font-bold text-xs tracking-wider uppercase">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {c.discountType === 'flat' ? formatCurrency(c.discountValue) : `${c.discountValue}%`}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">
                          ({c.discountType === 'flat' ? 'flat' : 'off'})
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        {c.minOrder ? formatCurrency(c.minOrder) : '---'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-600">{c.usedCount || 0}</span>
                        {c.maxUses ? (
                          <span className="text-gray-400"> / {c.maxUses}</span>
                        ) : (
                          <span className="text-gray-400"> / unlimited</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                          {formatDate(c.expiresAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(c)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            c.isActive && !isExpired ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                          title={c.isActive ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            c.isActive && !isExpired ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal title={editCoupon ? 'Edit Coupon' : 'Add Coupon'} onClose={() => { setShowForm(false); setEditCoupon(null); }}>
          <CouponForm
            initial={editCoupon}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditCoupon(null); }}
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDelete name={deleteTarget.code} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
