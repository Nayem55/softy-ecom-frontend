import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const { user } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const productsPerPage = 12;

  const triggerSearch = useCallback(() => {
    setDebouncedSearchTerm(searchTerm.trim());
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearchTerm, filterCategory]);

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage,
        limit: productsPerPage,
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterCategory) params.append('category', filterCategory);

      const response = await adminAPI.get(`/admin/products?${params}`);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalProducts(response.data.totalProducts || 0);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        adminAPI.get('/admin/categories'),
        adminAPI.get('/admin/subcategories'),
      ]);
      setCategories(catRes.data.categories || catRes.data || []);
      setSubcategories(subRes.data.subcategories || subRes.data || []);
    } catch (err) {
      console.error('Failed to fetch product meta:', err);
    }
  };

  const getId = (value) => (typeof value === 'object' ? value?._id || value?.id : value);
  const uniqueIds = (values) => [...new Set((Array.isArray(values) ? values : [values]).map(getId).filter(Boolean))];
  const getCategoryName = (product) => {
    const categoryIds = uniqueIds(product.categories?.length ? product.categories : product.category);
    const names = categoryIds
      .map((categoryId) => categories.find((cat) => cat._id === categoryId)?.name)
      .filter(Boolean);
    return names.length ? names.join(', ') : product.category?.name || 'Uncategorized';
  };
  const getSubcategoryName = (product) => {
    const subcategoryIds = uniqueIds(product.subcategories?.length ? product.subcategories : product.subcategory);
    const names = subcategoryIds
      .map((subcategoryId) => subcategories.find((sub) => sub._id === subcategoryId)?.name)
      .filter(Boolean);
    return names.length ? names.join(', ') : product.subcategory?.name || '';
  };

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryFilter = useCallback((e) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map((p) => p._id));
      setShowBulkBar(true);
    } else {
      setSelectedProducts([]);
      setShowBulkBar(false);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) => {
      const newSelection = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      setShowBulkBar(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleToggleActive = async (productId, currentStatus) => {
    try {
      await adminAPI.put(`/admin/products/${productId}`, {
        isActive: !currentStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isActive: !currentStatus } : p
        )
      );
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      toast.error('Failed to update product status');
    }
  };

  const handleDelete = async (productId) => {
    try {
      await adminAPI.delete(`/admin/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      setDeleteConfirm(null);
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Failed to delete product');
    }
  };

  const handleBulkAction = async () => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected');
      return;
    }

    // Confirm bulk delete
    if (bulkAction === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      let payload = {};
      let endpoint = '';

      switch (bulkAction) {
        case 'delete':
          await adminAPI.post('/admin/products/bulk-delete', {
            ids: selectedProducts,
          });
          setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p._id)));
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} deleted successfully`);
          break;

        case 'activate':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isActive: true },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isActive: true } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} activated`);
          break;

        case 'deactivate':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isActive: false },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isActive: false } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} deactivated`);
          break;

        case 'featured':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isFeatured: true },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isFeatured: true } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} marked as featured`);
          break;

        case 'trending':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isTrending: true },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isTrending: true } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} marked as trending`);
          break;

        case 'untrending':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isTrending: false },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isTrending: false } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} removed from trending`);
          break;

        case 'unfeatured':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isFeatured: false },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isFeatured: false } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} unmarked as featured`);
          break;

        case 'bestseller':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isBestSeller: true },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isBestSeller: true } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} marked as bestseller`);
          break;

        case 'unbestseller':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isBestSeller: false },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isBestSeller: false } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} removed from best sellers`);
          break;

        case 'new':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isNew: true },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isNew: true } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} marked as new arrivals`);
          break;

        case 'unnew':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isNew: false },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isNew: false } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} removed from new arrivals`);
          break;

        case 'bridal':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isBridal: true },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isBridal: true } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} marked as bridal`);
          break;

        case 'unbridal':
          await adminAPI.put('/admin/products/bulk-update', {
            ids: selectedProducts,
            updates: { isBridal: false },
          });
          setProducts((prev) =>
            prev.map((p) =>
              selectedProducts.includes(p._id) ? { ...p, isBridal: false } : p
            )
          );
          toast.success(`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} removed from bridal`);
          break;

        default:
          toast.error('Select an action');
          return;
      }

      setSelectedProducts([]);
      setShowBulkBar(false);
      setBulkAction('');
    } catch (err) {
      console.error('Bulk action failed:', err);
      toast.error('Bulk action failed: ' + (err.response?.data?.message || 'Please try again'));
    }
  };

  const formatPrice = (price) => {
    return `BDT ${Number(price || 0).toLocaleString('en-BD')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorDisplay message={error} onRetry={fetchProducts} fullPage />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Products"
        subtitle={`${totalProducts} total product${totalProducts !== 1 ? 's' : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/products/bulk-edit"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
            >
              Bulk Edit
            </Link>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Product
            </Link>
          </div>
        }
      />

      {/* Instruction Box */}
      <InstructionBox
        title="Products Page Features"
        type="info"
        items={[
          'Search products by name, slug, product ID, tag, category, or brand using the search bar above.',
          'Filter products by category to narrow down your view.',
          'Select multiple products to perform bulk actions (activate, deactivate, delete, etc.).',
          'Toggle individual product status (active/inactive) using the switch button.',
          'Click the edit icon to modify product details, or the delete icon to remove a product.',
        ]}
      />

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search products by name, ID, tag, category, or brand..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={(e) => { if (e.key === 'Enter') triggerSearch(); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={triggerSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition-colors"
            >
              Search
            </button>
          </div>
          <select
            value={filterCategory}
            onChange={handleCategoryFilter}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkBar && selectedProducts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <InstructionBox
            title={`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} selected`}
            type="warning"
            items={['Choose an action below and click Apply to perform bulk operations.']}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-1.5 text-sm border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Select Action</option>
              <option value="delete">Delete Selected</option>
              <option value="activate">Set Active</option>
              <option value="deactivate">Set Inactive</option>
              <option value="featured">Set Featured</option>
              <option value="unfeatured">Remove Featured</option>
              <option value="trending">Set Trending</option>
              <option value="untrending">Remove Trending</option>
              <option value="bestseller">Set Bestseller</option>
              <option value="unbestseller">Remove Bestseller</option>
              <option value="new">Set New Arrival</option>
              <option value="unnew">Remove New Arrival</option>
              <option value="bridal">Set Bridal</option>
              <option value="unbridal">Remove Bridal</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-1.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setSelectedProducts([]);
                setShowBulkBar(false);
                setBulkAction('');
              }}
              className="px-4 py-1.5 text-sm font-medium text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {products.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            }
            title={searchTerm || filterCategory ? 'No products found' : 'No products yet'}
            description={searchTerm || filterCategory ? 'Try adjusting your search or filter criteria.' : 'Get started by adding your first product to the store.'}
            actionLabel={searchTerm || filterCategory ? undefined : 'Add Product'}
            actionLink={searchTerm || filterCategory ? undefined : '/admin/products/new'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedProducts.length === products.length && products.length > 0}
                        className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Stock</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleSelectProduct(product._id)}
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 lg:hidden">
                              {getCategoryName(product)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getCategoryName(product)}
                        </span>
                        {getSubcategoryName(product) && (
                          <span className="block mt-1 text-xs text-gray-400">
                            {getSubcategoryName(product)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const regularPrice = product.regularPrice || (product.comparePrice && product.comparePrice > product.price ? product.comparePrice : product.price);
                          const salePrice = product.salePrice || product.price;
                          const isOnSale = product.isOnSale && salePrice > 0 && salePrice < regularPrice;
                          return (
                            <>
                              <p className="font-medium text-gray-900">
                                {formatPrice(isOnSale ? salePrice : regularPrice)}
                              </p>
                              {isOnSale && (
                                <p className="text-xs text-gray-400 line-through">
                                  {formatPrice(regularPrice)}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={`text-sm ${
                            product.stock > 10
                              ? 'text-emerald-600'
                              : product.stock > 0
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(product._id, product.isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            product.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              product.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {product.isFeatured && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              F
                            </span>
                          )}
                          {product.isTrending && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              T
                            </span>
                          )}
                          {product.isBestSeller && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              B
                            </span>
                          )}
                          {product.isNew && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              N
                            </span>
                          )}
                          {product.isBridal && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700">
                              R
                            </span>
                          )}
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Link>
                          {deleteConfirm === product._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product._id)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                    )
                    .reduce((acc, page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) {
                        acc.push('...');
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-rose-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
