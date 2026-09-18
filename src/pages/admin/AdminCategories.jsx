import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const { user } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', metaTitle: '', metaDescription: '', order: 0, isActive: true, image: null, imagePreview: '' });
  const [subForm, setSubForm] = useState({ name: '', slug: '', category: '', order: 0, isActive: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, subRes] = await Promise.all([
        adminAPI.get('/admin/categories'),
        adminAPI.get('/admin/subcategories'),
      ]);
      setCategories(catRes.data.categories || catRes.data || []);
      setSubcategories(subRes.data.subcategories || subRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await adminAPI.get('/admin/categories');
      setCategories(res.data.categories || res.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await adminAPI.get('/admin/subcategories');
      setSubcategories(res.data.subcategories || res.data || []);
    } catch (err) {
      console.error('Failed to fetch subcategories:', err);
    }
  };

  const autoSlug = (text) => text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const resetCategoryForm = () => { setCatForm({ name: '', slug: '', description: '', metaTitle: '', metaDescription: '', order: 0, isActive: true, image: null, imagePreview: '' }); setEditingCategory(null); };
  const resetSubForm = () => { setSubForm({ name: '', slug: '', category: '', order: 0, isActive: true }); setEditingSubcategory(null); };
  const openAddCategory = () => { resetCategoryForm(); setShowCategoryModal(true); };
  const openAddSubcategory = () => { resetSubForm(); setShowSubcategoryModal(true); };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      metaTitle: cat.metaTitle || '',
      metaDescription: cat.metaDescription || '',
      order: cat.order || 0,
      isActive: cat.isActive !== false,
      image: null,
      imagePreview: cat.image || cat.imageUrl || '',
    });
    setShowCategoryModal(true);
  };

  const openEditSubcategory = (sub) => {
    setEditingSubcategory(sub);
    setSubForm({ name: sub.name || '', slug: sub.slug || '', category: sub.category?._id || sub.category || '', order: sub.order || 0, isActive: sub.isActive !== false });
    setShowSubcategoryModal(true);
  };

  const handleCategoryChange = (e) => { const { name, value, type, checked } = e.target; setCatForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
  const handleCategoryImage = (e) => { const file = e.target.files?.[0]; if (file) setCatForm((p) => ({ ...p, image: file, imagePreview: URL.createObjectURL(file) })); };
  const handleCategoryNameChange = (e) => { const name = e.target.value; setCatForm((p) => ({ ...p, name, slug: editingCategory ? p.slug : autoSlug(name) })); };

  const handleSubChange = (e) => { const { name, value, type, checked } = e.target; setSubForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
  const handleSubNameChange = (e) => { const name = e.target.value; setSubForm((p) => ({ ...p, name, slug: editingSubcategory ? p.slug : autoSlug(name) })); };

  const saveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) { toast.error('Category name is required'); return; }
    try {
      setSaving(true);
      let image = catForm.imagePreview;
      if (catForm.image) {
        const uploadData = new FormData();
        uploadData.append('file', catForm.image);
        const uploadRes = await adminAPI.post('/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
        image = uploadRes.data.url;
      }
      const payload = {
        name: catForm.name.trim(),
        slug: catForm.slug.trim() || autoSlug(catForm.name),
        description: catForm.description.trim(),
        metaTitle: catForm.metaTitle.trim(),
        metaDescription: catForm.metaDescription.trim(),
        order: catForm.order,
        isActive: catForm.isActive,
        image,
      };
      if (editingCategory) {
        await adminAPI.put(`/admin/categories/${editingCategory._id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await adminAPI.post('/admin/categories', payload);
        toast.success('Category created successfully');
      }
      setShowCategoryModal(false); resetCategoryForm(); fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save category'); }
    finally { setSaving(false); }
  };

  const toggleCategoryActive = async (cat) => {
    try {
      await adminAPI.put(`/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: !c.isActive } : c)));
      toast.success(`Category ${!cat.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) { toast.error('Failed to update category status'); }
  };

  const deleteCategory = async (id) => {
    try {
      await adminAPI.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setDeleteConfirm(null);
      toast.success('Category deleted successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete category'); }
  };

  const saveSubcategory = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim()) { toast.error('Subcategory name is required'); return; }
    if (!subForm.category) { toast.error('Please select a parent category'); return; }
    try {
      setSaving(true);
      const payload = { name: subForm.name.trim(), slug: subForm.slug.trim() || autoSlug(subForm.name), category: subForm.category, order: subForm.order, isActive: subForm.isActive };
      if (editingSubcategory) {
        await adminAPI.put(`/admin/subcategories/${editingSubcategory._id}`, payload);
        toast.success('Subcategory updated successfully');
      } else {
        await adminAPI.post('/admin/subcategories', payload);
        toast.success('Subcategory created successfully');
      }
      setShowSubcategoryModal(false); resetSubForm(); fetchSubcategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save subcategory'); }
    finally { setSaving(false); }
  };

  const toggleSubcategoryActive = async (sub) => {
    try {
      await adminAPI.put(`/admin/subcategories/${sub._id}`, { isActive: !sub.isActive });
      setSubcategories((prev) => prev.map((s) => (s._id === sub._id ? { ...s, isActive: !s.isActive } : s)));
      toast.success(`Subcategory ${!sub.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) { toast.error('Failed to update subcategory status'); }
  };

  const deleteSubcategory = async (id) => {
    try {
      await adminAPI.delete(`/admin/subcategories/${id}`);
      setSubcategories((prev) => prev.filter((s) => s._id !== id));
      setDeleteConfirm(null);
      toast.success('Subcategory deleted successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete subcategory'); }
  };

  const getCategoryName = (catId) => categories.find((c) => c._id === catId)?.name || '-';

  const renderImage = (src, alt) => src
    ? <img src={src} alt={alt} className="w-full h-full object-cover" />
    : <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>;

  if (loading && categories.length === 0 && subcategories.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading categories..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorDisplay message={error} onRetry={fetchData} fullPage />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Categories"
        subtitle="Manage your store categories and subcategories"
        actions={
          <button
            onClick={activeTab === 'categories' ? openAddCategory : openAddSubcategory}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add {activeTab === 'categories' ? 'Category' : 'Subcategory'}
          </button>
        }
      />

      {/* Instruction Box */}
      <InstructionBox
        title="Organize Your Store with Categories"
        type="info"
        items={[
          'Categories group your products into broad sections (e.g., Men, Women, Accessories).',
          'Subcategories provide finer organization within a category (e.g., T-Shirts, Dresses under Men/Women).',
          'Use the tabs below to switch between managing categories and subcategories.',
          'Drag-and-drop ordering coming soon — use the Display Order field to arrange items.',
          'Toggle Active/Inactive to show or hide categories from the storefront.',
        ]}
      />

      {/* Tab Switcher */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 w-fit">
        <button onClick={() => setActiveTab('categories')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          Categories ({categories.length})
        </button>
        <button onClick={() => setActiveTab('subcategories')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'subcategories' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          Subcategories ({subcategories.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <LoadingSpinner size="md" text="Loading categories..." />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              }
              title="No categories yet"
              description="Create your first category to start organizing your products."
              actionLabel="Add Category"
              onAction={openAddCategory}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Image</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Active</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Subs</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map((cat) => {
                    const subCount = subcategories.filter((s) => (s.category?._id || s.category) === cat._id).length;
                    return (
                      <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                            {renderImage(cat.image || cat.imageUrl, cat.name)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{cat.name}</p>
                          <p className="text-xs text-gray-400 md:hidden">{cat.slug}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-gray-500">{cat.slug}</span></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><span className="text-gray-500">{cat.order ?? 0}</span></td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleCategoryActive(cat)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cat.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cat.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{subCount} sub{subCount !== 1 ? 'categories' : 'category'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditCategory(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {deleteConfirm === cat._id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => deleteCategory(cat._id)} className="px-2 py-1 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors">Confirm</button>
                                <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(cat._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subcategories Tab */}
      {activeTab === 'subcategories' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <LoadingSpinner size="md" text="Loading subcategories..." />
          ) : subcategories.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              }
              title="No subcategories yet"
              description="Create subcategories under your parent categories for finer product organization."
              actionLabel="Add Subcategory"
              onAction={openAddSubcategory}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Parent Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Active</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subcategories.map((sub) => (
                    <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{sub.name}</p>
                        <p className="text-xs text-gray-400 md:hidden">{sub.slug}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-gray-500">{sub.slug}</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getCategoryName(sub.category?._id || sub.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className="text-gray-500">{sub.order ?? 0}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSubcategoryActive(sub)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sub.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sub.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditSubcategory(sub)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          {deleteConfirm === sub._id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteSubcategory(sub._id)} className="px-2 py-1 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(sub._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-oxblood px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-ivory font-bold tracking-widest uppercase text-sm">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }} className="text-ivory/60 hover:text-ivory transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <form onSubmit={saveCategory} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Category Name <span className="text-rose-500">*</span></label>
                <input type="text" required value={catForm.name} onChange={handleCategoryNameChange} placeholder="e.g. Men, Women, Accessories"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Slug</label>
                <input type="text" value={catForm.slug} onChange={handleCategoryChange} name="slug" placeholder="auto-generated-from-name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Description</label>
                <textarea rows={3} value={catForm.description} onChange={handleCategoryChange} name="description" placeholder="Optional category description"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none" />
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-900">SEO Settings</p>
                  <p className="mt-1 text-xs text-amber-800/80">Optional. These values control the category page meta title and description on Google/social previews.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Meta Title</label>
                  <input type="text" value={catForm.metaTitle} onChange={handleCategoryChange} name="metaTitle" maxLength={70} placeholder="e.g. Premium Lawn Collection in Bangladesh"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
                  <p className="mt-1 text-[11px] text-gray-400">{catForm.metaTitle.length}/70 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Meta Description</label>
                  <textarea rows={3} value={catForm.metaDescription} onChange={handleCategoryChange} name="metaDescription" maxLength={160} placeholder="Write a clear search result description for this category."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none" />
                  <p className="mt-1 text-[11px] text-gray-400">{catForm.metaDescription.length}/160 characters</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden shrink-0 flex items-center justify-center bg-gray-50">
                    {catForm.imagePreview ? (
                      <img src={catForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Choose Image
                      <input type="file" accept="image/*" onChange={handleCategoryImage} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Display Order</label>
                  <input type="number" min="0" value={catForm.order} onChange={handleCategoryChange} name="order"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={catForm.isActive} onChange={handleCategoryChange} name="isActive" className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-oxblood px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-ivory font-bold tracking-widest uppercase text-sm">{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
                <button onClick={() => { setShowSubcategoryModal(false); resetSubForm(); }} className="text-ivory/60 hover:text-ivory transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <form onSubmit={saveSubcategory} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Parent Category <span className="text-rose-500">*</span></label>
                <select required name="category" value={subForm.category} onChange={handleSubChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500">
                  <option value="">Select a category</option>
                  {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Subcategory Name <span className="text-rose-500">*</span></label>
                <input type="text" required value={subForm.name} onChange={handleSubNameChange} placeholder="e.g. T-Shirts, Dresses, Watches"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Slug</label>
                <input type="text" value={subForm.slug} onChange={(e) => setSubForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated-from-name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">Display Order</label>
                  <input type="number" min="0" value={subForm.order} onChange={handleSubChange} name="order"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subForm.isActive} onChange={handleSubChange} name="isActive" className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowSubcategoryModal(false); resetSubForm(); }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
