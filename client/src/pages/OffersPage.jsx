import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Plus, CheckCircle, Zap, Clock, Star } from 'lucide-react';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import api from '../utils/api';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

/* ── Product Card ── */
const OfferProductCard = ({ product, offerPrice }) => {
  const { addItem, items } = useCartStore();
  const inCart = items.some(i => i.productId === product._id);
  const displayPrice = offerPrice != null ? offerPrice : (product.discountedPrice || product.price);
  const originalPrice = product.price;
  const hasDiscount = displayPrice < originalPrice;
  const discountPct = hasDiscount ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const saving = hasDiscount ? originalPrice - displayPrice : 0;

  const handleAdd = () => {
    addItem({
      _id: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: displayPrice,
      discountedPrice: displayPrice,
    });
    toast.success(`${product.name} added!`, { icon: '🛒' });
  };

  return (
    <div className="op-card">
      <div className="op-img-wrap">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} loading="lazy" />
          : <div className="op-img-ph">🍽</div>
        }
        {hasDiscount && <div className="op-discount-badge">{discountPct}% OFF</div>}
        {product.isBestSeller && <div className="op-bs-badge">🔥 Best Seller</div>}
      </div>

      <div className="op-body">
        <div className="op-name">{product.name}</div>
        {product.description && (
          <div className="op-desc">{product.description}</div>
        )}
        <div className="op-price-row">
          <div>
            <span className="op-offer-price">₹{displayPrice}</span>
            {hasDiscount && <span className="op-orig-price">₹{originalPrice}</span>}
          </div>
          {hasDiscount && (
            <span className="op-saving-pill">Save ₹{saving}</span>
          )}
        </div>
      </div>

      <button
        className={`op-add-btn ${inCart ? 'op-added' : ''}`}
        onClick={handleAdd}
      >
        {inCart
          ? <><CheckCircle size={15} /> Added</>
          : <><Plus size={15} /> Add to Cart</>}
      </button>
    </div>
  );
};

/* ── Skeleton ── */
const CardSkeleton = () => (
  <div className="op-card">
    <div className="skeleton" style={{ height: 150, borderRadius: '16px 16px 0 0' }} />
    <div style={{ padding: '12px 12px 8px' }}>
      <div className="skeleton" style={{ height: 13, borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '70%', borderRadius: 4, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '45%', borderRadius: 4 }} />
    </div>
    <div className="skeleton" style={{ height: 38, margin: '0 12px 12px', borderRadius: 10 }} />
  </div>
);

/* ── Main Page ── */
const OffersPage = () => {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + i.subtotal, 0);

  const { data: crossSellData, isLoading: csLoading } = useQuery({
    queryKey: ['crossSell'],
    queryFn: () => api.get('/crosssell').then(r => r.data.data.crossSell),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch best sellers as fallback when crossSell is not active
  const { data: bestSellersData, isLoading: bsLoading } = useQuery({
    queryKey: ['bestSellers'],
    queryFn: () => api.get('/products?isBestSeller=true&limit=20').then(r => r.data.data.products),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = csLoading || bsLoading;

  // Decide which products to show — deduplicate by _id
  const csProducts = crossSellData?.isActive
    ? (crossSellData?.productIds || crossSellData?.products || [])
    : [];
  const raw = csProducts.length > 0 ? csProducts : (bestSellersData || []);
  const seen = new Set();
  const displayProducts = raw.filter(p => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });

  const bannerTitle = crossSellData?.title || "Today's Best Deals";
  const bannerSubtitle = crossSellData?.subtitle || "Handpicked top sellers — add to cart and save big!";
  const badgeLabel = crossSellData?.badgeLabel || 'HOT DEALS';
  const discountLabel = crossSellData?.discountLabel || null;

  return (
    <div className="page-wrapper">
      <Header />
      <div>

        {/* ── Compact Hero Banner ── */}
        <div className="op-hero-compact">
          <div className="op-blob op-blob-1" />
          <div className="op-blob op-blob-2" />

          {/* Row 1: back + badge + title */}
          <div className="op-hero-row1">
            <button className="op-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            <div className="op-live-badge">
              <span className="op-live-dot" />
              {badgeLabel}
            </div>
            <h1 className="op-hero-title-inline">
              {discountLabel
                ? <><span className="op-disc-inline">{discountLabel} OFF</span> — {bannerTitle}</>
                : <>🔥 {bannerTitle}</>
              }
            </h1>
          </div>

          {/* Row 2: subtitle + cart pill */}
          <div className="op-hero-row2">
            <p className="op-hero-sub-inline">{bannerSubtitle}</p>
            {cartCount > 0 && (
              <button className="op-cart-pill-sm" onClick={() => navigate('/cart')}>
                <ShoppingBag size={13} />
                ₹{cartTotal}
              </button>
            )}
          </div>

          {/* Row 3: stats chips */}
          <div className="op-chips-row">
            <span className="op-chip"><Zap size={11} /> Instant Savings</span>
            <span className="op-chip"><Clock size={11} /> Limited Time</span>
            <span className="op-chip"><Star size={11} /> Top Picks</span>
          </div>
        </div>

        {/* ── Offer Products — always shows real products ── */}
        <div className="op-products-wrap">
          <div className="op-products-label">
            <span className="op-products-label-line" />
            <span className="op-products-label-text">
              🏷️ {isLoading ? 'Loading Deals...' : `${displayProducts.length} Offer Items`}
            </span>
            <span className="op-products-label-line" />
          </div>

          <div className="op-grid">
            {isLoading
              ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
              : displayProducts.map(p => (
                  <OfferProductCard key={p._id} product={p} offerPrice={p.offerPrice || null} />
                ))
            }
          </div>

          {/* Sticky cart bar */}
          {cartCount > 0 && (
            <div className="op-sticky-cart">
              <div className="op-sticky-cart-info">
                <div className="op-sticky-cart-count">{cartCount} item{cartCount !== 1 ? 's' : ''} added</div>
                <div className="op-sticky-cart-total">₹{cartTotal} total</div>
              </div>
              <button className="op-sticky-cart-btn" onClick={() => navigate('/cart')}>
                <ShoppingBag size={16} /> Checkout
              </button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default OffersPage;
