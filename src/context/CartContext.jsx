import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const GUEST_CART_KEY = 'softy_guest_cart';

const readGuestCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || { items: [] };
    return {
      items: (cart.items || []).map((item) => {
        const productData = item.productData || (typeof item.product === 'object' ? item.product : undefined);
        const productId = getProductId(item.product) || getProductId(productData);
        return {
          ...item,
          product: productId,
          productData,
        };
      }).filter((item) => item.product),
    };
  } catch {
    return { items: [] };
  }
};

const writeGuestCart = (cart) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

const getProductId = (product) => (typeof product === 'object' ? product._id : product);
const getGuestProductData = (product) => (typeof product === 'object' ? product : undefined);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      const guestCart = readGuestCart();
      writeGuestCart(guestCart);
      setCart(guestCart);
      return;
    }
    try {
      const res = await API.get('/cart');
      setCart(res.data.cart || { items: [] });
    } catch { setCart({ items: [] }); }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product, color = '', qty = 1) => {
    const productId = getProductId(product);
    if (!user) {
      setCart((prev) => {
        const next = { items: [...(prev.items || [])] };
        const idx = next.items.findIndex(i => i.product === productId && i.color === (color || ''));
        if (idx >= 0) {
          next.items[idx] = { ...next.items[idx], qty: next.items[idx].qty + qty };
        } else {
          next.items.push({ product: productId, productData: getGuestProductData(product), color: color || '', qty });
        }
        writeGuestCart(next);
        return next;
      });
      return;
    }
    const res = await API.post('/cart/add', { product: productId, color, qty });
    setCart(res.data.cart);
  };

  const updateCart = async (items) => {
    if (!user) {
      const next = { items };
      writeGuestCart(next);
      setCart(next);
      return;
    }
    await API.put('/cart/update', { items });
    setCart({ ...cart, items });
  };

  const removeFromCart = async (productId) => {
    if (!user) {
      setCart((prev) => {
        const next = { items: (prev.items || []).filter(i => i.product !== productId) };
        writeGuestCart(next);
        return next;
      });
      return;
    }
    await API.delete(`/cart/remove/${productId}`);
    setCart({ ...cart, items: cart.items.filter(i => i.product !== productId) });
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY);
      setCart({ items: [] });
      return;
    }
    setCart({ items: [] });
    await fetchCart();
  };

  const cartCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCart, removeFromCart, clearCart, cartCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
