import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';
import { optimizedImageUrl, optimizedImageSrcSet } from '../../utils/imageUrl';
import { Sparkles } from 'lucide-react';

const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

const productEditorial = {
  'lemon-face-wash': {
    summary: 'A refreshing daily cleanser that lifts away oil and buildup without leaving skin feeling tight.',
    benefits: ['Oil-control cleanse', 'Fresh lemon finish', 'Daily-use formula'],
    howToUse: 'Massage a small amount onto damp skin, then rinse thoroughly. Use morning and evening.',
  },
  'milk-expert-face-wash': {
    summary: 'A comfort-first face wash that leaves skin feeling clean, soft, and comfortably hydrated.',
    benefits: ['Gentle daily cleanse', 'Soft, supple finish', 'Comfort for dry skin'],
    howToUse: 'Apply to damp skin with light circular motions, then rinse with water. Use as part of your daily routine.',
  },
  'acne-control-serum': {
    summary: 'A lightweight targeted serum made for blemish-prone routines and a clearer-looking complexion.',
    benefits: ['Targeted blemish care', 'Lightweight feel', 'Easy daily layering'],
    howToUse: 'Apply a few drops to clean, dry skin before moisturiser. Avoid the eye area.',
  },
  'papaya-face-wash': {
    summary: 'A brightening daily face wash that clears away dullness while keeping skin feeling comfortable.',
    benefits: ['Fresh glow care', 'Gentle deep cleanse', 'For everyday skin'],
    howToUse: 'Work into a soft lather on damp skin, then rinse well. Follow with your usual moisturiser.',
  },
  'salicylic-face-wash': {
    summary: 'A clear-skin daily cleanser designed to help lift excess oil, surface buildup, and congestion.',
    benefits: ['Deep pore cleanse', 'Oil-balancing care', 'For acne-prone skin'],
    howToUse: 'Use on damp skin, concentrating gently around areas prone to congestion, then rinse thoroughly.',
  },
  'milk-soothing-gel': {
    summary: 'A cooling gel moisturiser that brings light, cushioned comfort to dry or stressed-feeling skin.',
    benefits: ['Lightweight hydration', 'Cooling comfort', 'Soft daily finish'],
    howToUse: 'Smooth a small amount over clean skin and allow it to absorb. Reapply whenever skin needs comfort.',
  },
};

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products/${id}`);
        const productData = data.product || data.data || data;
        setProduct(productData);
        setSelectedImage(0);
        setSelectedColor('');
        setQuantity(1);

        if (productData.category?._id || productData.category) {
          const catId = typeof productData.category === 'object' ? productData.category._id : productData.category;
          try {
            const { data: related } = await API.get(`/products?category=${catId}&limit=6`);
            const relatedItems = (related.data || related.products || []).filter(
              (p) => p._id !== productData._id
            );
            setRelatedProducts(relatedItems.slice(0, 4));
          } catch {
            setRelatedProducts([]);
          }
        }

        try {
          const { data: reviewData } = await API.get(`/products/${id}/reviews`);
          setReviews(reviewData.data || reviewData.reviews || []);
        } catch {
          setReviews([]);
        }
      } catch (error) {
        toast.error('Failed to load product');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) setIsWishlisted(isInWishlist(product._id));
  }, [product, isInWishlist]);

  const handleAddToCart = async () => {
    if (product.colors?.length && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    try {
      await addToCart(product, selectedColor, quantity);
      toast.success('Added to cart!', {
        style: { borderRadius: '8px', background: '#1a1a1a', color: '#FFFFF0' },
      });
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
      toast.success('Removed from wishlist', {
        style: { borderRadius: '8px', background: '#1a1a1a', color: '#FFFFF0' },
      });
      } else {
        await addToWishlist(product._id);
        setIsWishlisted(true);
        toast.success('Added to wishlist!', {
          style: { borderRadius: '8px', background: '#1a1a1a', color: '#FFFFF0' },
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update wishlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      const { data } = await API.post(`/products/${id}/reviews`, reviewForm);
      setReviews([data.data || data.review, ...reviews]);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Review submitted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)));
  };

  const getAverageRating = () => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
            <div>
              <div className="aspect-[3/4] bg-charcoal/5 rounded-2xl" />
              <div className="flex gap-3 mt-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-charcoal/5 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-4 bg-charcoal/5 rounded w-1/3" />
              <div className="h-8 bg-charcoal/5 rounded w-2/3" />
              <div className="h-6 bg-charcoal/5 rounded w-1/4" />
              <div className="space-y-2">
                <div className="h-3 bg-charcoal/5 rounded w-full" />
                <div className="h-3 bg-charcoal/5 rounded w-5/6" />
                <div className="h-3 bg-charcoal/5 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Product Not Found</h2>
          <Link
            to="/shop"
            className="px-6 py-2.5 bg-oxblood text-ivory rounded-lg font-medium hover:bg-oxblood-dark transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : product.image ? [product.image] : ['/placeholder.jpg'];
  const colors = product.colors || [];
  const additionalNote = typeof product.additionalNote === 'string' ? product.additionalNote.trim() : '';
  const editorial = productEditorial[product.slug] || {};
  const shortDescription = product.shortDescription?.trim() || editorial.summary || product.description || 'Thoughtful everyday skincare made for a comfortable, reliable routine.';
  const benefits = (Array.isArray(product.benefits) && product.benefits.length
    ? product.benefits
    : editorial.benefits || product.concerns || ['Everyday skincare', 'Thoughtfully formulated', 'Easy to use'])
    .filter(Boolean)
    .slice(0, 3);

  // Base prices
  const baseRegularPrice = product.regularPrice || (product.comparePrice && product.comparePrice > product.price ? product.comparePrice : product.price) || 0;
  const baseSalePrice = product.salePrice || product.price || 0;
  const baseIsOnSale = Boolean(product.isOnSale && baseSalePrice > 0 && baseSalePrice < baseRegularPrice);

  // Cosmetics use one product price; no apparel variants apply.
  let regularPrice, salePrice, isOnSale, displayPrice, discount;
  regularPrice = baseRegularPrice;
  salePrice = baseSalePrice;
  isOnSale = baseIsOnSale;
  displayPrice = isOnSale ? salePrice : regularPrice;
  discount = isOnSale && regularPrice > displayPrice ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100) : 0;
  const categoryLabel = product.category?.name || (isObjectId(product.category) ? 'Collection' : product.category);
  const categoryLink = product.category?.slug || product.category?._id || product.category;

  return (
    <div className="softy-product-page min-h-screen bg-ivory">
      <SEO
        title={product.name}
        description={(product.description || `Shop ${product.name} at Softy. Gentle skincare delivered across Bangladesh.`).replace(/<[^>]*>/g, '').slice(0, 155)}
        image={images[0]}
        type="product"
      />
      <div className="bg-charcoal/5 border-b border-charcoal/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5">
          <nav className="text-sm text-charcoal/60">
            <Link to="/" className="hover:text-oxblood transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-oxblood transition-colors">Shop</Link>
            <span className="mx-2">/</span>
            {product.category && (
              <>
                <Link
                  to={`/shop?category=${categoryLink}`}
                  className="hover:text-oxblood transition-colors"
                >
                  {categoryLabel}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-charcoal font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="softy-product-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-7">
        <div className="softy-detail-layout grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="softy-product-gallery">
            <div className="softy-product-photo relative aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-charcoal/10 group">
              <img
                src={optimizedImageUrl(images[selectedImage] || images[0], { width: 1000 })}
                srcSet={optimizedImageSrcSet(images[selectedImage] || images[0], [560, 800, 1000])}
                sizes="(max-width: 1024px) 100vw, 50vw"
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-oxblood text-ivory text-sm font-bold rounded-lg">
                  -{discount}%
                </span>
              )}
              {isOnSale && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-gold text-charcoal text-sm font-bold rounded-lg">
                  Sale
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? 'border-oxblood ring-2 ring-oxblood/20'
                        : 'border-charcoal/10 hover:border-oxblood/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={optimizedImageUrl(img, { width: 240 })} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="softy-product-purchase">
            {product.category && (
              <Link
                to={`/shop?category=${categoryLink}`}
                className="text-oxblood text-sm font-semibold uppercase tracking-wider hover:text-oxblood-dark transition-colors"
              >
                {categoryLabel}
              </Link>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-charcoal mt-2 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(getAverageRating())
                        ? 'text-gold fill-gold'
                        : 'text-charcoal/20 fill-charcoal/20'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-charcoal/50">
                {getAverageRating()} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
              {product.sold !== undefined && (
                <span className="text-sm text-charcoal/40">| {product.sold} sold</span>
              )}
            </div>

            <div className="softy-price-row flex items-baseline gap-3 mt-5">
              <span className="text-3xl font-bold text-oxblood">BDT {displayPrice?.toLocaleString()}</span>
              {isOnSale && discount > 0 && (
                <>
                  <span className="text-lg text-charcoal/40 line-through">
                    BDT {regularPrice.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 bg-oxblood/10 text-oxblood text-sm font-semibold rounded">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <div className="softy-detail-summary">
              <p>{shortDescription}</p>
              {benefits.length > 0 && (
                <div className="softy-detail-benefits" aria-label="Product benefits">
                  {benefits.map((benefit) => (
                    <span key={benefit}><Sparkles size={13} strokeWidth={1.9} />{benefit}</span>
                  ))}
                </div>
              )}
            </div>

            <hr className="softy-detail-divider border-charcoal/10 my-6" />
            {colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-charcoal mb-3">
                  Color: <span className="font-normal capitalize text-charcoal/70">{selectedColor || 'Select'}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => {
                    const colorValue = typeof color === 'object' ? color.value || color.name : color;
                    const colorLabel = typeof color === 'object' ? color.name : color;
                    const colorHex = typeof color === 'object' ? color.hex || colorValue : colorValue;
                    return (
                      <button
                        key={colorValue}
                        onClick={() => setSelectedColor(colorValue)}
                        title={colorLabel}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === colorValue
                            ? 'border-oxblood scale-110 ring-2 ring-oxblood/30'
                            : 'border-charcoal/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorHex }}
                      >
                        {colorValue === 'white' && (
                          <span className="absolute inset-0 rounded-full border border-charcoal/20" />
                        )}
                        {selectedColor === colorValue && (
                          <svg className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {additionalNote && (
              <div className="mb-6 border border-gold/35 bg-gold/10 px-4 py-3 rounded-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-oxblood mb-1">
                  Additional Note
                </p>
                <p className="text-sm leading-relaxed text-charcoal/75 whitespace-pre-line">
                  {additionalNote}
                </p>
              </div>
            )}

            <div className="softy-purchase-controls mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="softy-quantity-control flex items-center border border-charcoal/20 rounded-lg overflow-hidden h-[52px]">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-[52px] h-[52px] flex items-center justify-center text-charcoal hover:bg-charcoal/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                    className="w-14 h-[52px] text-center font-semibold text-charcoal border-x border-charcoal/20 bg-transparent focus:outline-none text-base"
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-[52px] h-[52px] flex items-center justify-center text-charcoal hover:bg-charcoal/5 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleWishlistToggle}
                  className={`h-[52px] w-[52px] flex-shrink-0 flex items-center justify-center rounded-lg border-2 transition-all ${
                    isWishlisted
                      ? 'bg-oxblood/10 border-oxblood text-oxblood'
                      : 'border-charcoal/20 text-charcoal hover:border-oxblood/40 hover:text-oxblood'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="softy-add-to-cart w-full h-[52px] bg-oxblood text-ivory rounded-lg font-semibold text-base hover:bg-oxblood-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </button>
            </div>

            <div className="mt-4">
              {product.stock !== undefined && (
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                    product.stock > 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      product.stock > 0 ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  />
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              )}
            </div>

            <div className="softy-trust-points mt-6 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 bg-charcoal/5 rounded-xl text-center">
                <svg className="w-6 h-6 text-oxblood" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-xs font-medium text-charcoal/60">Premium Packaging</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-charcoal/5 rounded-xl text-center">
                <svg className="w-6 h-6 text-oxblood" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-medium text-charcoal/60">Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-charcoal/5 rounded-xl text-center">
                <svg className="w-6 h-6 text-oxblood" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium text-charcoal/60">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <div className="flex border-b border-charcoal/10">
            {[
              { id: 'description', label: 'Description' },
              { id: 'details', label: 'Additional Info' },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-oxblood text-oxblood'
                    : 'border-transparent text-charcoal/50 hover:text-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-charcoal max-w-none">
                <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">
                  {product.description || product.longDescription || shortDescription}
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.material && (
                  <div className="flex justify-between py-3 border-b border-charcoal/10">
                    <span className="text-charcoal/50">Material</span>
                    <span className="font-medium text-charcoal">{product.material}</span>
                  </div>
                )}
                {product.care && (
                  <div className="flex justify-between py-3 border-b border-charcoal/10">
                    <span className="text-charcoal/50">Care</span>
                    <span className="font-medium text-charcoal">{product.care}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between py-3 border-b border-charcoal/10">
                    <span className="text-charcoal/50">Weight</span>
                    <span className="font-medium text-charcoal">{product.weight}</span>
                  </div>
                )}
                {(product.howToUse || editorial.howToUse) && (
                  <div className="flex justify-between gap-6 py-3 border-b border-charcoal/10 sm:col-span-2">
                    <span className="text-charcoal/50">How to use</span>
                    <span className="font-medium text-charcoal text-right max-w-md">{product.howToUse || editorial.howToUse}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between py-3 border-b border-charcoal/10">
                    <span className="text-charcoal/50">Dimensions</span>
                    <span className="font-medium text-charcoal">{product.dimensions}</span>
                  </div>
                )}
                {product.fabric && (
                  <div className="flex justify-between py-3 border-b border-charcoal/10">
                    <span className="text-charcoal/50">Fabric</span>
                    <span className="font-medium text-charcoal">{product.fabric}</span>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-charcoal">{getAverageRating()}</div>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(getAverageRating())
                              ? 'text-gold fill-gold'
                              : 'text-charcoal/20 fill-charcoal/20'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-charcoal/50 mt-1">
                      Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex-1 w-full">
                    <form onSubmit={handleReviewSubmit} className="bg-charcoal/5 rounded-xl p-5">
                      <h4 className="font-semibold text-charcoal mb-3">Write a Review</h4>
                      <div className="mb-3">
                        <label className="block text-sm text-charcoal/60 mb-1">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                              className="transition-transform hover:scale-110"
                            >
                              <svg
                                className={`w-7 h-7 ${
                                  star <= reviewForm.rating
                                    ? 'text-gold fill-gold'
                                    : 'text-charcoal/20 fill-charcoal/20'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-charcoal/20 rounded-lg text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-oxblood resize-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="mt-3 px-6 py-2.5 bg-oxblood text-ivory rounded-lg text-sm font-semibold hover:bg-oxblood-dark disabled:opacity-50 transition-colors"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-center text-charcoal/40 py-8">
                      No reviews yet. Be the first to review this product!
                    </p>
                  ) : (
                    reviews.map((review, i) => (
                      <div key={review._id || i} className="bg-white rounded-xl border border-charcoal/10 p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-oxblood/10 flex items-center justify-center text-oxblood font-bold text-sm">
                              {review.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-charcoal text-sm">
                                {review.user?.name || 'Anonymous'}
                              </p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= (review.rating || 0)
                                        ? 'text-gold fill-gold'
                                        : 'text-charcoal/20 fill-charcoal/20'
                                    }`}
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-charcoal/40">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString('en-BD', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="text-charcoal/70 text-sm leading-relaxed mt-2">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-charcoal">You May Also Like</h2>
              <Link
                to={`/shop?category=${product.category?.slug || product.category || ''}`}
                className="text-oxblood text-sm font-semibold hover:text-oxblood-dark transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

