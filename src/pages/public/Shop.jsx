import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import API from '../../api/axios'
import ProductCard from '../../components/common/ProductCard'
import SEO from '../../components/common/SEO'
import { softyCategories, softyProducts } from '../../data/softyCatalog'

export default function Shop() {
  const [params, setParams] = useSearchParams(); const [products, setProducts] = useState(softyProducts); const [categories, setCategories] = useState(softyCategories); const [offline, setOffline] = useState(false)
  const selected = params.get('category') || ''; const query = params.get('search') || ''; const best = params.get('isBestSeller') === 'true'
  useEffect(() => { const search = new URLSearchParams(params); search.set('limit','100'); API.get(`/products?${search}`).then(({data}) => { setProducts(data.products || []); setOffline(false) }).catch(() => setOffline(true)); API.get('/categories').then(({data}) => data.categories?.length && setCategories(data.categories)).catch(() => {}) }, [params])
  const selectedCategory = useMemo(() => categories.find((category) => category.slug === selected || String(category._id) === selected), [categories, selected])
  const display = useMemo(() => {
    const selectedKeys = new Set([selected, selectedCategory?.slug, selectedCategory?._id?.toString()].filter(Boolean))
    const matchesCategory = (product) => {
      if (!selected) return true
      const productKeys = [product.category, ...(product.categories || [])]
        .flatMap((category) => typeof category === 'object' ? [category._id, category.slug] : [category])
        .filter(Boolean)
        .map(String)
      return productKeys.some((key) => selectedKeys.has(key))
    }
    return products.filter((product) => matchesCategory(product) && (!best || product.isBestSeller) && (!query || `${product.name} ${product.description} ${(product.concerns || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())))
  }, [products, selected, selectedCategory, best, query])
  const choose = slug => { const next = new URLSearchParams(params); slug ? next.set('category',slug) : next.delete('category'); setParams(next) }
  return <><SEO title="Shop skincare"/><section className="softy-shop-hero"><div className="softy-shell"><span className="softy-eyebrow">Softy skincare</span><h1>Everyday care for real life.</h1><p className="softy-note">Simple, gentle products selected around the way you care for your skin.</p></div></section><div className="softy-shell softy-shop-layout"><aside className="softy-filters"><h3>Categories</h3><button className={`softy-filter-button ${!selected?'active':''}`} onClick={() => choose('')}>All products</button>{categories.map(category => <button className={`softy-filter-button ${selected === category.slug || selected === category._id ? 'active':''}`} onClick={() => choose(category.slug || category._id)} key={category._id}>{category.name}</button>)}<button className={`softy-filter-button ${best?'active':''}`} onClick={() => { const next = new URLSearchParams(params); best ? next.delete('isBestSeller') : next.set('isBestSeller','true'); setParams(next) }}>Best sellers</button></aside><section>{offline && <p className="softy-error">You are viewing Softy’s local catalog while the server reconnects.</p>}<div className="softy-shop-meta"><strong>{display.length} products</strong><span className="softy-note">{query ? `Results for “${query}”` : 'Care chosen for your routine'}</span></div>{display.length ? <div className="softy-product-grid">{display.map(product => <ProductCard key={product._id} product={product}/>)}</div> : <div className="softy-empty">No products match those filters.</div>}</section></div></>
}
