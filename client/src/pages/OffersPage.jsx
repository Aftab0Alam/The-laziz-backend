import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Plus, CheckCircle, Zap, Clock, Star } from 'lucide-react';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import api from '../utils/api';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

/* ΓöÇΓöÇ Product Card ΓöÇΓöÇ */
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
    toast.success(`${product.name} added!`, { icon: '≡ƒ¢Æ' });
  };

  return (
    <div className="op-card">
      <div className="op-img-wrap">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} loading="lazy" />
          : <div className="op-img-ph">≡ƒì╜</div>
        }
        {hasDiscount && <div className="op-discount-badge">{discountPct}% OFF</div>}
        {product.isBestSeller && <div className="op-bs-badge">≡ƒöÑ Best Seller</div>}
      </div>

      <div className="op-body">
        <div className="op-name">{product.name}</div>
        {product.description && (
          <div className="op-desc">{product.description}</div>
        )}
        <div className="op-price-row">
          <div>
            <span className="op-offer-price">Γé╣{displayPrice}</span>
            {hasDiscount && <span className="op-orig-price">Γé╣{originalPrice}</span>}
          </div>
          {hasDiscount && (
            <span className="op-saving-pill">Save Γé╣{saving}</span>
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

/* ΓöÇΓöÇ Skeleton ΓöÇΓöÇ */
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

/* ΓöÇΓöÇ Main Page ΓöÇΓöÇ */
const OffersPage = () => {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + i.subtotal, 0);

  const { data: crossSellData, isLoading } = useQuery({
    queryKey: ['crossSell'],
    queryFn: () => api.get('/crosssell').then(r => r.data.data.crossSell),
    staleTime: 2 * 60 * 1000,
  });

  const offerProducts = crossSellData?.isActive
    ? (crossSellData?.productIds || crossSellData?.products || [])
    : [];

  const showOfferSection = isLoading || offerProducts.length > 0;

  return (
    <div className="page-wrapper">
      <Header />
      <div>

        {/* ΓöÇΓöÇ Compact Hero Banner ΓöÇΓöÇ */}
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
              {crossSellData?.badgeLabel || 'HOT DEAL'}
            </div>
            <h1 className="op-hero-title-inline">
              {crossSellData?.discountLabel
                ? <><span className="op-disc-inline">{crossSellData.discountLabel} OFF</span> ΓÇö {crossSellData?.title || "Today's Offer"}</>
                : <>≡ƒöÑ {crossSellData?.title || "Today's Offer"}</>
              }
            </h1>
          </div>

          {/* Row 2: subtitle + cart pill */}
          <div className="op-hero-row2">
            <p className="op-hero-sub-inline">
              {crossSellData?.subtitle || "Limited time deals ΓÇö grab them before they're gone!"}
            </p>
            {cartCount > 0 && (
              <button className="op-cart-pill-sm" onClick={() => navigate('/cart')}>
                <ShoppingBag size={13} />
                Γé╣{cartTotal}
              </button>
            )}
          </div>

          {/* Row 3: stats chips */}
          <div className="op-chips-row">
            <span className="op-chip"><Zap size={11} /> Instant Savings</span>
            <span className="op-chip"><Clock size={11} /> Limited Time</span>
            <span className="op-chip"><Star size={11} /> Top Picks</span>
          </div>

          {/* dummy for cart pill compat below */}
          {cartCount > 0 && (
            <button style={{display:'none'}} onClick={() => navigate('/cart')}>
              <ShoppingBag size={15} />
              <span>{cartCount} item{cartCount !== 1 ? 's' : ''} ┬╖ Γé╣{cartTotal}</span>
              <span className="op-cart-pill-arrow">ΓåÆ</span>
            </button>
          )}
        </div>

        {/* ΓöÇΓöÇ Offer Products ΓöÇΓöÇ */}
        {showOfferSection ? (
          <div className="op-products-wrap">
            <div className="op-products-label">
              <span className="op-products-label-line" />
              <span className="op-products-label-text">
                ≡ƒÄ» {offerProducts.length > 0 ? `${offerProducts.length} Offer Items` : 'Loading Offers...'}
              </span>
              <span className="op-products-label-line" />
            </div>

            <div className="op-grid">
              {isLoading
                ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
                : offerProducts.map(p => (
                    <OfferProductCard key={p._id} product={p} offerPrice={p.offerPrice} />
                  ))
              }
            </div>

            {/* Sticky cart bar */}
            {cartCount > 0 && (
              <div className="op-sticky-cart">
                <div className="op-sticky-cart-info">
                  <div className="op-sticky-cart-count">{cartCount} item{cartCount !== 1 ? 's' : ''} added</div>
                  <div className="op-sticky-cart-total">Γé╣{cartTotal} total</div>
                </div>
                <button className="op-sticky-cart-btn" onClick={() => navigate('/cart')}>
                  <ShoppingBag size={16} /> Checkout
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="op-empty">
            <div className="op-empty-icon">≡ƒì╜</div>
            <div className="op-empty-title">No Active Offers</div>
            <div className="op-empty-sub">Check back soon ΓÇö exciting deals are on the way!</div>
            <button className="op-browse-btn" onClick={() => navigate('/menu')}>
              Browse Full Menu
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default OffersPage;
