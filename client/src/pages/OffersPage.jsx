import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Copy, Check, ArrowLeft } from 'lucide-react';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';

const OffersPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(null);

  const offers = [
    {
      code: 'WELCOME50',
      title: 'Welcome Offer',
      desc: '50% off on your first order. A warm welcome from Laziz!',
      min: 200,
      discount: '50%',
      bg: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
      accent: '#FF6B35',
      icon: '🎁',
      validity: 'Valid till 30 Jun 2026',
    },
    {
      code: 'FREE499',
      title: 'Free Delivery',
      desc: 'Enjoy free delivery on every order above ₹499. No hidden charges!',
      min: 499,
      discount: '₹40',
      bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      accent: '#4CAF50',
      icon: '🚴',
      validity: 'Always active',
    },
    {
      code: 'WEEKEND100',
      title: 'Weekend Special',
      desc: 'Treat yourself every weekend with ₹100 extra off on orders!',
      min: 399,
      discount: '₹100',
      bg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
      accent: '#1976D2',
      icon: '🎉',
      validity: 'Every Sat & Sun',
    },
    {
      code: 'LAZIZ10',
      title: '10% Cashback',
      desc: 'Get 10% off on all orders above ₹799. More you order, more you save!',
      min: 799,
      discount: '10%',
      bg: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
      accent: '#E53935',
      icon: '💰',
      validity: 'Valid all week',
    },
    {
      code: 'BIRYANI20',
      title: 'Biryani Lovers',
      desc: '20% off on all biryani orders. Because you deserve the best!',
      min: 300,
      discount: '20%',
      bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
      accent: '#FF8F00',
      icon: '🍚',
      validity: 'Valid for all days',
    },
  ];

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="page-wrapper">
      <Header />
      <div style={{ paddingTop: 8 }}>

        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1A0A00 0%, #3D0000 100%)',
          padding: '24px 16px 20px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🏷️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            Offers & Deals
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            Exclusive discounts just for you
          </p>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {offers.map(offer => (
            <div
              key={offer.code}
              style={{
                background: offer.bg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 14,
                border: `1.5px dashed ${offer.accent}50`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative circles */}
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                borderRadius: '50%', background: `${offer.accent}15`,
              }} />
              <div style={{
                position: 'absolute', bottom: -30, right: 40, width: 60, height: 60,
                borderRadius: '50%', background: `${offer.accent}10`,
              }} />

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
                {/* Discount badge */}
                <div style={{
                  textAlign: 'center', background: 'white', borderRadius: 12, padding: '10px 14px',
                  border: `2px solid ${offer.accent}`, flexShrink: 0, boxShadow: `0 4px 12px ${offer.accent}20`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: offer.accent, lineHeight: 1 }}>
                    {offer.discount}
                  </div>
                  <div style={{ fontSize: 9, color: '#999', fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>OFF</div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{offer.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{offer.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{offer.desc}</p>
                  <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>
                    Min. ₹{offer.min} • {offer.validity}
                  </div>
                </div>
              </div>

              {/* Code row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${offer.accent}50`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={12} color={offer.accent} />
                  <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: offer.accent }}>
                    {offer.code}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(offer.code)}
                  style={{
                    background: copied === offer.code ? '#4CAF50' : offer.accent,
                    color: 'white', border: 'none', borderRadius: 999, padding: '7px 16px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 5, transition: 'background 200ms ease',
                  }}
                >
                  {copied === offer.code
                    ? <><Check size={12} /> Copied!</>
                    : <><Copy size={12} /> Copy Code</>
                  }
                </button>
              </div>
            </div>
          ))}

          {/* Info box */}
          <div style={{
            background: '#FFF8E1', borderRadius: 12, padding: '12px 14px',
            border: '1px solid #FFE082', marginTop: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F57F17', marginBottom: 4 }}>
              ℹ️ How to use codes?
            </div>
            <div style={{ fontSize: 12, color: '#795548', lineHeight: 1.6 }}>
              1. Copy the offer code above<br />
              2. Add items to cart<br />
              3. Apply code at checkout<br />
              4. Enjoy your discount! 🎉
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default OffersPage;
