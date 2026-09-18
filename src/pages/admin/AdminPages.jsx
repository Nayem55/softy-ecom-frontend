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
  title: '',
  slug: '',
  content: '',
  metaDescription: '',
  isPublished: false,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatDate = (d) => {
  if (!d) return '---';
  return new Date(d).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
const Modal = ({ children, onClose, title }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="bg-oxblood px-6 py-5 rounded-t-2xl sticky top-0 z-10">
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

const ConfirmDelete = ({ title, onConfirm, onCancel }) => (
  <Modal title="Delete Page" onClose={onCancel}>
    <div className="p-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <p className="text-gray-600 mb-1">Are you sure you want to delete the page</p>
      <p className="font-semibold text-gray-900 mb-6">&quot;{title}&quot;?</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold tracking-wider uppercase transition-colors">Delete</button>
      </div>
    </div>
  </Modal>
);

const PageForm = ({ initial, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'title' && !initial) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      slug: form.slug || slugify(form.title),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
          Page Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. About Us, Privacy Policy"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Slug</label>
        <input
          type="text"
          name="slug"
          value={form.slug}
          onChange={handleChange}
          placeholder="auto-generated-from-title"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
        />
        <p className="text-xs text-gray-400 mt-1">Make sure to set the slug carefully as it determines the page URL.</p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Page Content</label>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={12}
          placeholder="Write your page content here. HTML is supported."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-y font-mono leading-relaxed"
        />
        <p className="text-xs text-gray-400 mt-1">HTML tags are supported for formatting.</p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Meta Description</label>
        <textarea
          name="metaDescription"
          value={form.metaDescription}
          onChange={handleChange}
          rows={3}
          placeholder="SEO description for this page (optional)"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none"
        />
      </div>

      {/* Published */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isPublished"
            checked={form.isPublished}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="text-sm font-medium text-gray-700">Published</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-6">Only published pages are visible to customers.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-oxblood hover:bg-oxblood-dark text-ivory text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" /> : initial ? 'Update Page' : 'Create Page'}
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPage, setEditPage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ---- Fetch pages ---- */
  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.get('/admin/pages');
      setPages(res.data.pages || res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      setError(err.response?.data?.message || 'Failed to load pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  /* ---- Handlers ---- */
  const handleCreate = () => {
    setEditPage(null);
    setShowForm(true);
  };

  const handleEdit = (page) => {
    setEditPage(page);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    setSaving(true);
    try {
      if (editPage) {
        await adminAPI.put(`/admin/pages/${editPage._id}`, formData);
        toast.success('Page updated successfully!');
      } else {
        await adminAPI.post('/admin/pages', formData);
        toast.success('Page created successfully!');
      }
      setShowForm(false);
      setEditPage(null);
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/admin/pages/${deleteTarget._id}`);
      toast.success('Page deleted.');
      setDeleteTarget(null);
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete page.');
    }
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Static Pages"
        subtitle="Create static pages like About Us, Shipping Policy, Terms & Conditions. These appear at specific URLs on the storefront."
        actions={
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-oxblood text-ivory text-sm font-medium rounded-lg hover:bg-oxblood-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Page
          </button>
        }
      />

      <InstructionBox
        title="About Static Pages"
        items={[
          'Create informational pages like About Us, Shipping Policy, or Terms & Conditions.',
          'Pages are accessible at yourdomain.com/pages/{slug}.',
          'Make sure to set the slug carefully as it determines the page URL.',
          'Only published pages are visible to customers on the storefront.',
          'HTML content is supported for rich text formatting.',
        ]}
      />

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchPages} />}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading pages..." />
      ) : !error && pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create static pages like About Us, Shipping Policy, or Terms & Conditions to inform your customers."
          actionLabel="Create Your First Page"
          onAction={handleCreate}
        />
      ) : !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Updated</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.title}</div>
                      {p.metaDescription && (
                        <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{p.metaDescription}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">/{p.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                      {formatDate(p.updatedAt || p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal title={editPage ? 'Edit Page' : 'Add Page'} onClose={() => { setShowForm(false); setEditPage(null); }}>
          <PageForm
            initial={editPage}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditPage(null); }}
            loading={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDelete title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
