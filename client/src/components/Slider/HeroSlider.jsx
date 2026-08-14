import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/helpers';

const HeroSlider = ({ sliders = [] }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const next = useCallback(() => setCurrent(c => (c + 1) % sliders.length), [sliders.length]);
  const prev = () => setCurrent(c => (c - 1 + sliders.length) % sliders.length);

  useEffect(() => {
    if (sliders.length <= 1 || paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [sliders.length, paused, next]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const handleCTA = (slide) => {
    if (slide.linkType === 'category' && slide.linkedCategoryId) navigate(`/menu?category=${slide.linkedCategoryId.slug || ''}`);
    else if (slide.linkType === 'product' && slide.linkedProductId) navigate(`/product/${slide.linkedProductId.slug || ''}`);
    else if (slide.linkType === 'external' && slide.externalUrl) window.open(slide.externalUrl, '_blank');
    else navigate('/menu');
  };

  if (!sliders.length) {
    return (
      <div className="hero-slider" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #1A0A00 0%, #3D0000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Loading offers...</div>
        </div>
      </div>
    );
  }

  const slide = sliders[current];

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {sliders.map((s, idx) => (
          <div key={s._id || idx} className="hero-slide">
            <img src={getImageUrl(s.imageUrl)} alt={s.title} loading={idx === 0 ? 'eager' : 'lazy'} />
            <div className="hero-content">
              {s.subtitle && <div className="hero-tag">{s.subtitle}</div>}
              <div className="hero-title">
                {s.title.includes(' ') ? (
                  <>
                    {s.title.split(' ').slice(0, Math.ceil(s.title.split(' ').length / 2)).join(' ')}
                    <span>{s.title.split(' ').slice(Math.ceil(s.title.split(' ').length / 2)).join(' ')}</span>
                  </>
                ) : s.title}
              </div>
              <button className="hero-cta" onClick={() => handleCTA(s)}>
                {s.ctaButtonText || 'Order Now'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {sliders.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Previous slide"><ChevronLeft size={18} /></button>
          <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Next slide"><ChevronRight size={18} /></button>
        </>
      )}

      {/* Dots */}
      {sliders.length > 1 && (
        <div className="hero-dots">
          {sliders.map((_, idx) => (
            <button key={idx} className={`hero-dot${idx === current ? ' active' : ''}`} onClick={() => setCurrent(idx)} aria-label={`Go to slide ${idx + 1}`} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {!paused && <div key={current} className="hero-progress" />}
    </div>
  );
};

export default HeroSlider;
