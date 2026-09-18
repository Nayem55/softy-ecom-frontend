import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

// --- constants -------------------------------------------------------------
const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
};

// --- helpers ---------------------------------------------------------------
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

// --- sub-components --------------------------------------------------------
const LogoPreview = ({ src, alt, size = 48 }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{ ...logoStyles.placeholder, width: size, height: size }}>
        {alt ? alt[0]?.toUpperCase() : 'B'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || 'brand logo'}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', padding: 2 }}
      onError={() => setError(true)}
    />
  );
};

const logoStyles = {
  placeholder: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#dbeafe', color: '#2563eb', fontSize: 16, fontWeight: 700,
    borderRadius: 8, border: '1px solid #bfdbfe',
  },
};

const Modal = ({ children, onClose, title }) => (
  <div style={styles.modalOverlay} onClick={onClose}>
    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
  <Modal title="Delete Brand" onClose={onCancel}>
    <p style={{ color: '#6b7280', marginBottom: 20, textAlign: 'center', fontSize: 15 }}>
      Are you sure you want to delete <strong style={{ color: '#111827' }}>"{name}"</strong>?<br />
      This action cannot be undone.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
      <button style={{ ...styles.btn, background: '#e5e7eb', color: '#374151' }} onClick={onCancel}>Cancel</button>
      <button style={{ ...styles.btn, background: '#ef4444', color: '#fff' }} onClick={onConfirm}>Delete</button>
    </div>
  </Modal>
);

const BrandForm = ({ initial, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState(initial?.logo || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      // auto-generate slug from name (only when not editing, or slug hasn't been manually changed)
      if (name === 'name' && !initial) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (logoFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', logoFile);
        const upRes = await adminAPI.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        form.logo = upRes.data?.url || upRes.data?.imageUrl || upRes.data?.path;
        setUploading(false);
      }
      onSubmit(form);
    } catch (err) {
      setUploading(false);
      toast.error('Logo upload failed. ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    }
  };

  const inputStyle = { ...styles.input };
  const labelStyle = { ...styles.label };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.formGrid}>
        {/* Logo */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Brand Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LogoPreview src={preview} alt={form.name} size={72} />
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
              <button type="button" style={{ ...styles.btn, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                onClick={() => fileRef.current?.click()}>
                Choose Logo
              </button>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Square image recommended. PNG/SVG preferred.</p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Brand Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="e.g. Nike" />
        </div>

        {/* Slug */}
        <div style={styles.formGroup}>
          <label style={labelStyle}>Slug</label>
          <input name="slug" value={form.slug} onChange={handleChange} style={inputStyle} placeholder="auto-generated" />
        </div>

        {/* Description */}
        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional brand description ..." />
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
          {uploading ? 'Uploading ...' : loading ? 'Saving ...' : initial ? 'Update Brand' : 'Create Brand'}
        </button>
      </div>
    </form>
  );
};

// --- main component --------------------------------------------------------
export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Try admin endpoint first, fall back to public
      let data;
      try {
        const res = await adminAPI.get('/admin/brands');
        data = res.data;
      } catch {
        const res = await adminAPI.get('/brands');
        data = res.data;
      }
      setBrands(data.brands || data.data || data || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
      setError(err.response?.data?.message || 'Failed to load brands.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // -- handlers -----------------------------------------------------------
  const handleCreate = () => {
    setEditBrand(null);
    setShowForm(true);
  };

  const handleEdit = (brand) => {
    setEditBrand(brand);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editBrand) {
        await adminAPI.put(`/admin/brands/${editBrand._id}`, formData);
        toast.success('Brand updated successfully!');
      } else {
        await adminAPI.post('/admin/brands', formData);
        toast.success('Brand created successfully!');
      }
      setShowForm(false);
      setEditBrand(null);
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/admin/brands/${deleteTarget._id}`);
      toast.success('Brand deleted.');
      setDeleteTarget(null);
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete brand.');
    }
  };

  const toggleActive = async (brand) => {
    try {
      await adminAPI.put(`/admin/brands/${brand._id}`, { isActive: !brand.isActive });
      toast.success(`Brand ${brand.isActive ? 'deactivated' : 'activated'}.`);
      fetchBrands();
    } catch (err) {
      toast.error('Failed to update brand status.');
    }
  };

  // -- render -------------------------------------------------------------
  return (
    <div style={styles.container}>
      <PageHeader
        title="Brands"
        subtitle="Manage designer brands. Brands appear on the homepage brand strip and can be used to filter products."
        actions={
          <button style={{ ...styles.btn, background: '#2563eb', color: '#fff' }} onClick={handleCreate}>+ Add Brand</button>
        }
      />

      <InstructionBox
        title="About Brands"
        items={[
          'Brands appear on the homepage brand strip for customers to browse.',
          'Brands can be used as a product filter on the shop page.',
          'Upload a square logo for best display results.',
          'Inactive brands are hidden from the storefront.',
        ]}
      />

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchBrands} />}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading brands..." />
      ) : !error && brands.length === 0 ? (
        <EmptyState
          title="No brands yet"
          description="Create your first brand to start showcasing designer labels on your storefront."
          actionLabel="Create Your First Brand"
          onAction={handleCreate}
        />
      ) : !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Logo</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Slug</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b._id} style={styles.tr}>
                  <td style={styles.td}>
                    <LogoPreview src={b.logo} alt={b.name} size={44} />
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{b.name}</div>
                    {b.description && (
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.description}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 8, fontSize: 12, color: '#6b7280' }}>
                      {b.slug || ''}
                    </code>
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
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-BD') : ''}
                    </span>
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
        <Modal title={editBrand ? 'Edit Brand' : 'Add Brand'} onClose={() => { setShowForm(false); setEditBrand(null); }}>
          <BrandForm
            initial={editBrand}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditBrand(null); }}
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDelete name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
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
  statusBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' },
  // modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 8, padding: 24, width: '90%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4 },
  // form
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  btn: { padding: '10px 18px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
};

