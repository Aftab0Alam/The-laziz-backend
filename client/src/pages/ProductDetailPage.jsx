import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Star, Leaf, Flame, Heart, Share2, ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import ProductCard from '../components/Product/ProductCard';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { getDiscountPercent, getImageUrl } from '../utils/helpers';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const [localQty, setLocalQty] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then(r => r.data.data.product),
  });

  const { data: relatedData } = useQuery({
    queryKey: ['related', data?._id],
    queryFn: () => api.get(`/products/${data._id}/related`).then(r => r.data.data.products),
    enabled: !!data?._id,
  });

  if (isLoading) return (
    <div className="page-wrapper">
      <Header />
      <div style={{ padding: 16 }}>
        <div className="skeleton" style={{ width: '100%', aspectRatio: '4/3', borderRadius: 16, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 24, marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, marginBottom: 6, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} />
      </div>
      <BottomNav />
    </div>
  );

  if (error || !data) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Item not found</div>
      <button className="btn btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
      <BottomNav />
    </div>
  );

  const product = data;
  const price = product.discountedPrice || product.price;
  const discount = getDiscountPercent(product.price, product.discountedPrice);
  const cartQty = getItemQuantity(product._id);

  const handleAddToCart = () => {
    if (!product.isAvailable) { toast.error('This item is currently unavailable'); return; }
    for (let i = 0; i < localQty; i++) addItem(product);
    toast.success(`${localQty}× ${product.name} added to cart!`);
    navigate('/cart');
  };

  return (
    <div className="page-wrapper" style={{ paddingTop: 0, paddingBottom: 0 }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 1000, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(235,235,235,0.8)' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Details</div>
        <button onClick={() => navigate('/cart')} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <ShoppingCart size={18} />
          {cartQty > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#E53935', color: 'white', width: 16, height: 16, borderRadius: '50%', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartQty}</span>}
        </button>
      </div>

      <div style={{ paddingTop: 60, paddingBottom: 100 }}>
        {/* Image */}
        <div className="product-detail-image">
          <img src={getImageUrl(product.imageUrl)} alt={product.imageAlt || product.name} />
        </div>

        {/* Body */}
        <div className="product-detail-body">
          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {product.isBestSeller && <span className="badge badge-bestseller">🔥 Best Seller</span>}
            {product.isFeatured && <span className="badge badge-special">⭐ Today's Special</span>}
            {product.isNewArrival && <span className="badge badge-new">✨ New</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {product.isVegetarian ? <><Leaf size={14} color="#4CAF50" /><span style={{ fontSize: 11, color: '#4CAF50', fontWeight: 600 }}>Vegetarian</span></> : <><Flame size={14} color="#B71C1C" /><span style={{ fontSize: 11, color: '#B71C1C', fontWeight: 600 }}>Non-Veg</span></>}
            </span>
          </div>

          <h1 className="product-detail-name">{product.name}</h1>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#FFF8E1', padding: '4px 10px', borderRadius: 999 }}>
                <Star size={13} fill="#FFC107" stroke="#FFC107" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{product.averageRating?.toFixed(1)}</span>
              </div>
              <span style={{ fontSize: 12, color: '#999' }}>({product.totalReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="product-detail-price">
            <span className="current">₹{price}</span>
            {discount > 0 && <>
              <span className="original">₹{product.price}</span>
              <span className="discount">{discount}% OFF</span>
            </>}
          </div>

          {product.description && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #EBEBEB' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{product.description}</div>
            </div>
          )}

          {product.servingSize && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>Serves: {product.servingSize} • Prep: {product.prepTimeMinutes || 20} mins</div>
          )}

          {/* Quantity selector */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Quantity</div>
            <div className="quantity-selector">
              <button className="qty-btn" onClick={() => setLocalQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-value">{localQty}</span>
              <button className="qty-btn" onClick={() => setLocalQty(q => q + 1)}>+</button>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#E53935', marginLeft: 12 }}>= ₹{price * localQty}</span>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedData?.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '8px solid #F5F5F5' }}>
            <div className="section-header">
              <div className="section-title">You Might Also Like</div>
            </div>
            <div className="products-scroll hide-scrollbar">
              {relatedData.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Add to Cart */}
      <div className="sticky-cart-bar">
        <button
          className="sticky-add-btn"
          onClick={handleAddToCart}
          disabled={!product.isAvailable}
          id="add-to-cart-btn"
        >
          {product.isAvailable ? `Add to Cart — ₹${price * localQty}` : 'Currently Unavailable'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProductDetailPage;
