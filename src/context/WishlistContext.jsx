import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlist([]); return; }
    try {
      const res = await API.get('/wishlist');
      setWishlist(res.data.wishlist || []);
    } catch { setWishlist([]); }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!user) throw new Error('Login required');
    const res = await API.post(`/wishlist/${productId}`);
    fetchWishlist();
    return res.data.added;
  };

  const addToWishlist = async (productId) => {
    if (!user) throw new Error('Login required');
    const exists = wishlist.some(w => (w.product || w._id || w) === productId);
    if (exists) return true;
    const res = await API.post(`/wishlist/${productId}`);
    fetchWishlist();
    return res.data.added;
  };

  const removeFromWishlist = async (productId) => {
    if (!user) throw new Error('Login required');
    await API.delete(`/wishlist/${productId}`);
    setWishlist((prev) => prev.filter(w => (w.product || w._id || w) !== productId));
  };

  const isInWishlist = (productId) => wishlist.some(w => (w.product || w._id || w) === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, addToWishlist, removeFromWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
