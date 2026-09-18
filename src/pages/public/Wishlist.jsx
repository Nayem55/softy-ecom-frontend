import API from '../../api/axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import SEO from '../../components/common/SEO';

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const fetchProducts = async () => {
    if (!wishlist || wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const promises = wishlist.map((item) =>
        API.get(`/products/${item.product || item._id || item}`)
          .then((res) => res.data.product || res.data)
          .catch(() => null)
      );
      const results = await Promise.allSettled(promises);
      const found = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);
      setProducts(found);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to load your wishlist. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError(null);
      setProducts([]);
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, wishlist]);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);
      await removeFromWishlist(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to remove from wishlist. Please try again.';
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  // Not logged in — show login prompt
  if (!user) {
    return (
      <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
        <SEO
          title="My Wishlist"
          description="Sign in to view and manage your saved Softy wishlist items."
          noIndex
        />
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
            My Wishlist
          </h1>
          <EmptyState
            title="Please log in to view your wishlist"
            description="You need to be signed in to see your saved items."
            actionLabel="Log In"
            actionLink="/account?redirect=/wishlist"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
      <SEO
        title="My Wishlist"
        description="View and manage your saved Softy wishlist items."
        noIndex
      />
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
          My Wishlist
        </h1>
        {!loading && !error && products.length > 0 && (
          <p className="mb-8 text-charcoal/50">
            {products.length} item{products.length !== 1 ? 's' : ''} saved
          </p>
        )}

        {loading ? (
          <LoadingSpinner size="lg" text="Loading your wishlist..." />
        ) : error ? (
          <ErrorDisplay message={error} onRetry={fetchProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            description="Save items you love by tapping the heart icon on any product, then revisit them here."
            actionLabel="Browse Products"
            actionLink="/shop"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="group relative overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-lg"
              >
                {/* Product Image */}
                <Link
                  to={`/product/${product.slug || product._id}`}
                  className="block aspect-[3/4] overflow-hidden bg-charcoal/5"
                >
                  {product.images?.[0] || product.image ? (
                    <img
                      src={product.images?.[0] || product.image}
                      alt={product.name || 'Product'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-charcoal/20">
                      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(product._id)}
                  disabled={removingId === product._id}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal/60 shadow-sm backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  title="Remove from wishlist"
                >
                  {removingId === product._id ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>

                {/* Product Info */}
                <div className="p-4">
                  <Link
                    to={`/product/${product.slug || product._id}`}
                    className="mb-1 block truncate font-medium text-charcoal transition-colors group-hover:text-oxblood"
                  >
                    {product.name || 'Unnamed Product'}
                  </Link>

                  {(() => {
                    const baseRegularPrice = product.regularPrice || (product.comparePrice && product.comparePrice > product.price ? product.comparePrice : product.price) || 0;
                    const baseSalePrice = product.salePrice || product.price || 0;
                    const baseIsOnSale = product.isOnSale && baseSalePrice > 0 && baseSalePrice < baseRegularPrice;

                    return (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-lg font-bold text-charcoal">
                      BDT {(baseIsOnSale ? baseSalePrice : baseRegularPrice)?.toLocaleString() || '0'}
                    </span>
                    {baseIsOnSale && (
                      <span className="text-sm text-charcoal/40 line-through">
                        BDT {baseRegularPrice?.toLocaleString()}
                      </span>
                    )}
                  </div>
                    );
                  })()}

                  {/* Quick Add to Cart */}
                  <button
                    onClick={() => {
                      toast.success('Added to cart!');
                    }}
                    className="mt-3 w-full rounded-md border border-oxblood bg-transparent py-2 text-xs font-semibold text-oxblood transition-colors hover:bg-oxblood hover:text-white"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
