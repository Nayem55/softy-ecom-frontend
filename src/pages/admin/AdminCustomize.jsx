import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from './AdminLayout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const DEFAULT_HEADER_MENU = { enabled: true, label: 'Categories', showEmptyCategories: true };
const DEFAULT_BRAND_MENU = { enabled: true, label: 'Brands' };
const DEFAULT_SHIPPING_SETTINGS = { insideDhakaCharge: 60, outsideDhakaCharge: 120, freeShippingEnabled: true, freeShippingMin: 3000 };
const PRESET_LINKS = [
  { label: 'New Arrivals', url: '/shop?isNew=true' },
  { label: 'Trending', url: '/shop?isTrending=true' },
  { label: 'Best Sellers', url: '/shop?isBestSeller=true' },
  { label: 'Bridal', url: '/shop?isBridal=true', accent: true },
];

const tabs = [
  { id: 'header', label: 'Header' },
  { id: 'footer', label: 'Footer' },
  { id: 'pages', label: 'Pages' },
  { id: 'shipping', label: 'Shipping' },
];

export default function AdminCustomize() {
  const [activeTab, setActiveTab] = useState('header');
  const [settings, setSettings] = useState({ navLinks: [], headerCategoryMenu: DEFAULT_HEADER_MENU, headerBrandMenu: DEFAULT_BRAND_MENU, shippingSettings: DEFAULT_SHIPPING_SETTINGS });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminAPI.get('/settings'),
      adminAPI.get('/admin/categories').catch(() => ({ data: { categories: [] } })),
      adminAPI.get('/admin/subcategories').catch(() => ({ data: { subcategories: [] } })),
      adminAPI.get('/admin/brands').catch(() => ({ data: { brands: [] } })),
      adminAPI.get('/admin/pages').catch(() => ({ data: { pages: [] } })),
    ])
      .then(([settingsRes, categoriesRes, subcategoriesRes, brandsRes, pagesRes]) => {
        const siteSettings = settingsRes.data.settings || {};
        setSettings({
          ...siteSettings,
          navLinks: siteSettings.navLinks || [],
          headerCategoryMenu: { ...DEFAULT_HEADER_MENU, ...(siteSettings.headerCategoryMenu || {}) },
          headerBrandMenu: { ...DEFAULT_BRAND_MENU, ...(siteSettings.headerBrandMenu || {}) },
          shippingSettings: { ...DEFAULT_SHIPPING_SETTINGS, ...(siteSettings.shippingSettings || {}) },
        });
        setCategories(categoriesRes.data.categories || categoriesRes.data || []);
        setSubcategories(subcategoriesRes.data.subcategories || []);
        setBrands(brandsRes.data.brands || brandsRes.data || []);
        setPages(pagesRes.data.pages || []);
      })
      .catch(() => toast.error('Failed to load customize options.'))
      .finally(() => setLoading(false));
  }, []);

  const activeCategories = useMemo(() => categories.filter((category) => category.isActive !== false), [categories]);
  const activeSubcategories = useMemo(() => subcategories.filter((subcategory) => subcategory.isActive !== false), [subcategories]);
  const activeBrands = useMemo(() => brands.filter((brand) => brand.isActive !== false), [brands]);
  const groupedSubcategories = useMemo(() => activeSubcategories.reduce((acc, subcategory) => {
    const categoryId = typeof subcategory.category === 'object' ? subcategory.category?._id : subcategory.category;
    if (!categoryId) return acc;
    acc[categoryId] = [...(acc[categoryId] || []), subcategory];
    return acc;
  }, {}), [activeSubcategories]);

  const updateSetting = (path, value) => {
    const keys = path.split('.');
    setSettings((prev) => {
      const next = { ...prev };
      let target = next;
      for (let i = 0; i < keys.length - 1; i++) {
        target[keys[i]] = { ...(target[keys[i]] || {}) };
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateNavLinks = (links) => updateSetting('navLinks', links);
  const navLinks = settings.navLinks || [];
  const addNavLink = (link = {}) => updateNavLinks([...navLinks, { label: '', url: '', active: true, accent: false, ...link }]);
  const updateNavLink = (index, changes) => {
    const next = [...navLinks];
    next[index] = { ...next[index], ...changes };
    updateNavLinks(next);
  };
  const removeNavLink = (index) => updateNavLinks(navLinks.filter((_, i) => i !== index));
  const moveNavLink = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= navLinks.length) return;
    const next = [...navLinks];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateNavLinks(next);
  };

  const saveCustomize = async () => {
    setSaving(true);
    try {
      const cleaned = {
        ...settings,
        headerCategoryMenu: {
          ...DEFAULT_HEADER_MENU,
          ...(settings.headerCategoryMenu || {}),
          label: (settings.headerCategoryMenu?.label || 'Categories').trim() || 'Categories',
        },
        headerBrandMenu: {
          ...DEFAULT_BRAND_MENU,
          ...(settings.headerBrandMenu || {}),
          label: (settings.headerBrandMenu?.label || 'Brands').trim() || 'Brands',
        },
        shippingSettings: {
          ...DEFAULT_SHIPPING_SETTINGS,
          ...(settings.shippingSettings || {}),
          insideDhakaCharge: Number(settings.shippingSettings?.insideDhakaCharge) || 0,
          outsideDhakaCharge: Number(settings.shippingSettings?.outsideDhakaCharge) || 0,
          freeShippingEnabled: settings.shippingSettings?.freeShippingEnabled !== false,
          freeShippingMin: Number(settings.shippingSettings?.freeShippingMin) || 0,
        },
        navLinks: navLinks
          .map((link) => ({
            label: (link.label || '').trim(),
            url: (link.url || '').trim(),
            active: link.active !== false,
            accent: !!link.accent,
          }))
          .filter((link) => link.label && link.url),
      };
      await adminAPI.put('/admin/settings', cleaned);
      setSettings(cleaned);
      toast.success('Customize settings saved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save customize settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading customize options..." />;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Customize</h1>
          <p className="text-sm text-charcoal/55 mt-1">Control storefront header navigation, footer content, and page visibility from one place.</p>
        </div>
        <button onClick={saveCustomize} disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-oxblood px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-oxblood-dark disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Customize'}
        </button>
      </div>

      <div className="bg-white border border-line rounded-lg overflow-hidden">
        <div className="flex flex-wrap border-b border-line bg-ivory/40">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-white text-oxblood border-b-2 border-oxblood' : 'text-charcoal/60 hover:text-charcoal'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === 'header' && (
            <div className="space-y-6">
              <section className="rounded-lg border border-line p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal">Category Dropdown</h2>
                    <p className="text-sm text-charcoal/55 mt-1">Shows all active categories in the header. Hovering a category opens its subcategories.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-charcoal">
                    <input type="checkbox" checked={settings.headerCategoryMenu?.enabled !== false} onChange={(e) => updateSetting('headerCategoryMenu.enabled', e.target.checked)} />
                    Show in header
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-charcoal/55 mb-1.5">Dropdown Label</label>
                    <input value={settings.headerCategoryMenu?.label || ''} onChange={(e) => updateSetting('headerCategoryMenu.label', e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" />
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm text-charcoal">
                    <input type="checkbox" checked={settings.headerCategoryMenu?.showEmptyCategories !== false} onChange={(e) => updateSetting('headerCategoryMenu.showEmptyCategories', e.target.checked)} />
                    Show categories even when no subcategory exists
                  </label>
                </div>

                <div className="mt-5 rounded-lg bg-ivory/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-charcoal/55 mb-3">Live Structure Preview</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCategories.length === 0 ? (
                      <p className="text-sm text-charcoal/50">No active categories yet. Add categories from the Categories page.</p>
                    ) : (
                      activeCategories.map((category) => (
                        <div key={category._id} className="rounded-lg border border-line bg-white p-3">
                          <div className="font-semibold text-sm text-charcoal">{category.name}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(groupedSubcategories[category._id] || []).length === 0 ? (
                              <span className="text-xs text-charcoal/40">No subcategory</span>
                            ) : (
                              groupedSubcategories[category._id].map((subcategory) => (
                                <span key={subcategory._id} className="rounded-full bg-oxblood/10 px-2.5 py-1 text-xs text-oxblood">{subcategory.name}</span>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-line p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal">Brand Dropdown</h2>
                    <p className="text-sm text-charcoal/55 mt-1">Shows all active brands in the header. Customers can open a brand collection directly.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-charcoal">
                    <input type="checkbox" checked={settings.headerBrandMenu?.enabled !== false} onChange={(e) => updateSetting('headerBrandMenu.enabled', e.target.checked)} />
                    Show in header
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-charcoal/55 mb-1.5">Dropdown Label</label>
                    <input value={settings.headerBrandMenu?.label || ''} onChange={(e) => updateSetting('headerBrandMenu.label', e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" />
                  </div>
                  <div className="rounded-lg border border-line px-4 py-3 text-sm text-charcoal/65">
                    {activeBrands.length} active brand{activeBrands.length !== 1 ? 's' : ''} will appear in this menu.
                  </div>
                </div>

                <div className="mt-5 rounded-lg bg-ivory/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-charcoal/55 mb-3">Live Brand Preview</div>
                  {activeBrands.length === 0 ? (
                    <p className="text-sm text-charcoal/50">No active brands yet. Add brands from the Brands page.</p>
                  ) : (
                    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                      {activeBrands.map((brand) => (
                        <span key={brand._id} className="rounded-full bg-oxblood/10 px-3 py-1.5 text-xs font-medium text-oxblood">{brand.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-line p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal">Header Links</h2>
                    <p className="text-sm text-charcoal/55 mt-1">The Shop link is automatic. Add campaign, category, page, or custom links here.</p>
                  </div>
                  <button type="button" onClick={() => addNavLink()} className="rounded-lg border border-oxblood/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-oxblood hover:bg-oxblood hover:text-white">Add Link</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
                  {PRESET_LINKS.map((preset) => (
                    <button key={preset.url} type="button" onClick={() => addNavLink(preset)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:border-oxblood hover:text-oxblood">
                      + {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  <select value="" onChange={(e) => {
                    const category = activeCategories.find((item) => item._id === e.target.value);
                    if (category) addNavLink({ label: category.name, url: `/shop?category=${category.slug}` });
                  }} className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-oxblood focus:outline-none">
                    <option value="">Add category link...</option>
                    {activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                  </select>
                  <select value="" onChange={(e) => {
                    const brand = activeBrands.find((item) => item._id === e.target.value);
                    if (brand) addNavLink({ label: brand.name, url: `/shop?brand=${brand.slug}` });
                  }} className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-oxblood focus:outline-none">
                    <option value="">Add brand link...</option>
                    {activeBrands.map((brand) => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
                  </select>
                  <select value="" onChange={(e) => {
                    const page = pages.find((item) => item._id === e.target.value);
                    if (page) addNavLink({ label: page.title, url: `/${page.slug}` });
                  }} className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-oxblood focus:outline-none md:col-span-2">
                    <option value="">Add published page link...</option>
                    {pages.filter((page) => page.isPublished).map((page) => <option key={page._id} value={page._id}>{page.title}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  {navLinks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-charcoal/45">No custom header links yet.</div>
                  ) : (
                    navLinks.map((link, index) => (
                      <div key={index} className={`rounded-lg border p-4 ${link.active === false ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-line bg-white'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_auto] gap-3">
                          <input value={link.label || ''} onChange={(e) => updateNavLink(index, { label: e.target.value })} placeholder="Label" className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-oxblood focus:outline-none" />
                          <input value={link.url || ''} onChange={(e) => updateNavLink(index, { url: e.target.value })} placeholder="/shop?isTrending=true" className="rounded-lg border border-line px-3 py-2.5 text-sm focus:border-oxblood focus:outline-none" />
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => moveNavLink(index, -1)} disabled={index === 0} className="h-10 w-10 rounded-lg border border-line disabled:opacity-30" title="Move up">
                              <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => moveNavLink(index, 1)} disabled={index === navLinks.length - 1} className="h-10 w-10 rounded-lg border border-line disabled:opacity-30" title="Move down">
                              <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => removeNavLink(index)} className="h-10 w-10 rounded-lg border border-red-100 text-red-500 hover:bg-red-50" title="Remove">
                              <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-charcoal/65">
                          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={link.active !== false} onChange={(e) => updateNavLink(index, { active: e.target.checked })} /> Show</label>
                          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!link.accent} onChange={(e) => updateNavLink(index, { accent: e.target.checked })} /> Accent</label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              <section className="rounded-lg border border-line p-5">
                <h2 className="text-lg font-bold text-charcoal mb-4">Footer Content</h2>
                <label className="block text-xs uppercase tracking-wider text-charcoal/55 mb-1.5">Footer About Text</label>
                <textarea value={settings.footerAbout || ''} onChange={(e) => updateSetting('footerAbout', e.target.value)} rows={5} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Email" value={settings.contact?.email} onChange={(value) => updateSetting('contact.email', value)} />
                  <Field label="Phone" value={settings.contact?.phone} onChange={(value) => updateSetting('contact.phone', value)} />
                  <Field label="Address" value={settings.contact?.address} onChange={(value) => updateSetting('contact.address', value)} />
                  <Field label="Business Hours" value={settings.contact?.hours} onChange={(value) => updateSetting('contact.hours', value)} />
                </div>
              </section>
              <section className="rounded-lg border border-line p-5">
                <h2 className="text-lg font-bold text-charcoal mb-4">Social Links</h2>
                <div className="space-y-4">
                  <Field label="Facebook" value={settings.social?.fb} onChange={(value) => updateSetting('social.fb', value)} />
                  <Field label="Instagram" value={settings.social?.ig} onChange={(value) => updateSetting('social.ig', value)} />
                  <Field label="TikTok" value={settings.social?.tiktok} onChange={(value) => updateSetting('social.tiktok', value)} />
                  <Field label="YouTube" value={settings.social?.yt} onChange={(value) => updateSetting('social.yt', value)} />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'shipping' && (
            <section className="rounded-lg border border-line p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-charcoal">Shipping Charges</h2>
                  <p className="text-sm text-charcoal/55 mt-1">Checkout calculates delivery charge from the selected Bangladesh district.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-charcoal">
                  <input
                    type="checkbox"
                    checked={settings.shippingSettings?.freeShippingEnabled !== false}
                    onChange={(e) => updateSetting('shippingSettings.freeShippingEnabled', e.target.checked)}
                  />
                  Free shipping rule
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Inside Dhaka Charge (BDT)"
                  type="number"
                  value={settings.shippingSettings?.insideDhakaCharge}
                  onChange={(value) => updateSetting('shippingSettings.insideDhakaCharge', value)}
                />
                <Field
                  label="Outside Dhaka Charge (BDT)"
                  type="number"
                  value={settings.shippingSettings?.outsideDhakaCharge}
                  onChange={(value) => updateSetting('shippingSettings.outsideDhakaCharge', value)}
                />
                <Field
                  label="Free Shipping Minimum (BDT)"
                  type="number"
                  value={settings.shippingSettings?.freeShippingMin}
                  onChange={(value) => updateSetting('shippingSettings.freeShippingMin', value)}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-line bg-ivory/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-charcoal/55 mb-2">Inside Dhaka</div>
                  <div className="text-2xl font-bold text-charcoal">BDT {Number(settings.shippingSettings?.insideDhakaCharge || 0).toLocaleString('en-BD')}</div>
                  <p className="text-xs text-charcoal/50 mt-1">Applied when district is Dhaka.</p>
                </div>
                <div className="rounded-lg border border-line bg-ivory/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-charcoal/55 mb-2">Outside Dhaka</div>
                  <div className="text-2xl font-bold text-charcoal">BDT {Number(settings.shippingSettings?.outsideDhakaCharge || 0).toLocaleString('en-BD')}</div>
                  <p className="text-xs text-charcoal/50 mt-1">Applied for every other Bangladesh district.</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                {settings.shippingSettings?.freeShippingEnabled !== false
                  ? `Free shipping will apply when cart subtotal is BDT ${Number(settings.shippingSettings?.freeShippingMin || 0).toLocaleString('en-BD')} or higher.`
                  : 'Free shipping is disabled. District charges always apply.'}
              </div>
            </section>
          )}

          {activeTab === 'pages' && (
            <section className="rounded-lg border border-line p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-charcoal">Pages</h2>
                  <p className="text-sm text-charcoal/55 mt-1">Review published pages and add them to the header when needed.</p>
                </div>
                <Link to="/admin/pages" className="rounded-lg border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-charcoal hover:border-oxblood hover:text-oxblood">Manage Pages</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-ivory text-left text-xs uppercase tracking-wider text-charcoal/55">
                    <tr>
                      <th className="px-4 py-3">Page</th>
                      <th className="px-4 py-3">URL</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {pages.map((page) => (
                      <tr key={page._id}>
                        <td className="px-4 py-3 font-medium text-charcoal">{page.title}</td>
                        <td className="px-4 py-3 text-charcoal/60">/{page.slug}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs ${page.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{page.isPublished ? 'Published' : 'Draft'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" disabled={!page.isPublished} onClick={() => addNavLink({ label: page.title, url: `/${page.slug}` })} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-oxblood disabled:text-gray-300 disabled:cursor-not-allowed">
                            Add to Header
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pages.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-charcoal/45">No pages created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-charcoal/55 mb-1.5">{label}</label>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" />
    </div>
  );
}
