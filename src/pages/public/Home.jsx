import { useEffect, useState } from 'react'
import { ArrowRight, Heart, Leaf, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import API from '../../api/axios'
import ProductCard from '../../components/common/ProductCard'
import SEO from '../../components/common/SEO'
import { softyCategories, softyProducts, softySettings } from '../../data/softyCatalog'
import { optimizedImageUrl } from '../../utils/imageUrl'

const categoryCopy = {
  'face-care': { eyebrow: 'Daily cleanse', description: 'Fresh starts for every skin day.' },
  serums: { eyebrow: 'Targeted care', description: 'A focused step for your routine.' },
  'soothing-care': { eyebrow: 'Comfort first', description: 'Light relief for tired-feeling skin.' },
  'daily-essentials': { eyebrow: 'Everyday staples', description: 'Simple care worth repeating.' },
}

export default function Home() {
  const [state, setState] = useState({ settings: softySettings, products: softyProducts, categories: softyCategories })

  useEffect(() => {
    Promise.allSettled([API.get('/settings'), API.get('/products?limit=8&isActive=true'), API.get('/categories')]).then(([settings, products, categories]) => {
      setState((old) => ({
        settings: settings.status === 'fulfilled' ? { ...old.settings, ...(settings.value.data.settings || {}) } : old.settings,
        products: products.status === 'fulfilled' && products.value.data.products?.length ? products.value.data.products : old.products,
        categories: categories.status === 'fulfilled' && categories.value.data.categories?.length ? categories.value.data.categories : old.categories,
      }))
    })
  }, [])

  const hero = state.settings.homeHero || softySettings.homeHero
  const promo = state.settings.promo || softySettings.promo

  return <div className="softy-home">
    <SEO />
    <section className="softy-hero">
      <img src={optimizedImageUrl(hero.image || softySettings.homeHero.image, { width: 2000, quality: 'auto:good' })} alt="Softy skincare ritual" />
      <div className="softy-shell"><div className="softy-hero-copy"><span className="softy-eyebrow">{hero.eyebrow || 'Everyday care'}</span><h1>{hero.title || softySettings.homeHero.title}</h1><p>{hero.description || softySettings.homeHero.description}</p><Link className="softy-button" to={hero.buttonLink || '/shop'}>{hero.buttonText || 'Shop skincare'} <ArrowRight size={17} /></Link></div></div>
    </section>
    <section className="softy-trust-band"><div className="softy-shell softy-trust"><div><Leaf size={22} />Gentle formulas</div><div><Heart size={22} />Made for daily care</div><div><ShieldCheck size={22} />Authentic products</div><div><Truck size={22} />Delivery across Bangladesh</div></div></section>
    <section className="softy-shell softy-section softy-needs">
      <div className="softy-needs-heading"><div><span className="softy-eyebrow">Shop by need</span><h2>Care made for your routine.</h2></div><div className="softy-needs-intro"><p>Build a routine around what your skin needs today, with a few dependable steps that feel easy to keep.</p><Link className="softy-text-link" to="/shop">All products <ArrowRight size={14} /></Link></div></div>
      <div className="softy-needs-grid">{state.categories.slice(0, 4).map((category, index) => {
        const copy = categoryCopy[category.slug] || { eyebrow: 'Softy care', description: category.description || 'Thoughtful care for your everyday routine.' }
        return <Link className="softy-need" to={`/shop?category=${category.slug || category._id}`} key={category._id}><div className="softy-need-art"><img src={optimizedImageUrl(category.image || '/products/softyy/lemon-face-wash.jpg', { width: 560 })} alt="" /><span>{String(index + 1).padStart(2, '0')}</span></div><div className="softy-need-copy"><small>{copy.eyebrow}</small><h3>{category.name}</h3><p>{copy.description}</p><span className="softy-need-link">Explore <ArrowRight size={14} /></span></div></Link>
      })}</div>
    </section>
    <section className="softy-shell softy-section pt-0"><div className="softy-section-head"><div><span className="softy-eyebrow">Softy favorites</span><h2>Best sellers for everyday care.</h2></div><Link className="softy-text-link" to="/shop?isBestSeller=true">View all <ArrowRight size={14} /></Link></div><div className="softy-product-grid">{state.products.filter((product) => product.isBestSeller).slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}</div></section>
    <section className="softy-shell softy-section pt-0"><div className="softy-promo"><img src={optimizedImageUrl(promo.image || softySettings.promo.image, { width: 1000 })} alt="Softy skincare collection" /><div><span className="softy-eyebrow">Gentle care, real results</span><h2>{promo.title || softySettings.promo.title}</h2><p>{promo.description || softySettings.promo.description}</p><Link className="softy-button" to={promo.buttonLink || '/shop'}>{promo.buttonText || 'Explore products'} <ArrowRight size={17} /></Link></div></div></section>
  </div>
}
