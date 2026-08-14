import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, Search, X, Leaf, Flame, Loader2, Plus, Minus, ChevronRight } from 'lucide-react';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import api from '../utils/api';
import useCartStore from '../store/cartStore';
import { getImageUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'default', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];
const LIMIT = 12;

/* ── Skeleton Card ── */
const MenuItemSkeleton = () => (
  <div className="mnu-card skeleton-card">
    <div className="skeleton mnu-card-img-skeleton" />
    <div className="mnu-card-body">
      <div className="skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '65%', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 34, width: 80, borderRadius: 20 }} />
      </div>
    </div>
  </div>
);

/* ── Qty Stepper ── */
const QtyStepper = ({ qty, onAdd, onInc, onDec }) => {
  if (qty === 0) {
    return (
      <button className="mnu-add-btn" onClick={onAdd}>
        <Plus size={15} /> Add
      </button>
    );
  }
  return (
    <div className="mnu-qty-control" onClick={e => e.stopPropagation()}>
      <button className="mnu-qty-btn" onClick={onDec}><Minus size={13} /></button>
      <span className="mnu-qty-num">{qty}</span>
      <button className="mnu-qty-btn" onClick={onInc}><Plus size={13} /></button>
    </div>
  );
};

/* ── Main Page ── */
const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();

  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [searchQ, setSearchQ] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQ);
  const [filters, setFilters] = useState({ isVeg: false, isBestSeller: false, isFeatured: false, sort: 'default' });
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef(null);
  const searchTimer = useRef(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchQ), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data.categories),
    staleTime: 60 * 60 * 1000,
  });

  const buildQuery = (page) => {
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filters.isVeg) params.set('isVeg', 'true');
    if (filters.isBestSeller) params.set('isBestSeller', 'true');
    if (filters.isFeatured) params.set('isFeatured', 'true');
    if (filters.sort !== 'default') params.set('sort', filters.sort);
    params.set('page', page);
    params.set('limit', LIMIT);
    return params.toString();
  };

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['menuProducts', activeCategory, filters, debouncedSearch],
    queryFn: ({ pageParam = 1 }) => api.get(`/products?${buildQuery(pageParam)}`).then(r => r.data.data),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage.pages || 1;
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

  const products = data?.pages.flatMap(p => p.products) ?? [];

  // Infinite scroll sentinel
  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleCategoryChange = (slug) => {
    setActiveCategory(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = [filters.isVeg, filters.isBestSeller, filters.isFeatured, filters.sort !== 'default']
    .filter(Boolean).length;

  return (
    <div className="page-wrapper">
      <Header />

      {/* ── Sticky Controls ── */}
      <div className="mnu-sticky">

        {/* Search Bar */}
        <div className="mnu-search-wrap">
          <div className="mnu-search-box">
            <Search size={16} className="mnu-search-icon" />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search dishes, drinks…"
              className="mnu-search-input"
            />
            {searchQ && (
              <button className="mnu-search-clear" onClick={() => setSearchQ('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className={`mnu-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={15} />
            {activeFiltersCount > 0 && <span className="mnu-filter-badge">{activeFiltersCount}</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mnu-filter-panel">
            <div className="mnu-filter-chips">
              {[
                { key: 'isVeg', label: '🌿 Veg Only' },
                { key: 'isBestSeller', label: '🔥 Best Sellers' },
                { key: 'isFeatured', label: "⭐ Today's Special" },
              ].map(f => (
                <button
                  key={f.key}
                  className={`mnu-chip ${filters[f.key] ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mnu-sort-row">
              <span className="mnu-sort-label">Sort by:</span>
              <select
                className="mnu-sort-select"
                value={filters.sort}
                onChange={e => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mnu-tabs hide-scrollbar">
          <button
            className={`mnu-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            🍽 All
          </button>
          {(categories || []).map(cat => (
            <button
              key={cat._id}
              className={`mnu-tab ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="mnu-grid">

        {/* Skeletons on initial load */}
        {isLoading && [...Array(6)].map((_, i) => <MenuItemSkeleton key={i} />)}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="mnu-empty">
            <div className="mnu-empty-icon">🔍</div>
            <div className="mnu-empty-title">No items found</div>
            <div className="mnu-empty-sub">Try a different category or filter</div>
            <button className="mnu-empty-btn" onClick={() => { setActiveCategory('all'); setSearchQ(''); setFilters({ isVeg: false, isBestSeller: false, isFeatured: false, sort: 'default' }); }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Product Cards */}
        {products.map(product => {
          const qty = getItemQuantity(product._id);
          const price = product.discountedPrice || product.price;
          const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
          const discountPct = hasDiscount ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;

          return (
            <div key={product._id} className="mnu-card" onClick={() => navigate(`/product/${product.slug}`)}>
              {/* Image */}
              <div className="mnu-card-img">
                {product.imageUrl
                  ? <img src={getImageUrl(product.imageUrl)} alt={product.name} loading="lazy" decoding="async" />
                  : <div className="mnu-card-img-ph">🍽</div>
                }
                {hasDiscount && <div className="mnu-card-discount">{discountPct}%<br/>OFF</div>}
                <div className="mnu-veg-dot" style={{ background: product.isVegetarian ? '#4CAF50' : '#E53935' }}>
                  {product.isVegetarian ? <Leaf size={9} color="white" /> : <Flame size={9} color="white" />}
                </div>
              </div>

              {/* Body */}
              <div className="mnu-card-body">
                <div className="mnu-card-badges">
                  {product.isBestSeller && <span className="mnu-badge mnu-badge-hot">🔥 Best Seller</span>}
                  {product.isFeatured && <span className="mnu-badge mnu-badge-special">⭐ Special</span>}
                  {product.isNewArrival && <span className="mnu-badge mnu-badge-new">New</span>}
                </div>

                <div className="mnu-card-name">{product.name}</div>

                {product.description && (
                  <div className="mnu-card-desc">{product.description}</div>
                )}

                <div className="mnu-card-footer">
                  <div className="mnu-card-price">
                    <span className="mnu-price-main">₹{price}</span>
                    {hasDiscount && <span className="mnu-price-orig">₹{product.price}</span>}
                  </div>
                  <QtyStepper
                    qty={qty}
                    onAdd={e => { e?.stopPropagation?.(); addItem(product); toast.success(`${product.name} added!`, { duration: 1200, icon: '🛒' }); }}
                    onInc={e => { e?.stopPropagation?.(); updateQuantity(product._id, qty + 1); }}
                    onDec={e => { e?.stopPropagation?.(); updateQuantity(product._id, qty - 1); }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Skeletons while fetching next page */}
        {isFetchingNextPage && [...Array(3)].map((_, i) => <MenuItemSkeleton key={`next-${i}`} />)}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* Spinner */}
      {isFetchingNextPage && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Loader2 size={22} className="spin" style={{ color: 'var(--brand-red)' }} />
        </div>
      )}

      {/* End of list */}
      {!hasNextPage && products.length > 0 && !isLoading && (
        <div className="mnu-end-label">✦ You've seen all {products.length} items ✦</div>
      )}

      <BottomNav />
    </div>
  );
};

export default MenuPage;
