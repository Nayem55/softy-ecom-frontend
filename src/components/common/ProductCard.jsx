import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const add = async event => { event.preventDefault(); try { await addToCart(product); toast.success('Added to your cart') } catch { toast.error('Could not add this product') } }
  return <Link className="softy-product" to={`/product/${product.slug || product._id}`}><div className="softy-product-image"><img src={product.image || product.images?.[0]} alt={product.name}/>{product.isNew && <span className="softy-badge">New</span>}{product.isBestSeller && !product.isNew && <span className="softy-badge">Best seller</span>}</div><div className="softy-product-info"><h3>{product.name}</h3><p>{product.description}</p><div className="softy-product-bottom"><span>BDT {Number(product.price || 0).toLocaleString('en-BD')}</span><button className="softy-add" onClick={add} aria-label={`Add ${product.name} to cart`}><Plus size={17}/></button></div></div></Link>
}
