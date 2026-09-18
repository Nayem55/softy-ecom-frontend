import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const suggestions = ['Bridal', 'Lawn', 'Festive', 'Unstitched'];

const getPriceLabel = (product) => {
  const variations = product.stitchVariations || [];
  const prices = variations
    .map((variation) => (variation.isOnSale && variation.salePrice ? Number(variation.salePrice) : Number(variation.price)))
    .filter((price) => price > 0);

  if (prices.length > 1) return `BDT ${Math.min(...prices).toLocaleString()} - ${Math.max(...prices).toLocaleString()}`;
  if (prices.length === 1) return `BDT ${prices[0].toLocaleString()}`;
  return `BDT ${Number(product.price || 0).toLocaleString()}`;
};

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await API.get(`/products?search=${encodeURIComponent(query.trim())}&limit=5`);
        setResults(res.data.products || res.data.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const submitSearch = (value = query) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;
    navigate(`/shop?search=${encodeURIComponent(nextQuery)}`);
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitSearch();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-charcoal/65" onMouseDown={onClose}>
      <style>{`
        @keyframes searchDrawerIn {
          from { transform: translateX(100%); opacity: 0.92; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <section
        className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-line bg-ivory shadow-2xl animate-[searchDrawerIn_280ms_cubic-bezier(0.16,1,0.3,1)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <span className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase">Search</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-charcoal/60 hover:bg-blush hover:text-oxblood-dark transition-colors"
            aria-label="Close search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-6 sm:px-6">
            <div className="pr-12">
              <h2 className="font-serif mt-1 text-3xl leading-tight text-charcoal">What are you looking for?</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="flex rounded-md border border-line bg-ivory focus-within:border-gold focus-within:ring-1 focus-within:ring-gold">
                <div className="flex w-12 items-center justify-center text-charcoal/45">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products or brands"
                  className="min-w-0 flex-1 border-0 bg-transparent py-4 pr-3 text-base text-charcoal outline-none placeholder:text-charcoal/45"
                />
                <button
                  type="submit"
                  className="m-1 rounded-md bg-oxblood px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ivory hover:bg-oxblood-dark transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {query.trim().length < 2 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => submitSearch(item)}
                    className="rounded-md border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70 hover:border-gold hover:text-oxblood-dark transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5">
              {query.trim().length >= 2 && loading && (
                <div className="rounded-md border border-line bg-blush/35 px-4 py-5 text-center text-sm text-charcoal/60">
                  Searching...
                </div>
              )}

              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <div className="rounded-md border border-line bg-blush/35 px-4 py-5 text-center">
                  <p className="text-sm font-medium text-charcoal">No products found</p>
                  <button
                    type="button"
                    onClick={() => submitSearch()}
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-oxblood-dark hover:text-gold transition-colors"
                  >
                    Search all products
                  </button>
                </div>
              )}

              {query.trim().length >= 2 && !loading && results.length > 0 && (
                <div className="divide-y divide-line rounded-md border border-line">
                  {results.map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug || product._id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 hover:bg-blush/35 transition-colors"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-blush/45">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold tracking-[0.14em] text-charcoal/45">SOFTY</div>
                        )}
                      </div>
                      <div className="min-w-0 self-center">
                        <div className="truncate text-sm font-semibold text-charcoal">{product.name}</div>
                        <div className="mt-1 text-xs font-semibold text-gold">{getPriceLabel(product)}</div>
                      </div>
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => submitSearch()}
                    className="w-full px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-oxblood-dark hover:bg-blush/35 hover:text-gold transition-colors"
                  >
                    View all results
                  </button>
                </div>
              )}
            </div>
        </div>
      </section>
    </div>
  );
}
