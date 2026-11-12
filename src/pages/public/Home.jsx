import { useEffect, useState } from 'react'
import { ArrowRight, Heart, Leaf, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import API from '../../api/axios'
import ProductCard from '../../components/common/ProductCard'
import SEO from '../../components/common/SEO'
import { catalogItems } from '../../data/apiCatalog'
import { optimizedImageUrl } from '../../utils/imageUrl'

export default function Home() {
  const [state, setState] = useState({ settings: null, products: [], categories: [] })
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    setStatus('loading')
    Promise.allSettled([API.get('/settings'), API.get('/products?limit=100&isActive=true'), API.get('/categories')]).then(([settings, products, categories]) => {
      if (!active) return
      const liveProducts = products.status === 'fulfilled' ? catalogItems(products.value.data, 'products') : null
      if (!liveProducts) { setStatus('error'); return }
      setState({
        settings: settings.status === 'fulfilled' ? settings.value.data.settings || {} : {},
        products: liveProducts,
        categories: categories.status === 'fulfilled' ? catalogItems(categories.value.data, 'categories') || [] : [],
      })
      setStatus('ready')
    })
    return () => { active = false }
  }, [])

  if (status === 'loading') return <div className="softy-shell softy-section"><p className="softy-note">Loading the latest collection…</p></div>
  if (status === 'error') return <div className="softy-shell softy-section"><div className="softy-empty"><strong>We can’t load the collection right now.</strong><p>Please refresh the page and try again.</p></div></div>

  const hero = state.settings?.homeHero || {}
  const promo = state.settings?.promo || {}

  return <div className="softy-home">
    <SEO />
    <section className="softy-hero">
      {hero.image && <img src={optimizedImageUrl(hero.image, { width: 2000, quality: 'auto:good' })} alt="Softy skincare ritual" />}
      <div className="softy-shell"><div className="softy-hero-copy"><span className="softy-eyebrow">{hero.eyebrow}</span><h1>{hero.title}</h1><p>{hero.description}</p><Link className="softy-button" to={hero.buttonLink || '/shop'}>{hero.buttonText || 'Shop skincare'} <ArrowRight size={17} /></Link></div></div>
    </section>
    <section className="softy-trust-band"><div className="softy-shell softy-trust"><div><Leaf size={22} />Gentle formulas</div><div><Heart size={22} />Made for daily care</div><div><ShieldCheck size={22} />Authentic products</div><div><Truck size={22} />Delivery across Bangladesh</div></div></section>
    <section className="softy-shell softy-section softy-needs">
      <div className="softy-needs-heading"><div><span className="softy-eyebrow">Shop by need</span><h2>Care made for your routine.</h2></div><div className="softy-needs-intro"><p>Build a routine around what your skin needs today, with a few dependable steps that feel easy to keep.</p><Link className="softy-text-link" to="/shop">All products <ArrowRight size={14} /></Link></div></div>
      <div className="softy-needs-grid">{state.categories.slice(0, 4).map((category, index) => {
        return <Link className="softy-need" to={`/shop?category=${category.slug || category._id}`} key={category._id}><div className="softy-need-art">{category.image && <img src={optimizedImageUrl(category.image, { width: 560 })} alt="" />}<span>{String(index + 1).padStart(2, '0')}</span></div><div className="softy-need-copy"><h3>{category.name}</h3>{category.description && <p>{category.description}</p>}<span className="softy-need-link">Explore <ArrowRight size={14} /></span></div></Link>
      })}</div>
    </section>
    <section className="softy-shell softy-section pt-0"><div className="softy-section-head"><div><span className="softy-eyebrow">Softy favorites</span><h2>Best sellers for everyday care.</h2></div><Link className="softy-text-link" to="/shop?isBestSeller=true">View all <ArrowRight size={14} /></Link></div>{state.products.filter((product) => product.isBestSeller).length ? <div className="softy-product-grid">{state.products.filter((product) => product.isBestSeller).slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}</div> : <div className="softy-empty">No best sellers are available yet.</div>}</section>
    {promo.image && <section className="softy-shell softy-section pt-0"><div className="softy-promo"><img src={optimizedImageUrl(promo.image, { width: 1000 })} alt="Softy skincare collection" /><div><span className="softy-eyebrow">Gentle care, real results</span><h2>{promo.title}</h2><p>{promo.description}</p><Link className="softy-button" to={promo.buttonLink || '/shop'}>{promo.buttonText || 'Explore products'} <ArrowRight size={17} /></Link></div></div></section>}
  </div>
}
