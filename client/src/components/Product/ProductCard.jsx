import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Plus } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getDiscountPercent, getImageUrl } from '../../utils/helpers';

const ProductCard = ({ product, size = 'default', offerPrice = null }) => {
  const navigate = useNavigate();
  const { addItem, getItemQuantity, updateQuantity } = useCartStore();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const qty = getItemQuantity(product._id);

  // Check if this product is in user's favourites
  const isFav = isAuthenticated && Array.isArray(user?.favourites) &&
    user.favourites.some(f => (typeof f === 'object' ? f._id : f)?.toString() === product._id?.toString());

  const [favLoading, setFavLoading] = useState(false);

  // Price logic
  const hasOfferPrice = offerPrice != null && Number(offerPrice) > 0;
  const price     = hasOfferPrice ? Number(offerPrice) : (product.discountedPrice || product.price);
  const origPrice = hasOfferPrice ? (product.discountedPrice || product.price) : product.price;
  const showStrike = hasOfferPrice
    ? price < origPrice
    : !!product.discountedPrice;
  const discount = hasOfferPrice
    ? (price < origPrice ? Math.round((1 - price / origPrice) * 100) : 0)
    : getDiscountPercent(product.price, product.discountedPrice);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!product.isAvailable) { toast.error('This item is currently unavailable'); return; }
    addItem(hasOfferPrice ? { ...product, discountedPrice: price } : product);
    toast.success(`${product.name} added to cart!`, { duration: 1500 });
  };

  const handleIncrease = (e) => { e.stopPropagation(); updateQuantity(product._id, qty + 1); };
  const handleDecrease = (e) => { e.stopPropagation(); updateQuantity(product._id, qty - 1); };

  const handleFavourite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      const { data } = await api.post(`/auth/favourites/${product._id}/toggle`);
      const nowFav = data.data.isFavourite;

      // Update local store so heart reflects immediately without re-fetch
      const currentFavs = Array.isArray(user?.favourites) ? user.favourites : [];
      let updatedFavs;
      if (nowFav) {
        updatedFavs = [...currentFavs, product._id];
      } else {
        updatedFavs = currentFavs.filter(f => {
          const id = typeof f === 'object' ? f._id : f;
          return id?.toString() !== product._id?.toString();
        });
      }
      updateUser({ favourites: updatedFavs });
      toast.success(nowFav ? '❤️ Added to favourites' : '💔 Removed from favourites', { duration: 1500 });
    } catch {
      toast.error('Could not update favourites');
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.slug}`)}>
      <div className="product-card-image">
        <img src={getImageUrl(product.imageUrl)} alt={product.imageAlt || product.name} loading="lazy" />
        {hasOfferPrice && discount > 0
          ? <span className="product-card-badge" style={{ background: '#10b981' }}>{discount}% OFF</span>
          : product.isBestSeller && <span className="product-card-badge">Best Seller</span>
        }
        <button
          className={`product-card-heart${isFav ? ' liked' : ''}`}
          onClick={handleFavourite}
          aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
          disabled={favLoading}
          style={{ opacity: favLoading ? 0.5 : 1 }}
        >
          <Heart size={14} fill={isFav ? '#E53935' : 'none'} stroke={isFav ? '#E53935' : '#666'} />
        </button>
      </div>

      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-rating">
          <span className="product-card-stars"><Star size={11} fill="#FFC107" stroke="#FFC107" /></span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{product.averageRating?.toFixed(1) || '4.0'}</span>
          <span className="product-card-review-count">({product.totalReviews || 0})</span>
        </div>
        <div className="product-card-footer">
          <div className="product-card-price">
            {showStrike && <span className="original">₹{origPrice}</span>}
            <span style={hasOfferPrice && discount > 0 ? { color: '#10b981' } : {}}>₹{price}</span>
          </div>
          {qty === 0 ? (
            <button className="btn-add" onClick={handleAdd} disabled={!product.isAvailable}>
              <Plus size={12} />Add
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #E53935', borderRadius: 999, padding: '3px 8px' }}>
              <button onClick={handleDecrease} style={{ color: '#E53935', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>−</button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{qty}</span>
              <button onClick={handleIncrease} style={{ color: '#E53935', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
