import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Star, Flame, Sparkles, MessageCircle, UtensilsCrossed, Zap, Shield, Leaf } from 'lucide-react';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import HeroSlider from '../components/Slider/HeroSlider';
import ProductCard from '../components/Product/ProductCard';
import api from '../utils/api';

/* Hero Slider skeleton — fills space while slides load */
const HeroSliderSkeleton = () => (
  <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 0 }} />
);

/* Skeletons */
const CategorySkeleton = () => (
  <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflowX: 'hidden' }}>
    {[...Array(6)].map((_, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 18 }} />
        <div className="skeleton" style={{ width: 52, height: 9, borderRadius: 4 }} />
      </div>
    ))}
  </div>
);

const ProductCardSkeleton = () => (
  <div style={{ minWidth: 155, borderRadius: 16, overflow: 'hidden', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flexShrink: 0 }}>
    <div className="skeleton" style={{ width: '100%', height: 130 }} />
    <div style={{ padding: '10px 12px' }}>
      <div className="skeleton" style={{ height: 11, borderRadius: 4, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 4 }} />
    </div>
  </div>
);

/* Feature pill card */
const FeatureCard = ({ icon: Icon, title, sub, color, bg }) => (
  <div style={{
    flex: 1, background: bg, borderRadius: 16,
    padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, textAlign: 'center', minWidth: 0,
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>{title}</div>
    <div style={{ fontSize: 10, color: '#888', fontWeight: 500, lineHeight: 1.3 }}>{sub}</div>
  </div>
);

/* Section header */
const SectionHeader = ({ icon: Icon, iconBg, title, sub, linkText, onLink }) => (
  <div className="section-header" style={{ paddingTop: 18 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ background: iconBg, borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color="white" />
        </div>
        <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
      </div>
      {sub && <p style={{ fontSize: 11, color: '#999', marginTop: 4, fontWeight: 500 }}>{sub}</p>}
    </div>
    {linkText && onLink && (
      <button className="section-link" onClick={onLink}>
        {linkText} <ChevronRight size={14} />
      </button>
    )}
  </div>
);

/* Why Choose Us items */
const whyItems = [
  { icon: '👨‍🍳', title: 'Expert Chefs', desc: 'Trained professionals with 10+ years experience' },
  { icon: '🌿', title: 'Fresh Ingredients', desc: 'Sourced fresh every morning from local farms' },
  { icon: '⚡', title: 'Quick Delivery', desc: 'Hot food at your door in 30–45 minutes' },
  { icon: '💸', title: 'Best Prices', desc: 'Premium taste without burning your pocket' },
];

/* Main Component */
const HomePage = () => {
  const navigate = useNavigate();

  const { data: slidersData } = useQuery({
    queryKey: ['sliders'],
    queryFn: () => api.get('/sliders').then(r => r.data.data.sliders),
    staleTime: 10 * 60 * 1000,
  });

  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data.categories),
    staleTime: 60 * 60 * 1000,
  });

  const { data: bestSellersData, isLoading: bsLoading } = useQuery({
    queryKey: ['bestSellers'],
    queryFn: () => api.get('/products?isBestSeller=true&limit=8').then(r => r.data.data.products),
    staleTime: 5 * 60 * 1000,
  });

  const { data: featuredData, isLoading: featLoading } = useQuery({
    queryKey: ['todaySpecial'],
    queryFn: () => api.get('/products?isFeatured=true&limit=6').then(r => r.data.data.products),
    staleTime: 5 * 60 * 1000,
  });

  const { data: crossSellData, isLoading: csLoading } = useQuery({
    queryKey: ['crossSell'],
    queryFn: () => api.get('/crosssell').then(r => r.data.data.crossSell),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="page-wrapper" style={{ paddingTop: 0, background: '#F7F7F8' }}>
      <Header />

      <div style={{ paddingTop: '60px', paddingBottom: 80 }}>

        {/* Hero Slider */}
        {slidersData === undefined
          ? <HeroSliderSkeleton />
          : <HeroSlider sliders={slidersData} />
        }

        {/* Feature pills */}
        <div style={{ padding: '14px 16px', display: 'flex', gap: 10 }}>
          <FeatureCard icon={Clock}           title="30–45 Min"   sub="Fast Delivery"   color="#E53935" bg="#fff5f5" />
          <FeatureCard icon={Star}            title="4.8 Rated"   sub="Top Rated Food"  color="#F59E0B" bg="#fffbeb" />
          <FeatureCard icon={UtensilsCrossed} title="100% Fresh"  sub="Made to Order"   color="#10B981" bg="#f0fdf4" />
        </div>

        {/* TODAY'S OFFER — always visible, always shows real products from backend */}
        <section className="cs-offer-section">
          <div className="cs-offer-banner">
            <div className="cs-blob cs-blob-1" />
            <div className="cs-blob cs-blob-2" />
            <div className="cs-blob cs-blob-3" />

            <div className="cs-offer-toprow">
              <span className="cs-offer-badge">
                <span className="cs-fire">🔥</span>
                {crossSellData?.badgeLabel || 'HOT DEALS'}
              </span>
              <button className="cs-view-all" onClick={() => navigate('/offers')}>View All →</button>
            </div>

            {crossSellData?.discountLabel && (
              <div className="cs-discount-pill">
                <span className="cs-discount-amount">{crossSellData.discountLabel}</span>
                <span className="cs-discount-off">OFF</span>
              </div>
            )}

            <h2 className="cs-offer-title">{crossSellData?.title || "Today's Special Offer"}</h2>
            <p className="cs-offer-subtitle">{crossSellData?.subtitle || "Grab these deals before they're gone!"}</p>

            <div className="cs-urgency-row">
              <span className="cs-urgency-dot" />
              <span className="cs-urgency-text">⚡ Hurry! Offer ends at midnight</span>
            </div>
          </div>

          {/* Real products — crossSell products if active, else best sellers as fallback */}
          <div className="cs-offer-products hide-scrollbar">
            {csLoading || bsLoading
              ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
              : (() => {
                  const csProducts = crossSellData?.isActive
                    ? (crossSellData?.productIds || crossSellData?.products || [])
                    : [];
                  const raw = csProducts.length > 0
                    ? csProducts
                    : (bestSellersData || []).slice(0, 8);
                  // Deduplicate by _id to avoid React duplicate key warnings
                  const seen = new Set();
                  const displayProducts = raw.filter(p => {
                    if (seen.has(p._id)) return false;
                    seen.add(p._id);
                    return true;
                  });
                  return displayProducts.map(p => (
                    <ProductCard key={p._id} product={p} offerPrice={p.offerPrice || null} />
                  ));
                })()
            }
          </div>

          <div style={{ padding: '0 16px 20px' }}>
            <button className="cs-grab-btn" onClick={() => navigate('/offers')}>
              🛍️ Grab This Offer Now
            </button>
          </div>
        </section>

        {/* Categories */}
        <section style={{ background: 'white', marginBottom: 8 }}>
          <SectionHeader
            icon={Sparkles}
            iconBg="linear-gradient(135deg,#7C3AED,#A855F7)"
            title="Categories"
            sub="Browse by your craving"
            linkText="See All"
            onLink={() => navigate('/menu')}
          />
          {catLoading ? <CategorySkeleton /> : (
            <div className="categories-scroll hide-scrollbar" style={{ paddingBottom: 16 }}>
              {(categoriesData || []).map(cat => (
                <div key={cat._id} className="category-card" onClick={() => navigate(`/menu?category=${cat.slug}`)}>
                  <div className="category-img-wrapper">
                    {cat.imageUrl
                      ? <img src={cat.imageUrl} alt={cat.name} loading="lazy" decoding="async" />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽</div>
                    }
                  </div>
                  <span className="category-name">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Best Sellers */}
        <section style={{ background: 'white', marginBottom: 8 }}>
          <SectionHeader
            icon={Flame}
            iconBg="linear-gradient(135deg,#E53935,#FF6B35)"
            title="Best Sellers"
            sub="Our most-loved dishes"
            linkText="View All"
            onLink={() => navigate('/menu?filter=bestseller')}
          />
          <div className="products-scroll hide-scrollbar" style={{ paddingBottom: 16 }}>
            {bsLoading
              ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
              : (bestSellersData || []).map(p => <ProductCard key={p._id} product={p} />)
            }
          </div>
        </section>

        {/* Promo banner */}
        <div
          className="home-promo-banner"
          onClick={() => navigate('/menu')}
        >
          <div className="home-promo-left">
            <div className="home-promo-eyebrow">🍽 Special Menu</div>
            <div className="home-promo-title">Explore Our Full<br />Menu Collection</div>
            <div className="home-promo-sub">100+ dishes made fresh daily</div>
            <div className="home-promo-btn">
              Explore Now <ChevronRight size={14} />
            </div>
          </div>
          <div className="home-promo-emoji">🍛</div>
        </div>

        {/* Today's Special */}
        {(featuredData?.length > 0 || featLoading) && (
          <section style={{ background: 'white', marginBottom: 8 }}>
            <SectionHeader
              icon={Sparkles}
              iconBg="linear-gradient(135deg,#F59E0B,#FBBF24)"
              title="Today's Special"
              sub="Hand-picked for today"
              linkText="View All"
              onLink={() => navigate('/menu?filter=special')}
            />
            <div className="products-scroll hide-scrollbar" style={{ paddingBottom: 16 }}>
              {featLoading
                ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
                : (featuredData || []).map(p => <ProductCard key={p._id} product={p} />)
              }
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section style={{ background: 'white', padding: '20px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ background: 'linear-gradient(135deg,#E53935,#FF6B35)', borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} color="white" />
            </div>
            <h2 className="section-title" style={{ margin: 0 }}>Why Choose Laziz?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {whyItems.map(item => (
              <div key={item.title} className="home-why-card">
                <div className="home-why-emoji">{item.icon}</div>
                <div className="home-why-title">{item.title}</div>
                <div className="home-why-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WhatsApp CTA */}
        <div className="home-whatsapp-cta">
          <div className="home-whatsapp-icon">
            <MessageCircle size={26} color="white" />
          </div>
          <div className="home-whatsapp-text">
            <div className="home-whatsapp-title">Order on WhatsApp</div>
            <div className="home-whatsapp-sub">Get faster service, track &amp; chat with us!</div>
          </div>
          <button
            className="home-whatsapp-btn"
            onClick={() => window.open('https://wa.me/' + (import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210'), '_blank')}
          >
            Chat Now
          </button>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', padding: '20px 16px 8px', color: '#bbb', fontSize: 11, fontWeight: 500 }}>
          Made with ❤️ by Laziz Restaurant · All rights reserved
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;

