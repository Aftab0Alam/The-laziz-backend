import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/helpers';
import { ArrowLeft, Trash2, ShoppingBag, MessageCircle, Plus, Minus, ChevronRight, Tag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import BottomNav from '../components/Layout/BottomNav';
import useAuthStore from '../store/authStore';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const subtotal      = items.reduce((sum, i) => sum + i.subtotal, 0);
  const deliveryCharge = subtotal > 0 ? 20 : 0;
  const total          = subtotal + deliveryCharge;
  const itemCount      = items.reduce((s, i) => s + i.quantity, 0);
  const freeDeliveryAt = 499;
  const toFree         = Math.max(0, freeDeliveryAt - subtotal);

  const handleCheckout = () => {
    if (!isAuthenticated) { navigate('/login?redirect=/checkout'); return; }
    navigate('/checkout');
  };

  return (
    <div className="page-wrapper cart-page-bg">

      {/* ── Top Bar ── */}
      <div className="cart-topbar">
        <button className="cart-topbar-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="cart-topbar-title">
          My Cart
          {itemCount > 0 && <span className="cart-topbar-badge">{itemCount}</span>}
        </div>
        {items.length > 0
          ? <button className="cart-topbar-clear" onClick={clearCart}>Clear All</button>
          : <div style={{ width: 64 }} />}
      </div>

      <div className="cart-body">
        {items.length === 0 ? (
          /* ── Empty State ── */
          <div className="cart-empty-wrap">
            <div className="cart-empty-art">🛒</div>
            <div className="cart-empty-title">Your cart is empty</div>
            <div className="cart-empty-sub">Looks like you haven't added anything yet</div>
            <button className="cart-empty-btn" onClick={() => navigate('/menu')}>
              <ShoppingBag size={16} /> Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* ── Free delivery progress ── */}
            {toFree > 0 && (
              <div className="cart-delivery-bar">
                <div className="cart-delivery-bar-top">
                  <span>🚴 Add <strong>₹{toFree}</strong> more for free delivery!</span>
                  <span className="cart-delivery-pct">{Math.round((subtotal / freeDeliveryAt) * 100)}%</span>
                </div>
                <div className="cart-delivery-track">
                  <div className="cart-delivery-fill" style={{ width: `${Math.min((subtotal / freeDeliveryAt) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            {toFree === 0 && (
              <div className="cart-delivery-bar cart-delivery-bar--free">
                🎉 <strong>Free delivery unlocked!</strong> Enjoy!
              </div>
            )}

            {/* ── Items list ── */}
            <div className="cart-items-wrap">
              {items.map(item => (
                <div key={item.productId} className="cart-item-card">
                  <div className="cart-item-img">
                    {item.imageUrl
                      ? <img src={getImageUrl(item.imageUrl)} alt={item.name} loading="lazy" />
                      : <div className="cart-item-img-ph">🍽</div>}
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-unit">₹{item.price} each</div>
                    <div className="cart-item-row2">
                      <div className="cart-qty-ctrl">
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="cart-qty-num">{item.quantity}</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="cart-item-total">₹{item.subtotal}</span>
                    </div>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.productId)}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* ── Order Note ── */}
            <div className="cart-tip-row">
              <Tag size={14} color="#F57C00" />
              <span>Tip: Order ₹499+ to unlock <strong>free delivery</strong></span>
            </div>

            {/* ── Summary card ── */}
            <div className="cart-summary-card">
              <div className="cart-summary-head">Order Summary</div>

              <div className="cart-summary-line">
                <span>Items ({itemCount})</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="cart-summary-line">
                <span>Delivery fee</span>
                <span className={deliveryCharge === 0 ? 'cart-free-tag' : ''}>
                  {deliveryCharge === 0 ? '✓ FREE' : `₹${deliveryCharge}`}
                </span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-line cart-summary-total">
                <span>Total Payable</span>
                <span>₹{total}</span>
              </div>
            </div>

            {/* ── CTA Buttons ── */}
            <div className="cart-cta-wrap">
              <button className="cart-checkout-cta" onClick={handleCheckout} id="checkout-btn">
                <span>Proceed to Checkout</span>
                <div className="cart-checkout-cta-price">₹{total}</div>
              </button>

              <button
                className="cart-whatsapp-cta"
                onClick={() => navigate('/checkout?method=whatsapp')}
              >
                <MessageCircle size={18} />
                Order via WhatsApp
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CartPage;
