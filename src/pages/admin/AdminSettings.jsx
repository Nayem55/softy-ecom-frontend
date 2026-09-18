import { useState, useEffect } from 'react';
import { adminAPI } from './AdminLayout';
import toast from 'react-hot-toast';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const getSettingValue = (settings, path) => {
  const keys = path.split('.');
  let value = settings;
  for (const key of keys) value = value?.[key];
  return value;
};

function Section({ title, id, expanded, onToggle, children }) {
  return (
    <div className="bg-white border border-line rounded-lg mb-4 overflow-hidden">
      <button type="button" onClick={() => onToggle(id)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-ivory/50 transition-colors">
        <h3 className="font-semibold text-sm tracking-wider uppercase">{title}</h3>
        <span className="text-charcoal/40 text-lg">{expanded[id] ? '-' : '+'}</span>
      </button>
      {expanded[id] && <div className="px-6 pb-6 border-t border-line pt-4">{children}</div>}
    </div>
  );
}

function Field({ label, path, settings, onChange, type = 'text', ...props }) {
  const value = getSettingValue(settings, path);
  return (
    <div className="mb-4">
      <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(path, e.target.value)} rows={3} className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none resize-none" {...props} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(path, e.target.value)} className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" {...props} />
      )}
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [expanded, setExpanded] = useState({ general: true, payment: true, policies: false, announcement: false });

  useEffect(() => {
    adminAPI.get('/settings')
      .then((settingsRes) => {
        const siteSettings = settingsRes.data.settings || {};
        setSettings(siteSettings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (section) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setSettings(prev => {
      const next = { ...prev };
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...(obj[keys[i]] || {}) };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedSettings = {
        ...settings,
        navLinks: (settings.navLinks || [])
          .map((link) => ({
            label: (link.label || '').trim(),
            url: (link.url || '').trim(),
            active: link.active !== false,
            accent: !!link.accent,
          }))
          .filter((link) => link.label && link.url),
      };
      await adminAPI.put('/admin/settings', cleanedSettings);
      setSettings(cleanedSettings);
      toast.success('All settings saved successfully! Changes are now live on the storefront.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings.');
    }
    setSaving(false);
  };

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminAPI.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      handleChange(field, res.data.url);
      toast.success('Image uploaded!');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed';
      toast.error(msg);
    }
    setUploading(null);
  };

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Site Settings</h1>
        <button onClick={handleSave} disabled={saving} className="bg-oxblood text-white px-6 py-2.5 text-xs tracking-wider uppercase hover:bg-oxblood-dark transition-colors disabled:opacity-50 rounded">{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      <InstructionBox
        title="About Settings"
        items={[
          'Manage core storefront settings that are not part of layout customization.',
          'Company name and logo appear on the site header and branding.',
          'bKash number is displayed at checkout for payment instructions.',
          'Delivery and policy text can be used for checkout/help content.',
          'Header, footer, page links, contact, and social content now live under Customize.',
        ]}
      />

      <Section title="General" id="general" expanded={expanded} onToggle={toggle}>
        <div className="mb-3">
          <p className="text-xs text-charcoal/50 italic">Company name and logo appear on the site header and branding elements.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name" path="companyName" settings={settings} onChange={handleChange} />
          <Field label="Slogan" path="slogan" settings={settings} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Logo</label>
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-16 mb-2 border rounded p-2" />}
            <label className="block bg-charcoal text-white px-4 py-2.5 text-xs tracking-wider uppercase cursor-pointer hover:bg-oxblood-dark transition-colors rounded text-center">
              {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('logo', e.target.files[0])} />
            </label>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Favicon</label>
            {settings.favicon && <img src={settings.favicon} alt="Favicon" className="h-10 mb-2 border rounded p-2" />}
            <label className="block bg-charcoal text-white px-4 py-2.5 text-xs tracking-wider uppercase cursor-pointer hover:bg-oxblood-dark transition-colors rounded text-center">
              {uploading === 'favicon' ? 'Uploading...' : 'Upload Favicon'}
              <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('favicon', e.target.files[0])} />
            </label>
          </div>
        </div>
      </Section>

      <Section title="Payment" id="payment" expanded={expanded} onToggle={toggle}>
        <div className="mb-3">
          <p className="text-xs text-charcoal/50 italic">The bKash number is shown at checkout so customers know where to send payment.</p>
        </div>
        <Field label="bKash Number" path="bkashNumber" settings={settings} onChange={handleChange} placeholder="01XXXXXXXXX" />
        <p className="text-xs text-charcoal/50 mt-1">Customers will be asked to send money to this number for bKash payments.</p>
      </Section>

      <Section title="Delivery & Policies" id="policies" expanded={expanded} onToggle={toggle}>
        <div className="mb-3">
          <p className="text-xs text-charcoal/50 italic">Policy content is displayed on your storefront help/policy pages.</p>
        </div>
        <Field label="Delivery Information" path="deliveryInfo" settings={settings} onChange={handleChange} type="textarea" />
        <Field label="Return Policy" path="returnPolicy" settings={settings} onChange={handleChange} type="textarea" />
        <Field label="Terms & Conditions" path="terms" settings={settings} onChange={handleChange} type="textarea" />
      </Section>

      <Section title="Announcement Bar" id="announcement" expanded={expanded} onToggle={toggle}>
        <Field label="Announcement Text" path="announcementText" settings={settings} onChange={handleChange} />
        <p className="text-xs text-charcoal/50 mt-1">This text scrolls in the top bar on the storefront.</p>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="bg-oxblood text-white px-8 py-3 text-xs tracking-wider uppercase hover:bg-oxblood-dark transition-colors disabled:opacity-50 rounded shadow-lg">{saving ? 'Saving...' : 'Save All Settings'}</button>
      </div>
    </div>
  );
}
