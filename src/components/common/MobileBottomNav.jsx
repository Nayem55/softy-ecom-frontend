import { House, ShoppingBag, ShoppingBasket, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

const links = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'Account', href: '/account', icon: UserRound },
]

export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const { cartCount } = useCart()

  return <nav className="softy-mobile-bottom" aria-label="Mobile navigation">
    {links.map(({ label, href, icon: Icon }) => <Link className={pathname === href ? 'active' : ''} to={href} key={href}><Icon size={19} /><span>{label}</span></Link>)}
    <Link className={pathname === '/cart' ? 'active' : ''} to="/cart"><span className="softy-mobile-cart"><ShoppingBasket size={19} />{cartCount > 0 && <b>{cartCount}</b>}</span><span>Cart</span></Link>
  </nav>
}
