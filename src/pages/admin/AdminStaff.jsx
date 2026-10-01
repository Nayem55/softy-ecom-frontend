import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, useAdminAuth } from './AdminLayout';

const roles = [
  { value: 'admin', label: 'Admin - full access' },
  { value: 'store_manager', label: 'Store Manager - products, categories, brands and orders' },
  { value: 'ad_manager', label: 'Ad Manager - Google Analytics and Facebook Pixel' },
];

export default function AdminStaff() {
  const { admin } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'store_manager' });

  const load = async () => {
    try {
      const { data } = await adminAPI.get('/admin/staff');
      setStaff(data.staff || []);
    } catch (error) { toast.error(error.response?.data?.error || 'Could not load staff'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createStaff = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminAPI.post('/admin/staff', form);
      setForm({ name: '', email: '', password: '', role: 'store_manager' });
      toast.success('Staff account created');
      load();
    } catch (error) { toast.error(error.response?.data?.error || 'Could not create staff account'); }
    finally { setSaving(false); }
  };

  const updateStaff = async (id, changes) => {
    try {
      await adminAPI.patch(`/admin/staff/${id}`, changes);
      toast.success('Staff access updated');
      load();
    } catch (error) { toast.error(error.response?.data?.error || 'Could not update staff access'); }
  };

  if (admin?.role !== 'admin') return null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-bold">Staff Access</h1><p className="mt-1 text-sm text-charcoal/55">Create staff accounts and set exactly what each person can manage.</p></div>
      <form onSubmit={createStaff} className="bg-white border border-line rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-5">Add staff member</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs uppercase tracking-wider text-charcoal/60">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full border border-line px-4 py-3 text-sm" /></label>
          <label className="text-xs uppercase tracking-wider text-charcoal/60">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full border border-line px-4 py-3 text-sm" /></label>
          <label className="text-xs uppercase tracking-wider text-charcoal/60">Temporary password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 w-full border border-line px-4 py-3 text-sm" /></label>
          <label className="text-xs uppercase tracking-wider text-charcoal/60">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1.5 w-full border border-line px-4 py-3 text-sm">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
        </div>
        <button disabled={saving} className="mt-5 bg-oxblood text-white px-6 py-3 text-xs tracking-wider uppercase hover:bg-oxblood-dark disabled:opacity-50 rounded">{saving ? 'Creating...' : 'Create account'}</button>
      </form>
      <section className="bg-white border border-line rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-line font-semibold">Current staff</div>
        {loading ? <div className="p-6 text-sm text-charcoal/50">Loading staff...</div> : <div className="divide-y divide-line">{staff.map((member) => <div key={member._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 md:justify-between"><div><p className="font-medium">{member.name || member.email}</p><p className="text-sm text-charcoal/55">{member.email}</p></div><div className="flex items-center gap-3"><select value={member.role} disabled={member._id === admin._id} onChange={(e) => updateStaff(member._id, { role: e.target.value })} className="border border-line px-3 py-2 text-sm">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={member.active !== false} disabled={member._id === admin._id} onChange={(e) => updateStaff(member._id, { active: e.target.checked })} />Active</label></div></div>)}</div>}
      </section>
    </div>
  );
}
