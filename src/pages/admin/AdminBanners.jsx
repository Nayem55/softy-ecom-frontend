import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth, adminAPI } from './AdminLayout';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

// --- constants -------------------------------------------------------------
const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  linkText: '',
  linkUrl: '',
  image: '',
  mobileImage: '',
  order: 0,
  isActive: true,
};

// --- sub-components --------------------------------------------------------
const ImagePreview = ({ src, alt, size = 60 }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        style={{
          ...imgPrevStyles.placeholder,
          width: size,
          height: size,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <svg style={{ width: size * 0.35, height: size * 0.35, opacity: 0.4 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500 }}>No image</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || 'banner'}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
      onError={() => setError(true)}
    />
  );
};

const imgPrevStyles = {
  placeholder: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f3f4f6', color: '#9ca3af', fontSize: 11, borderRadius: 8,
    border: '1px dashed #d1d5db', fontWeight: 500,
  },
};

const Modal = ({ children, onClose, title, wide }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
    <div style={{ ...styles.modalContent, maxWidth: wide ? 700 : 520 }} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>{title}</h2>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ConfirmDelete = ({ name, onConfirm, onCancel }) => (
  <Modal title="Delete Banner" onClose={onCancel}>
    <div className="text-center">
      <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p style={{ color: '#6b7280', marginBottom: 20, textAlign: 'center', fontSize: 15 }}>
        Are you sure you want to delete <strong style={{ color: '#111827' }}>"{name}"</strong>?<br />
        This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button style={{ ...styles.btn, background: '#e5e7eb', color: '#374151' }} onClick={onCancel}>Cancel</button>
        <button style={{ ...styles.btn, background: '#ef4444', color: '#fff' }} onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </Modal>
);

const BannerForm = ({ initial, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [imageFile, setImageFile] = useState(null);
  const [mobileImageFile, setMobileImageFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image || '');
  const [mobilePreview, setMobilePreview] = useState(initial?.mobileImage || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const mobileFileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'order' ? parseInt(value) || 0 : value,
    }));
  };

  const handleFile = (e, target = 'desktop') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === 'mobile') {
      setMobileImageFile(file);
    } else {
      setImageFile(file);
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (target === 'mobile') {
        setMobilePreview(ev.target.result);
      } else {
        setPreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const upRes = await adminAPI.post('/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return upRes.data?.url || upRes.data?.imageUrl || upRes.data?.path || '';
  };

  const clearMobileImage = () => {
    setMobileImageFile(null);
    setMobilePreview('');
    setForm((prev) => ({ ...prev, mobileImage: '' }));
    if (mobileFileRef.current) mobileFileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (imageFile) {
        setUploading(true);
        payload.image = await uploadImage(imageFile);
      }
      if (mobileImageFile) {
        setUploading(true);
        payload.mobileImage = await uploadImage(mobileImageFile);
      }
      setUploading(false);
      onSubmit(payload);
    } catch (err) {
      setUploading(false);
      toast.error('Image upload failed. ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    }
  };

  const inputStyle = { ...styles.input };
  const labelStyle = { ...styles.label };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        <div style={{ ...styles.sizeGuide, gridColumn: '1 / -1' }}>
          <strong>Banner size guide:</strong> Desktop 1920 x 820 px. Mobile 1080 x 1440 px. Keep important text or faces near the center so cropping looks clean.
        </div>

        {/* Desktop image */}
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Desktop Banner Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ImagePreview src={preview} alt="preview" size={120} />
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'desktop')} />
              <button type="button" style={{ ...styles.btn, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                onClick={() => fileRef.current?.click()}>
                Choose Image
              </button>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Recommended 1920 x 820 px. JPG, PNG or WebP. Max 5 MB.</p>
            </div>
          </div>
        </div>

        {/* Mobile image */}
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Mobile Banner Image <span style={{ color: '#9ca3af', fontWeight: 500 }}>(optional)</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ImagePreview src={mobilePreview} alt="mobile preview" size={120} />
            <div>
              <input ref={mobileFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'mobile')} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" style={{ ...styles.btn, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                  onClick={() => mobileFileRef.current?.click()}>
                  Choose Mobile Image
                </button>
                {mobilePreview && (
                  <button type="button" style={{ ...styles.btn, background: '#fff', color: '#b91c1c', border: '1px solid #fecaca' }}
                    onClick={clearMobileImage}>
                    Remove Mobile Image
                  </button>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Recommended 1080 x 1440 px. If empty, the desktop banner will be used on mobile.</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required style={inputStyle} placeholder="e.g. Summer Sale" />
        </div>

        {/* Subtitle */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Subtitle</label>
          <input name="subtitle" value={form.subtitle} onChange={handleChange} style={inputStyle} placeholder="e.g. Up to 50% off" />
        </div>

        {/* Description */}
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Optional description ..." />
        </div>

        {/* Link Text */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Link Text</label>
          <input name="linkText" value={form.linkText} onChange={handleChange} style={inputStyle} placeholder="e.g. Shop Now" />
        </div>

        {/* Link URL */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Link URL</label>
          <input name="linkUrl" value={form.linkUrl} onChange={handleChange} style={inputStyle} placeholder="/collections/summer" />
        </div>

        {/* Order */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Display Order</label>
          <input name="order" type="number" value={form.order} onChange={handleChange} style={inputStyle} />
        </div>

        {/* Active */}
        <div style={styles.formGroup}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange}
              style={{ width: 18, height: 18, accentColor: '#2563eb' }} />
            Active
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
        <button type="button" style={{ ...styles.btn, background: '#f3f4f6', color: '#374151' }} onClick={onCancel}>Cancel</button>
        <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: '#fff' }} disabled={loading || uploading}>
          {uploading ? 'Uploading ...' : loading ? 'Saving ...' : initial ? 'Update Banner' : 'Create Banner'}
        </button>
      </div>
    </form>
  );
};

// --- main component --------------------------------------------------------
export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.get('/admin/banners');
      const data = res.data;
      setBanners(
        (data.banners || data.data || data || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
    } catch (err) {
      console.error('Failed to fetch banners:', err);
      setError(err.response?.data?.message || 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // -- handlers -----------------------------------------------------------
  const handleCreate = () => {
    setEditBanner(null);
    setShowForm(true);
  };

  const handleEdit = (banner) => {
    setEditBanner(banner);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editBanner) {
        await adminAPI.put(`/admin/banners/${editBanner._id}`, formData);
        toast.success('Banner updated successfully');
      } else {
        await adminAPI.post('/admin/banners', formData);
        toast.success('Banner created successfully');
      }
      setShowForm(false);
      setEditBanner(null);
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/admin/banners/${deleteTarget._id}`);
      setDeleteTarget(null);
      toast.success(`Banner "${deleteTarget.title || 'untitled'}" deleted`);
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete banner.');
    }
  };

  const moveBanner = async (index, direction) => {
    const sorted = [...banners];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[index], sorted[swapIdx]] = [sorted[swapIdx], sorted[index]];
    const updated = sorted.map((b, i) => ({ ...b, order: i }));
    setBanners(updated);
    try {
      await adminAPI.put('/admin/banners/reorder', {
        orders: updated.map((b) => ({ id: b._id, order: b.order })),
      });
      toast.success('Banner order updated');
    } catch {
      toast.error('Failed to save new order');
      fetchBanners();
    }
  };

  const toggleActive = async (banner) => {
    try {
      await adminAPI.put(`/admin/banners/${banner._id}`, { isActive: !banner.isActive });
      fetchBanners();
      toast.success(`Banner "${banner.title || 'untitled'}" ${banner.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update banner status.');
    }
  };

  // -- render -------------------------------------------------------------
  return (
    <div style={styles.container}>
      <InstructionBox
        title="Banners Management"
        items={['Manage homepage banners. Banners appear in the hero slider on the storefront. Drag to reorder using the arrow buttons.']}
        type="info"
      />

      <PageHeader
        title="Banners"
        subtitle={`${banners.length} banner${banners.length !== 1 ? 's' : ''} configured`}
        actions={
          <button style={{ ...styles.btn, background: '#2563eb', color: '#fff' }} onClick={handleCreate}>
            + Add Banner
          </button>
        }
      />

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchBanners} />}

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading banners..." />
      ) : banners.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
          title="No banners yet"
          description="Add your first banner to appear on the homepage."
          actionLabel="Add Banner"
          onAction={handleCreate}
        />
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 50 }}>#</th>
                <th style={styles.th}>Images</th>
                <th style={styles.th}>Title / Subtitle</th>
                <th style={styles.th}>Link</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Order</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b, i) => (
                <tr key={b._id} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <ImagePreview src={b.image} alt={b.title} size={64} />
                        <div style={styles.imageLabel}>Desktop</div>
                      </div>
                      <div>
                        <ImagePreview src={b.mobileImage} alt={`${b.title} mobile`} size={64} />
                        <div style={styles.imageLabel}>Mobile</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{b.title || 'Untitled'}</div>
                    {b.subtitle && <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{b.subtitle}</div>}
                  </td>
                  <td style={styles.td}>
                    {b.linkUrl ? (
                      <span style={{ color: '#2563eb', fontSize: 13 }}>{b.linkText || b.linkUrl}</span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>No link</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => toggleActive(b)}
                      style={{
                        ...styles.statusBadge,
                        background: b.isActive ? '#dcfce7' : '#f3f4f6',
                        color: b.isActive ? '#166534' : '#6b7280',
                      }}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button style={styles.reorderBtn} onClick={() => moveBanner(i, -1)} disabled={i === 0} title="Move up" aria-label="Move up">
                        <svg style={styles.reorderIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13 }}>{b.order ?? i}</span>
                      <button style={styles.reorderBtn} onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1} title="Move down" aria-label="Move down">
                        <svg style={styles.reorderIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ ...styles.actionBtn, color: '#2563eb' }} onClick={() => handleEdit(b)}>
                        <svg style={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 7.125L16.875 4.5" />
                        </svg>
                        Edit
                      </button>
                      <button style={{ ...styles.actionBtn, color: '#ef4444' }} onClick={() => setDeleteTarget(b)}>
                        <svg style={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M19.228 5.79L18.16 19.673A2.25 2.25 0 0115.916 21H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .563c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916A2.25 2.25 0 0013.5 2.25h-3A2.25 2.25 0 008.25 4.5v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal title={editBanner ? 'Edit Banner' : 'Add Banner'} onClose={() => { setShowForm(false); setEditBanner(null); }} wide>
          <BannerForm
            initial={editBanner}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditBanner(null); }}
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDelete name={deleteTarget.title || 'untitled'} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

// --- styles ----------------------------------------------------------------
const styles = {
  container: { padding: 24, maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 },
  errorBanner: { background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #fecaca' },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280', fontSize: 15 },
  emptyState: { textAlign: 'center', padding: 60, color: '#9ca3af', background: '#f9fafb', borderRadius: 8 },
  // table
  tableWrap: { overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { background: '#f9fafb', padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', color: '#1f2937', verticalAlign: 'middle' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 8, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 },
  actionIcon: { width: 14, height: 14 },
  reorderBtn: { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: '2px 6px', color: '#374151', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  reorderIcon: { width: 12, height: 12 },
  statusBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' },
  // modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 8, padding: 24, width: '90%', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4 },
  // form
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  sizeGuide: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.5 },
  imageLabel: { marginTop: 4, color: '#6b7280', fontSize: 11, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  btn: { padding: '10px 18px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
};

