import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import API from '../../api/axios'
import { softyCategories, softyProducts, softySettings } from '../../data/softyCatalog'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [categories, setCategories] = useState(softyCategories)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [settings, setSettings] = useState(softySettings)
  const { cartCount } = useCart()
  const location = useLocation(); const navigate = useNavigate()
  useEffect(() => {
    API.get('/settings').then(({ data }) => setSettings(s => ({ ...s, ...(data.settings || {}) }))).catch(() => {})
    API.get('/categories').then(({ data }) => data.categories?.length && setCategories(data.categories)).catch(() => {})
  }, [])
  useEffect(() => {
    const value = query.trim()
    setActiveSuggestion(-1)
    if (value.length < 2) { setSuggestions([]); return undefined }
    const fallback = softyProducts.filter(product => `${product.name} ${product.description} ${(product.tags || []).join(' ')}`.toLowerCase().includes(value.toLowerCase())).slice(0, 4)
    const timer = setTimeout(() => {
      API.get(`/products?search=${encodeURIComponent(value)}&limit=4`)
        .then(({ data }) => setSuggestions(data.products?.length ? data.products.slice(0, 4) : fallback))
        .catch(() => setSuggestions(fallback))
    }, 180)
    return () => clearTimeout(timer)
  }, [query])
  const matchingCategories = useMemo(() => query.trim().length >= 2 ? categories.filter(category => category.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 2) : [], [categories, query])
  const resultItems = [...suggestions.map(product => ({ type: 'product', value: product })), ...matchingCategories.map(category => ({ type: 'category', value: category }))]
  const closeSearch = () => window.setTimeout(() => setSearchOpen(false), 140)
  const goSearch = event => { event?.preventDefault(); const value = query.trim(); setSearchOpen(false); navigate(value ? `/shop?search=${encodeURIComponent(value)}` : '/shop') }
  const chooseSuggestion = item => {
    setSearchOpen(false)
    if (item.type === 'product') navigate(`/product/${item.value.slug || item.value._id}`)
    else navigate(`/shop?category=${encodeURIComponent(item.value.slug || item.value._id)}`)
  }
  const onSearchKeyDown = event => {
    if (event.key === 'ArrowDown' && resultItems.length) { event.preventDefault(); setActiveSuggestion(index => Math.min(index + 1, resultItems.length - 1)); }
    if (event.key === 'ArrowUp' && resultItems.length) { event.preventDefault(); setActiveSuggestion(index => Math.max(index - 1, 0)); }
    if (event.key === 'Escape') setSearchOpen(false)
    if (event.key === 'Enter' && activeSuggestion >= 0) { event.preventDefault(); chooseSuggestion(resultItems[activeSuggestion]); }
  }
  const links = [['Best Sellers', '/shop?isBestSeller=true'], ['About', '/about'], ['Contact', '/contact']]
  const navCategories = categories.filter(category => category.isActive !== false).slice(0, 9)
  return <>
    <div className="softy-announcement">{settings.announcementText}</div>
    <header className="softy-header"><div className="softy-header-inner">
      <Link className="softy-logo" to="/" aria-label="Softy home"><img src="/brand/softy-ecom-logo-v2.png" alt="Softy" /></Link>
      <nav className="softy-nav" aria-label="Primary navigation">
        <div className="softy-nav-group">
          <Link className={location.pathname === '/shop' ? 'active' : ''} to="/shop">Shop</Link>
          <button className="softy-nav-toggle" type="button" aria-label="Browse product categories"><ChevronDown size={15}/></button>
          <div className="softy-category-menu">
            <div className="softy-category-menu-head"><span>Shop by category</span><Link to="/shop">All products <ArrowRight size={14}/></Link></div>
            <div className="softy-category-menu-grid">{navCategories.map(category => <Link key={category._id || category.slug} to={`/shop?category=${encodeURIComponent(category.slug || category._id)}`}><img src={category.image} alt=""/><span>{category.name}</span><ArrowRight size={14}/></Link>)}</div>
          </div>
        </div>
        {links.map(([label, href]) => <Link className={location.pathname === href.split('?')[0] ? 'active' : ''} key={label} to={href}>{label}</Link>)}
      </nav>
      <div className="softy-search-wrap">
        <form onSubmit={goSearch} className="softy-search"><Search size={18}/><input value={query} onFocus={() => setSearchOpen(true)} onBlur={closeSearch} onKeyDown={onSearchKeyDown} onChange={e => { setQuery(e.target.value); setSearchOpen(true) }} placeholder="Search products" aria-label="Search products" aria-expanded={searchOpen && query.trim().length >= 2} aria-controls="softy-search-suggestions" /></form>
        {searchOpen && query.trim().length >= 2 && <div id="softy-search-suggestions" className="softy-search-suggestions" role="listbox">
          {resultItems.length ? <>
            {suggestions.length > 0 && <p className="softy-search-label">Products</p>}
            {suggestions.map((product, index) => <button className={`softy-search-result ${activeSuggestion === index ? 'is-active' : ''}`} type="button" onMouseDown={event => event.preventDefault()} onClick={() => chooseSuggestion({ type: 'product', value: product })} key={product._id || product.slug} role="option" aria-selected={activeSuggestion === index}><img src={product.image || product.images?.[0]} alt=""/><span><strong>{product.name}</strong><small>{product.shortDescription || product.description}</small></span><b>BDT {Number(product.price || 0).toLocaleString('en-BD')}</b></button>)}
            {matchingCategories.length > 0 && <><p className="softy-search-label">Categories</p>{matchingCategories.map((category, offset) => { const index = suggestions.length + offset; return <button className={`softy-search-category ${activeSuggestion === index ? 'is-active' : ''}`} type="button" onMouseDown={event => event.preventDefault()} onClick={() => chooseSuggestion({ type: 'category', value: category })} key={category._id || category.slug} role="option" aria-selected={activeSuggestion === index}><span>{category.name}</span><ArrowRight size={15}/></button> })}</>}
            <button className="softy-search-all" type="button" onMouseDown={event => event.preventDefault()} onClick={goSearch}>See all results for “{query.trim()}” <ArrowRight size={15}/></button>
          </> : <div className="softy-search-empty"><strong>No close matches yet</strong><span>Search by product, skin concern, or routine.</span><button type="button" onMouseDown={event => event.preventDefault()} onClick={goSearch}>Browse the collection <ArrowRight size={15}/></button></div>}
        </div>}
      </div>
      <div className="softy-actions"><Link to="/account" aria-label="Your account"><UserRound size={21}/></Link><Link className="softy-bag" to="/cart" aria-label={`Cart with ${cartCount} items`}><ShoppingBag size={21}/>{cartCount > 0 && <b>{cartCount}</b>}</Link><button className="softy-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={24}/></button></div>
    </div></header>
    {menuOpen && <div className="softy-mobile-menu"><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X/></button><Link to="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link><div className="softy-mobile-category-links">{navCategories.map(category => <Link key={category._id || category.slug} to={`/shop?category=${encodeURIComponent(category.slug || category._id)}`} onClick={() => setMenuOpen(false)}>{category.name}<ArrowRight size={17}/></Link>)}</div>{links.map(([label, href]) => <Link key={label} to={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}<Link to="/track-order" onClick={() => setMenuOpen(false)}>Track order</Link></div>}
  </>
}
