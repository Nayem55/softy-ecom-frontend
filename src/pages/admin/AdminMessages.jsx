import { useEffect, useState } from 'react'
import { adminAPI } from './AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'

export default function AdminMessages() {
  const [messages, setMessages] = useState([]); const [loading, setLoading] = useState(true)
  const load = async () => { try { const { data } = await adminAPI.get('/admin/messages'); setMessages(data.messages || []) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const setStatus = async (id, status) => { await adminAPI.put(`/admin/messages/${id}`, { status }); setMessages(items => items.map(item => item._id === id ? { ...item, status } : item)) }
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" text="Loading messages..." /></div>
  return <div><PageHeader title="Customer Messages" subtitle="Enquiries received from the Softy contact page." /><div className="bg-white border border-line rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-ivory text-left text-charcoal/60"><tr><th className="p-4">Customer</th><th className="p-4">Message</th><th className="p-4">Received</th><th className="p-4">Status</th></tr></thead><tbody>{messages.length ? messages.map(message => <tr key={message._id} className="border-t border-line align-top"><td className="p-4"><strong>{message.name}</strong><br/><a className="text-oxblood text-xs" href={`mailto:${message.email}`}>{message.email}</a><br/><span className="text-xs text-charcoal/60">{message.phone}</span></td><td className="p-4 max-w-md"><strong className="block mb-1">{message.subject}</strong><span className="text-charcoal/70 whitespace-pre-wrap">{message.message}</span></td><td className="p-4 text-charcoal/60 whitespace-nowrap">{new Date(message.createdAt).toLocaleDateString('en-BD')}</td><td className="p-4"><select aria-label={`Status for ${message.subject}`} value={message.status || 'new'} onChange={event => setStatus(message._id, event.target.value)} className="border border-line rounded-md px-2 py-1 bg-white"><option value="new">New</option><option value="read">Read</option><option value="resolved">Resolved</option></select></td></tr>) : <tr><td colSpan="4" className="p-10 text-center text-charcoal/60">No customer messages yet.</td></tr>}</tbody></table></div></div></div>
}
