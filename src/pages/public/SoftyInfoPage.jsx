import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react'
import API from '../../api/axios'
import SEO from '../../components/common/SEO'
import { softySettings } from '../../data/softyCatalog'

const pages = {
  about: { eyebrow: 'About Softy', title: 'Everyday care, made gentle.', body: 'Softy creates straightforward skincare for real routines. Our formulas are chosen to help customers care for their skin with comfort, confidence, and consistency.', points: ['Thoughtful everyday formulas', 'Original products you can trust', 'A local team that stays reachable'] },
  'shipping-policy': { eyebrow: 'Delivery', title: 'Clear delivery, from checkout to your door.', body: 'We prepare orders with care and keep delivery expectations simple. Inside Dhaka, most orders arrive within 24 to 48 hours. Outside Dhaka, delivery typically takes 2 to 4 business days.', points: ['Free delivery on qualifying orders', 'Delivery updates after confirmation', 'Support available when an order needs attention'] },
  'return-policy': { eyebrow: 'Returns & refunds', title: 'A fair, practical return policy.', body: 'If an item arrives damaged, defective, or different from your confirmed order, please contact our team promptly. We will review the issue and guide you through the appropriate exchange or resolution.', points: ['Keep the product sealed where possible', 'Contact us with your order details', 'Each request is reviewed by our support team'] },
}

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' }); const [state, setState] = useState('idle')
  const submit = async (event) => { event.preventDefault(); setState('sending'); try { await API.post('/contact', form); setState('sent'); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) } catch { setState('error') } }
  return <section className="softy-info"><SEO title="Contact" description="Contact Softy customer care in Bangladesh." /><div className="softy-shell softy-info-grid"><div><span className="softy-eyebrow">Customer care</span><h1>We are here when you need us.</h1><p>For product questions, order support, or partnership enquiries, send a note and our team will get back to you.</p><div className="softy-contact-details"><a href={`mailto:${softySettings.contact.email}`}><Mail size={18}/>{softySettings.contact.email}</a><a href="tel:01911238421"><Phone size={18}/>{softySettings.contact.phone}</a><span><MapPin size={18}/>{softySettings.contact.address}</span></div></div><form onSubmit={submit} className="softy-contact-form"><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Subject<input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label><label className="softy-form-full">Message<textarea required rows="5" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label>{state==='sent'&&<p className="softy-form-success">Thank you. Your message is with the Softy team.</p>}{state==='error'&&<p className="softy-form-error">We could not send that message. Please try again shortly.</p>}<button className="softy-button softy-form-full" disabled={state==='sending'}>{state==='sending' ? 'Sending...' : 'Send message'}</button></form></div></section>
}

export default function SoftyInfoPage({ page }) {
  if (page === 'contact') return <ContactPage />
  const content = pages[page] || pages.about
  return <section className="softy-info"><SEO title={content.eyebrow} description={content.body} /><div className="softy-shell softy-info-grid"><div><span className="softy-eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.body}</p><Link className="softy-button" to="/shop">Shop Softy</Link></div><div className="softy-info-card"><img src="/editorial/softyy-lab-ritual.png" alt="Softy skincare ritual" /><div>{content.points.map(point=><p key={point}><CheckCircle2 size={18}/>{point}</p>)}</div></div></div></section>
}
