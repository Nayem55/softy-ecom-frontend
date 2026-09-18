import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const FLAG_FIELDS = [
  { key: 'isActive', label: 'Active', color: 'emerald' },
  { key: 'isTrending', label: 'Trending', color: 'rose' },
  { key: 'isBestSeller', label: 'Best Seller', color: 'purple' },
  { key: 'isFeatured', label: 'Featured', color: 'amber' },
  { key: 'isNew', label: 'New', color: 'blue' },
  { key: 'isBridal', label: 'Bridal', color: 'pink' },
];

const EMPTY_BULK = {
  category: '',
  subcategory: '',
  brand: '',
  regularPrice: '',
  salePrice: '',
  discountPercent: '',
  stock: '',
  tags: '',
  isOnSale: '',
  isActive: '',
  isTrending: '',
  isFeatured: '',
  isBestSeller: '',
  isNew: '',
  isBridal: '',
};

const getId = (value) => (typeof value === 'object' ? value?._id : value);
const toTagString = (tags) => (Array.isArray(tags) ? tags.join(', ') : tags || '');
const parseTags = (tags) => tags.split(',').map((tag) => tag.trim()).filter(Boolean);
const regularPriceOf = (product) => product.regularPrice || (product.comparePrice && product.comparePrice > product.price ? product.comparePrice : product.price) || 0;
const salePriceOf = (product) => product.salePrice || (product.isOnSale || product.comparePrice ? product.price : '') || '';
const productOnSale = (product) => Boolean(product.isOnSale && Number(salePriceOf(product)) > 0 && Number(salePriceOf(product)) < Number(regularPriceOf(product)));

