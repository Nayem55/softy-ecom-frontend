import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../api/axios'
import SEO from '../../components/common/SEO'

export default function Blog() {
  const [blogs, setBlogs] = useState([]); const [status, setStatus] = useState('loading')
  useEffect(() => { API.get('/blogs').then(({ data }) => { setBlogs(data.blogs || []); setStatus('ready') }).catch(() => setStatus('error')) }, [])
  return <section className="softy-shell py-16"><SEO title="Journal"/><span className="softy-eyebrow">Softy journal</span><h1 className="font-serif text-5xl text-oxblood mb-5">Stories for your routine.</h1>{status === 'loading' ? <p>Loading posts…</p> : status === 'error' ? <p>We can’t load posts right now.</p> : blogs.length ? <div className="grid gap-7 md:grid-cols-3">{blogs.map(post => <article key={post._id} className="border border-charcoal/10 rounded-xl overflow-hidden bg-white">{post.image && <img className="w-full h-52 object-cover" src={post.image} alt=""/>}<div className="p-5"><p className="text-xs uppercase tracking-widest text-oxblood">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-BD') : ''}</p><h2 className="font-serif text-2xl mt-2">{post.title}</h2><p className="text-charcoal/70 mt-3">{post.excerpt}</p><Link className="inline-block mt-4 font-semibold text-oxblood" to={`/blog/${post.slug}`}>Read article →</Link></div></article>)}</div> : <p>No posts have been published yet.</p>}</section>
}
