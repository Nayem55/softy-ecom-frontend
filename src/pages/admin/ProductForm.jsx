import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import BulkImport from '../../components/common/BulkImport';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    additionalNote: '',
    regularPrice: '',
    salePrice: '',
    isOnSale: false,
    stock: '',
    category: '',
    subcategory: '',
    categories: [],
    subcategories: [],
    categoryRows: [{ category: '', subcategory: '' }],
    brand: '',
    sizes: [],
    colors: [],
    tags: '',
    isTrending: false,
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    isBridal: false,
    images: [],
    stitchVariations: [],
  });

  const availableSizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL',
    '28', '30', '32', '34', '36', '38', '40',
    'Free Size', 'One Size',
  ];

  const availableColors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Navy', hex: '#1E3A5F' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Purple', hex: '#9333EA' },
    { name: 'Orange', hex: '#EA580C' },
    { name: 'Brown', hex: '#92400E' },
    { name: 'Grey', hex: '#6B7280' },
    { name: 'Maroon', hex: '#881337' },
    { name: 'Teal', hex: '#0D9488' },
    { name: 'Beige', hex: '#D4C5A9' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Silver', hex: '#C0C0C0' },
  ];

  const getId = (value) => (typeof value === 'object' ? value?._id || value?.id || '' : value || '');
  const defaultRequiresSize = (type) => !String(type || '').toLowerCase().includes('unstitched');

  const uniqueIds = (values) => [...new Set(values.map(getId).filter(Boolean).map(String))];

  const getSubcategoryParent = (subcategoryId, list = subcategories) => {
    const subcategory = list.find((sub) => getId(sub._id) === getId(subcategoryId));
    return getId(subcategory?.category);
  };

  const buildCategoryRows = (product, list = subcategories) => {
    const categoryIds = uniqueIds(product.categories?.length ? product.categories : [product.category]);
    const subcategoryIds = uniqueIds(product.subcategories?.length ? product.subcategories : [product.subcategory]);
    const rows = [];
    const usedCategoryIds = new Set();

    subcategoryIds.forEach((subcategoryId) => {
      const parentId = getSubcategoryParent(subcategoryId, list) || categoryIds[0] || '';
      rows.push({ category: parentId, subcategory: subcategoryId });
      if (parentId) usedCategoryIds.add(parentId);
    });

    categoryIds.forEach((categoryId) => {
      if (!usedCategoryIds.has(categoryId)) rows.push({ category: categoryId, subcategory: '' });
    });

    return rows.length ? rows : [{ category: '', subcategory: '' }];
  };

  const syncCategoryRows = (rows) => {
    const cleanRows = rows.length ? rows : [{ category: '', subcategory: '' }];
    const normalizedRows = cleanRows.map((row) => {
      const parentFromSubcategory = row.subcategory ? getSubcategoryParent(row.subcategory) : '';
      return {
        category: parentFromSubcategory || row.category || '',
        subcategory: row.subcategory || '',
      };
    });
    const categoriesList = uniqueIds(normalizedRows.map((row) => row.category));
    const subcategoriesList = uniqueIds(normalizedRows.map((row) => row.subcategory));

    return {
      categoryRows: normalizedRows,
      categories: categoriesList,
      subcategories: subcategoriesList,
      category: categoriesList[0] || '',
      subcategory: subcategoriesList[0] || '',
    };
  };

  useEffect(() => {
    const load = async () => {
      const meta = await fetchMeta();
      if (isEditing) {
        await fetchProduct(meta?.subcategories || []);
      }
    };
    load();
  }, [id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markDirty = useCallback(() => {
    if (!isDirty) setIsDirty(true);
  }, [isDirty]);

  const fetchMeta = async () => {
    try {
      const [catRes, subRes, brandRes] = await Promise.all([
        adminAPI.get('/admin/categories'),
        adminAPI.get('/admin/subcategories'),
        adminAPI.get('/admin/brands'),
      ]);
      const nextCategories = catRes.data.categories || catRes.data || [];
      const nextSubcategories = subRes.data.subcategories || subRes.data || [];
      const nextBrands = brandRes.data.brands || brandRes.data || [];
      setCategories(nextCategories);
      setSubcategories(nextSubcategories);
      setBrands(nextBrands);
      return { categories: nextCategories, subcategories: nextSubcategories, brands: nextBrands };
    } catch (err) {
      console.error('Failed to fetch meta data:', err);
      return { categories: [], subcategories: [], brands: [] };
    }
  };

  const fetchProduct = async (subcategoryList = subcategories) => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await adminAPI.get(`/products/${id}`);
      const product = response.data.product || response.data;
      const regularPrice = product.regularPrice || (product.comparePrice && product.comparePrice > product.price ? product.comparePrice : product.price) || '';
      const salePrice = product.salePrice || (product.isOnSale || product.comparePrice ? product.price : '') || '';
      const categoryRows = buildCategoryRows(product, subcategoryList);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        additionalNote: product.additionalNote || '',
        regularPrice,
        salePrice,
        isOnSale: Boolean(product.isOnSale || (product.comparePrice && product.price < product.comparePrice)),
        stock: product.stock || '',
        ...syncCategoryRows(categoryRows),
        brand: product.brand?._id || product.brand || '',
        sizes: product.sizes || [],
        colors: product.colors || [],
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        isTrending: product.isTrending || false,
        isFeatured: product.isFeatured || false,
        isBestSeller: product.isBestSeller || false,
        isNew: product.isNew || false,
        isBridal: product.isBridal || false,
        images: product.images || [],
        stitchVariations: (product.stitchVariations || []).map((variation) => ({
          ...variation,
          requiresSize: variation.requiresSize ?? defaultRequiresSize(variation.type),
        })),
      });
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setFetchError(err.response?.data?.message || 'Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.regularPrice || Number(formData.regularPrice) <= 0) {
      errors.regularPrice = 'A valid regular price greater than 0 is required';
    }
    if (!formData.categories.length && !formData.categoryRows.some((row) => row.category)) {
      errors.category = 'Please select at least one category';
    }
    if (formData.isOnSale && (!formData.salePrice || Number(formData.salePrice) <= 0)) {
      errors.salePrice = 'Sale price is required when sale is enabled';
    }
    if (formData.isOnSale && Number(formData.salePrice) >= Number(formData.regularPrice)) {
      errors.salePrice = 'Sale price should be lower than regular price';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    markDirty();
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCategoryRowChange = (index, field, value) => {
    setFormData((prev) => {
      const rows = [...prev.categoryRows];
      rows[index] = {
        ...rows[index],
        [field]: value,
        ...(field === 'category' ? { subcategory: '' } : {}),
      };
      return { ...prev, ...syncCategoryRows(rows) };
    });
    markDirty();
    if (validationErrors.category) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        return next;
      });
    }
  };

  const addCategoryRow = () => {
    setFormData((prev) => ({
      ...prev,
      categoryRows: [...prev.categoryRows, { category: '', subcategory: '' }],
    }));
    markDirty();
  };

  const removeCategoryRow = (index) => {
    setFormData((prev) => {
      const rows = prev.categoryRows.filter((_, rowIndex) => rowIndex !== index);
      return { ...prev, ...syncCategoryRows(rows) };
    });
    markDirty();
  };

  const handleSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
    markDirty();
  };

  const handleColorToggle = (colorName) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter((c) => c !== colorName)
        : [...prev.colors, colorName],
    }));
    markDirty();
  };

  const handleAddStitchVariation = () => {
    setFormData((prev) => ({
      ...prev,
      stitchVariations: [...prev.stitchVariations, { type: '', price: '', salePrice: '', isOnSale: false, requiresSize: true }],
    }));
    markDirty();
  };

  const handleRemoveStitchVariation = (index) => {
    setFormData((prev) => ({
      ...prev,
      stitchVariations: prev.stitchVariations.filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const handleStitchVariationChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stitchVariations: prev.stitchVariations.map((v, i) => {
        if (i !== index) return v;
        const next = { ...v, [field]: value };
        if (field === 'type' && v.requiresSize === defaultRequiresSize(v.type)) {
          next.requiresSize = defaultRequiresSize(value);
        }
        return next;
      }),
    }));
    markDirty();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    setImageUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await adminAPI.post('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrls.push(response.data.url || response.data.imageUrl);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      markDirty();
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Image upload failed');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const taxonomy = syncCategoryRows(formData.categoryRows);
      const payload = {
        ...formData,
        ...taxonomy,
        regularPrice: Number(formData.regularPrice),
        salePrice: formData.isOnSale ? Number(formData.salePrice) : null,
        price: formData.isOnSale ? Number(formData.salePrice) : Number(formData.regularPrice),
        comparePrice: formData.isOnSale ? Number(formData.regularPrice) : null,
        stock: Number(formData.stock) || 0,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      delete payload.categoryRows;

      if (isEditing) {
        await adminAPI.put(`/admin/products/${id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await adminAPI.post('/admin/products', payload);
        toast.success('Product created successfully');
      }
      setIsDirty(false);
      navigate('/admin/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      const serverMsg = err.response?.data?.message;
      toast.error(serverMsg || 'Failed to save product');
      if (serverMsg) {
        setValidationErrors((prev) => ({ ...prev, server: serverMsg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigate = (path) => {
    if (isDirty) {
      setPendingNavigation(path);
      setShowLeaveConfirm(true);
    } else {
      navigate(path);
    }
  };

  const confirmLeave = () => {
    setIsDirty(false);
    setShowLeaveConfirm(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading product data..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorDisplay message={fetchError} onRetry={fetchProduct} fullPage />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isEditing ? 'Edit Product' : 'Add New Product'}
        subtitle={isEditing ? 'Update product information' : 'Fill in the details to create a new product'}
        actions={
          <button
            onClick={() => handleNavigate('/admin/products')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Products
          </button>
        }
      />

      {/* Instruction Box */}
      <InstructionBox
        title="How Product Fields Work"
        type="info"
        items={[
          'Product Name: Give your product a clear, descriptive name (required).',
          'Regular Price: The normal product price. Turn Sale on only when you want to show a discounted sale price.',
          'Category & Brand: Add one or more category rows. Subcategories stay linked to their parent category automatically.',
          'Colors: Add options only where a product is genuinely available in multiple shades or fragrances.',
          'Tags: Add comma-separated keywords (e.g., summer, casual) to improve searchability.',
          'Images: Upload up to 6 images. The first image becomes the main product photo.',
          'Product Flags: Toggle Trending, Featured, Best Seller, New Arrival, or Bridal Collection badges.',
        ]}
      />

      {/* Bulk Import Section */}
      {!isEditing && (
        <div>
          {!showBulkImport ? (
            <button
              onClick={() => setShowBulkImport(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-rose-400 hover:bg-rose-50/30 transition-all group"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-rose-600 transition-colors">Bulk Import from Excel</p>
                  <p className="text-xs text-gray-500">Import multiple products at once using an Excel spreadsheet</p>
                </div>
              </div>
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Bulk Import</h3>
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="text-xs text-gray-500 hover:text-rose-600 transition-colors"
                >
                  Switch to Single Product Form
                </button>
              </div>
              <BulkImport onImportComplete={() => {}} />
            </div>
          )}
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <InstructionBox
          title="Unsaved Changes"
          type="warning"
          items={['You have unsaved changes. Be sure to save before leaving this page.']}
        />
      )}

      {/* Server Error */}
      {validationErrors.server && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{validationErrors.server}</p>
        </div>
      )}

      {/* Single Product Form - hidden when bulk import is active (only on create) */}
      {(!showBulkImport || isEditing) && (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                  validationErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
                required
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Enter product description"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Product Description
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows={2}
                maxLength={220}
                placeholder="A concise benefit-led description shown below the price"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">Keep this to one or two customer-friendly sentences.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Note
              </label>
              <textarea
                name="additionalNote"
                value={formData.additionalNote}
                onChange={handleChange}
                rows={3}
                placeholder="Add a note to show above quantity on the product page"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Use this for delivery, fabric, customization, or ordering notes customers should see before adding to cart.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regular Price (BDT) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="regularPrice"
                value={formData.regularPrice}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                  validationErrors.regularPrice ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
                required
              />
              {validationErrors.regularPrice && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.regularPrice}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price (BDT)
              </label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={!formData.isOnSale}
                className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                  validationErrors.salePrice ? 'border-red-400 bg-red-50' : 'border-gray-200'
                } disabled:bg-gray-50 disabled:text-gray-400`}
              />
              {validationErrors.salePrice && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.salePrice}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <label className="sm:col-span-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-gray-800">Sale Status</span>
                <span className="block text-xs text-gray-500">When enabled, storefront shows sale price with regular price crossed out.</span>
              </span>
              <input
                type="checkbox"
                name="isOnSale"
                checked={formData.isOnSale}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
            </label>
          </div>
        </div>

        {/* Category & Brand */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Category & Brand</h2>
              <p className="mt-1 text-sm text-gray-500">Add every collection this product belongs to.</p>
            </div>
            <button
              type="button"
              onClick={addCategoryRow}
              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              + Add Category
            </button>
          </div>

          <div className="space-y-3">
            {formData.categoryRows.map((row, index) => {
              const rowSubcategories = subcategories.filter(
                (sub) => (sub.category?._id || sub.category) === row.category
              );

              return (
                <div key={index} className="grid grid-cols-1 items-end gap-4 rounded-lg border border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category {index === 0 && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      value={row.category}
                      onChange={(e) => handleCategoryRowChange(index, 'category', e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.category ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                      required={index === 0}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={row.subcategory}
                      onChange={(e) => handleCategoryRowChange(index, 'subcategory', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      disabled={!row.category || rowSubcategories.length === 0}
                    >
                      <option value="">
                        {!row.category
                          ? 'Select category first'
                          : rowSubcategories.length
                          ? 'Select Subcategory'
                          : 'No subcategories'}
                      </option>
                      {rowSubcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategoryRow(index)}
                    disabled={formData.categoryRows.length === 1}
                    className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              );
            })}

            {validationErrors.category && (
              <p className="text-xs text-red-500">{validationErrors.category}</p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fashion-only fields are intentionally hidden for cosmetics. */}
        <div className="hidden bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sizes</h2>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  formData.sizes.includes(size)
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Colors</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {availableColors.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => handleColorToggle(color.name)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                  formData.colors.includes(color.name)
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs font-medium text-gray-600">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stitch Variations</h2>
              <p className="text-sm text-gray-500 mt-1">Add different stitch types with separate prices (optional)</p>
            </div>
            <button
              type="button"
              onClick={handleAddStitchVariation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Variation
            </button>
          </div>

          {formData.stitchVariations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm text-gray-500 mb-1">No stitch variations added</p>
              <p className="text-xs text-gray-400">Click "Add Variation" to create stitched/unstitched options with different prices</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.stitchVariations.map((variation, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={variation.type}
                      onChange={(e) => handleStitchVariationChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      <option value="">Select type</option>
                      <option value="Stitched">Stitched</option>
                      <option value="Unstitched">Unstitched</option>
                      <option value="Semi-Stitched">Semi-Stitched</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Price (BDT)</label>
                    <input
                      type="number"
                      value={variation.price}
                      onChange={(e) => handleStitchVariationChange(index, 'price', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sale Price (BDT)</label>
                    <input
                      type="number"
                      value={variation.salePrice}
                      onChange={(e) => handleStitchVariationChange(index, 'salePrice', e.target.value)}
                      placeholder="Optional"
                      min="0"
                      disabled={!variation.isOnSale}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={variation.isOnSale}
                        onChange={(e) => handleStitchVariationChange(index, 'isOnSale', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      Sale
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={variation.requiresSize ?? defaultRequiresSize(variation.type)}
                        onChange={(e) => handleStitchVariationChange(index, 'requiresSize', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      Size Required
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveStitchVariation(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove variation"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formData.stitchVariations.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              {formData.stitchVariations.length} variation{formData.stitchVariations.length !== 1 ? 's' : ''} configured
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g. summer, casual, cotton (comma separated)"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Flags</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'isFeatured', label: 'Featured Product', desc: 'Show in featured section' },
              { name: 'isTrending', label: 'Trending Now', desc: 'Show in homepage Trending Now section' },
              { name: 'isBestSeller', label: 'Best Seller', desc: 'Mark as best selling product' },
              { name: 'isNew', label: 'New Arrival', desc: 'Show as new product' },
              { name: 'isBridal', label: 'Bridal Collection', desc: 'Part of bridal collection' },
            ].map((toggle) => (
              <label
                key={toggle.name}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{toggle.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{toggle.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData[toggle.name]}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      [toggle.name]: !prev[toggle.name],
                    }));
                    markDirty();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData[toggle.name] ? 'bg-rose-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData[toggle.name] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
          <p className="text-sm text-gray-500 mb-4">Upload up to 6 images. First image will be the main image.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {formData.images.map((imageUrl, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">
                    MAIN
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {formData.images.length < 6 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-rose-400 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                {imageUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-300 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-xs text-gray-500 mt-1">Add Image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageUploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => handleNavigate('/admin/products')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || imageUploading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEditing ? 'Update Product' : 'Create Product'
            )}
          </button>
        </div>
      </form>
      )}

      {/* Leave Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
              <p className="text-sm text-gray-500 mb-6">
                You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLeave}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors"
                >
                  Leave Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