export default function AdminBulkProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selected, setSelected] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [bulk, setBulk] = useState(EMPTY_BULK);
  const [filters, setFilters] = useState({ search: '', category: '', flag: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const changedIds = useMemo(() => Object.keys(drafts), [drafts]);
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedSet.has(product._id)),
    [products, selectedSet]
  );

  const visibleProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return products.filter((product) => {
      if (q && !product.name?.toLowerCase().includes(q)) return false;
      if (filters.category && getId(product.category) !== filters.category) return false;
      if (filters.flag && !product[filters.flag]) return false;
      return true;
    });
  }, [filters, products]);

  const bulkSubcategories = useMemo(
    () => subcategories.filter((sub) => (sub.category?._id || sub.category) === bulk.category),
    [bulk.category, subcategories]
  );

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes, subRes, brandRes] = await Promise.all([
        adminAPI.get('/admin/products?limit=500'),
        adminAPI.get('/admin/categories'),
        adminAPI.get('/admin/subcategories'),
        adminAPI.get('/admin/brands'),
      ]);
      setProducts((prodRes.data.products || []).map((product) => ({
        ...product,
        category: getId(product.category) || '',
        subcategory: getId(product.subcategory) || '',
        brand: getId(product.brand) || '',
        regularPrice: regularPriceOf(product),
        salePrice: salePriceOf(product),
        isOnSale: productOnSale(product),
        tags: toTagString(product.tags),
      })));
      setCategories(catRes.data.categories || catRes.data || []);
      setSubcategories(subRes.data.subcategories || subRes.data || []);
      setBrands(brandRes.data.brands || brandRes.data || []);
      setSelected([]);
      setDrafts({});
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoryName = (id) => categories.find((category) => category._id === id)?.name || 'Uncategorized';
  const subcategoryName = (id) => subcategories.find((subcategory) => subcategory._id === id)?.name || '';
  const rowSubcategories = (categoryId) => subcategories.filter((sub) => (sub.category?._id || sub.category) === categoryId);
  const productValue = (product, field) => drafts[product._id]?.[field] ?? product[field] ?? '';

  const updateDraft = (product, field, value) => {
    setDrafts((prev) => {
      const nextProduct = { ...(prev[product._id] || {}) };
      nextProduct[field] = value;
      if (field === 'category') nextProduct.subcategory = '';

      const original = field === 'tags' ? toTagString(product[field]) : product[field];
      if (value === (original ?? '')) delete nextProduct[field];

      if (Object.keys(nextProduct).length === 0) {
        const next = { ...prev };
        delete next[product._id];
        return next;
      }
      return { ...prev, [product._id]: nextProduct };
    });
  };

  const toggleSelected = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleVisible = () => {
    const allVisibleSelected = visibleProducts.length > 0 && visibleProducts.every((product) => selectedSet.has(product._id));
    setSelected(allVisibleSelected ? [] : visibleProducts.map((product) => product._id));
  };

  const normalizePayload = (data) => {
    const payload = { ...data };
    ['regularPrice', 'salePrice', 'discountPercent', 'stock'].forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== '') payload[field] = Number(payload[field]) || 0;
    });
    if ((payload.salePrice || payload.discountPercent) && (payload.isOnSale === undefined || payload.isOnSale === '')) {
      payload.isOnSale = true;
    }
    if (payload.tags !== undefined) payload.tags = parseTags(payload.tags);
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') delete payload[key];
    });
    return payload;
  };

  const saveInlineChanges = async () => {
    if (changedIds.length === 0) {
      toast.error('No row changes to save');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(changedIds.map((id) => adminAPI.put(`/admin/products/${id}`, normalizePayload(drafts[id]))));
      toast.success(`${changedIds.length} product${changedIds.length > 1 ? 's' : ''} updated`);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save row changes');
    } finally {
      setSaving(false);
    }
  };

  const applyBulkChanges = async () => {
    if (selected.length === 0) {
      toast.error('Select products first');
      return;
    }
    const payload = normalizePayload(bulk);
    if (Object.keys(payload).length === 0) {
      toast.error('Choose at least one bulk change');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.put('/admin/products/bulk-update', { ids: selected, updates: payload });
      toast.success(`Updated ${selected.length} selected product${selected.length > 1 ? 's' : ''}`);
      setBulk(EMPTY_BULK);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Bulk update failed');
    } finally {
      setSaving(false);
    }
  };

  const clearDrafts = () => {
    setDrafts({});
    setBulk(EMPTY_BULK);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading bulk editor..." />
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
      <PageHeader
        title="Bulk Product Edit"
        subtitle="Select products, apply shared changes, or fine-tune rows before saving."
        actions={
          <div className="flex gap-2">
            <Link to="/admin/products" className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Product List
            </Link>
            <button onClick={fetchData} className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black">
              Refresh
            </button>
          </div>
        }
      />

      <InstructionBox
        title="Bulk Editing"
        type="info"
        items={[
          'Click a product name to open its full edit page in a new tab.',
          'Use the right panel for shared changes across selected products.',
          'Open a product row to make product-specific edits without leaving this page.',
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="space-y-4 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search products..."
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
              <select
                value={filters.flag}
                onChange={(e) => setFilters((prev) => ({ ...prev, flag: e.target.value }))}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Flags</option>
                {FLAG_FIELDS.map((flag) => <option key={flag.key} value={flag.key}>{flag.label}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{visibleProducts.length} visible products</p>
                <p className="text-xs text-gray-500">{selected.length} selected, {changedIds.length} rows changed</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={toggleVisible} className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                  {visibleProducts.length > 0 && visibleProducts.every((product) => selectedSet.has(product._id)) ? 'Clear Visible' : 'Select Visible'}
                </button>
                <button onClick={clearDrafts} disabled={saving || changedIds.length === 0} className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                  Discard Row Edits
                </button>
                <button onClick={saveInlineChanges} disabled={saving || changedIds.length === 0} className="px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-700">
                  Save Row Edits
                </button>
              </div>
            </div>

            {visibleProducts.length === 0 ? (
              <EmptyState title="No matching products" description="Adjust filters to see products." />
            ) : (
              <div className="divide-y divide-gray-100">
                {visibleProducts.map((product) => {
                  const changed = Boolean(drafts[product._id]);
                  const rowCategory = productValue(product, 'category');
                  const availableSubs = rowSubcategories(rowCategory);

                  return (
                    <details key={product._id} className={`group ${changed ? 'bg-amber-50/50' : 'bg-white'}`}>
                      <summary className="list-none cursor-pointer px-5 py-4 hover:bg-gray-50">
                        <div className="grid grid-cols-[auto_52px_minmax(0,1fr)_auto] gap-4 items-center">
                          <input
                            type="checkbox"
                            checked={selectedSet.has(product._id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelected(product._id)}
                            className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                          />
                          <div className="w-12 h-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                            {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <a
                              href={`/admin/products/edit/${product._id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-gray-900 hover:text-rose-600 hover:underline"
                            >
                              {product.name}
                            </a>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span>{categoryName(product.category)}</span>
                              {subcategoryName(product.subcategory) && <span>/ {subcategoryName(product.subcategory)}</span>}
                              {product.isOnSale ? (
                                <span>
                                  <span className="line-through text-gray-400">BDT {Number(product.regularPrice || 0).toLocaleString('en-BD')}</span>
                                  <span className="ml-1 text-rose-600 font-semibold">BDT {Number(product.salePrice || product.price || 0).toLocaleString('en-BD')}</span>
                                </span>
                              ) : (
                                <span>BDT {Number(product.regularPrice || product.price || 0).toLocaleString('en-BD')}</span>
                              )}
                              <span>Stock {product.stock || 0}</span>
                              {changed && <span className="text-amber-700 font-medium">Unsaved row edits</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {FLAG_FIELDS.filter((flag) => product[flag.key]).map((flag) => (
                                <span key={flag.key} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                                  {flag.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>

                      <div className="px-5 pb-5">
                        <div className="ml-20 rounded-xl border border-gray-200 bg-white p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Regular Price</span>
                              <input type="number" value={productValue(product, 'regularPrice')} onChange={(e) => updateDraft(product, 'regularPrice', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg" />
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Sale Price</span>
                              <input type="number" value={productValue(product, 'salePrice')} onChange={(e) => updateDraft(product, 'salePrice', e.target.value)} disabled={!productValue(product, 'isOnSale')} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg disabled:bg-gray-50 disabled:text-gray-400" />
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Stock</span>
                              <input type="number" value={productValue(product, 'stock')} onChange={(e) => updateDraft(product, 'stock', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg" />
                            </label>
                            <label className="md:col-span-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                              <span>
                                <span className="block text-sm font-semibold text-gray-800">Sale Status</span>
                                <span className="block text-xs text-gray-500">Show sale price and cut regular price on storefront</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={Boolean(productValue(product, 'isOnSale'))}
                                onChange={(e) => updateDraft(product, 'isOnSale', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Category</span>
                              <select value={rowCategory} onChange={(e) => updateDraft(product, 'category', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg">
                                <option value="">None</option>
                                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                              </select>
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Subcategory</span>
                              <select value={productValue(product, 'subcategory')} onChange={(e) => updateDraft(product, 'subcategory', e.target.value)} disabled={!rowCategory || availableSubs.length === 0} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg disabled:bg-gray-50 disabled:text-gray-400">
                                <option value="">None</option>
                                {availableSubs.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                              </select>
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Brand</span>
                              <select value={productValue(product, 'brand')} onChange={(e) => updateDraft(product, 'brand', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg">
                                <option value="">None</option>
                                {brands.map((brand) => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
                              </select>
                            </label>
                            <label className="space-y-1 md:col-span-3">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Tags</span>
                              <input value={productValue(product, 'tags')} onChange={(e) => updateDraft(product, 'tags', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg" />
                            </label>
                          </div>
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            {FLAG_FIELDS.map((flag) => (
                              <label key={flag.key} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(productValue(product, flag.key))}
                                  onChange={(e) => updateDraft(product, flag.key, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                />
                                {flag.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Apply To Selected</h2>
              <p className="text-xs text-gray-500 mt-1">{selected.length} product{selected.length !== 1 ? 's' : ''} selected</p>
            </div>
            {selected.length > 0 && (
              <button onClick={() => setSelected([])} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Clear
              </button>
            )}
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4 max-h-36 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 space-y-1">
              {selectedProducts.slice(0, 8).map((product) => (
                <div key={product._id} className="truncate text-xs text-gray-600">{product.name}</div>
              ))}
              {selectedProducts.length > 8 && <div className="text-xs text-gray-400">+{selectedProducts.length - 8} more</div>}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Sale Controls</h3>
                  <p className="text-xs text-gray-500">Use percentage cut or exact sale price.</p>
                </div>
                <select value={bulk.isOnSale} onChange={(e) => setBulk((prev) => ({ ...prev, isOnSale: e.target.value === '' ? '' : e.target.value === 'true' }))} className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                  <option value="">Keep</option>
                  <option value="true">Sale On</option>
                  <option value="false">Sale Off</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" value={bulk.regularPrice} onChange={(e) => setBulk((prev) => ({ ...prev, regularPrice: e.target.value }))} placeholder="Regular price" className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white" />
                <input type="number" value={bulk.salePrice} onChange={(e) => setBulk((prev) => ({ ...prev, salePrice: e.target.value, discountPercent: '' }))} placeholder="Sale price" className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white" />
                <input type="number" value={bulk.discountPercent} onChange={(e) => setBulk((prev) => ({ ...prev, discountPercent: e.target.value, salePrice: '' }))} placeholder="Discount %" className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white" />
              </div>
              <p className="text-xs text-gray-500">Discount % calculates sale price from each product's regular price. Sale Off will show only regular price.</p>
            </div>
            <input type="number" value={bulk.stock} onChange={(e) => setBulk((prev) => ({ ...prev, stock: e.target.value }))} placeholder="Set stock quantity" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" />
            <select value={bulk.category} onChange={(e) => setBulk((prev) => ({ ...prev, category: e.target.value, subcategory: '' }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg">
              <option value="">Keep category</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select value={bulk.subcategory} onChange={(e) => setBulk((prev) => ({ ...prev, subcategory: e.target.value }))} disabled={!bulk.category || bulkSubcategories.length === 0} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">Keep subcategory</option>
              {bulkSubcategories.map((subcategory) => <option key={subcategory._id} value={subcategory._id}>{subcategory.name}</option>)}
            </select>
            <select value={bulk.brand} onChange={(e) => setBulk((prev) => ({ ...prev, brand: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg">
              <option value="">Keep brand</option>
              {brands.map((brand) => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
            </select>
            <input value={bulk.tags} onChange={(e) => setBulk((prev) => ({ ...prev, tags: e.target.value }))} placeholder="Replace tags: lawn, festive" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg" />

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Product Tags & Visibility</h3>
              {FLAG_FIELDS.map((flag) => (
                <div key={flag.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700">{flag.label}</span>
                  <select value={bulk[flag.key]} onChange={(e) => setBulk((prev) => ({ ...prev, [flag.key]: e.target.value === '' ? '' : e.target.value === 'true' }))} className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg">
                    <option value="">Keep</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              ))}
            </div>

            <button onClick={applyBulkChanges} disabled={saving || selected.length === 0} className="w-full py-3 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-40">
              {saving ? 'Saving...' : 'Apply Bulk Changes'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
