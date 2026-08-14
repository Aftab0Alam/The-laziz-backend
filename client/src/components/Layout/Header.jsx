import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Search, X, MapPin } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/helpers';

const RECENT_KEY = 'laziz_recent_searches';
const getRecents = () => JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
const addRecent = (q) => {
  const recents = getRecents().filter(r => r !== q).slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...recents]));
};

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const cartTotal = useCartStore(s => s.items.reduce((sum, i) => sum + i.subtotal, 0));

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const searchWrapRef = useRef(null);

  // Auto-search on query change
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/search?q=${encodeURIComponent(query)}&limit=6`);
        setResults(data.data.products || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!searchWrapRef.current?.contains(e.target)) closeSearch();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setRecents(getRecents());
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleSelect = (product) => {
    addRecent(product.name);
    closeSearch();
    navigate(`/product/${product.slug}`);
  };

  const handleSearch = (q) => {
    const term = q || query.trim();
    if (!term) return;
    addRecent(term);
    closeSearch();
    navigate(`/menu?search=${encodeURIComponent(term)}`);
  };

  const showDropdown = searchOpen && (query.trim() ? results.length > 0 || loading : recents.length > 0);

  return (
    <>
      <header className="header">
        {/* Hamburger */}
        <button aria-label="Menu" style={{ color: '#666', flexShrink: 0 }}>
          <Menu size={22} />
        </button>

        {/* Logo */}
        <a className="header-logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
          <svg className="header-logo-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="#E53935" />
            <text x="20" y="26" textAnchor="middle" fontSize="18" fill="white">🍽</text>
          </svg>
          <div className="header-logo-text">
            <span>LAZIZ</span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#666', display: 'block', letterSpacing: '1px' }}>RESTAURANT</span>
          </div>
        </a>

        {/* Location */}
        {!searchOpen && (
          <div className="header-location-pill">
            <MapPin size={12} color="#E53935" />
            <span>Jainagar</span>
          </div>
        )}

        {/* Inline search bar — expands inside header */}
        {searchOpen && (
          <div ref={searchWrapRef} style={{ flex: 1, position: 'relative' }}>
            <div className="header-search-bar">
              <Search size={16} color="#999" />
              <input
                ref={inputRef}
                className="header-search-input"
                type="text"
                placeholder="Search dishes…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                aria-label="Search food items"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear">
                  <X size={14} color="#999" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="header-search-dropdown">
                {!query.trim() && recents.length > 0 && (
                  <div className="search-dropdown-section">
                    <div className="search-dropdown-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                      <span>Recent</span>
                      <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecents([]); }} style={{ fontSize: 11, color: '#E53935', fontWeight: 600 }}>Clear</button>
                    </div>
                    {recents.map(r => (
                      <div key={r} className="search-result-item" onClick={() => handleSearch(r)}>
                        <Search size={14} color="#999" />
                        <span className="search-result-name">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {query.trim() && (
                  <div className="search-dropdown-section">
                    <div className="search-dropdown-label">Dishes</div>
                    {loading && <div style={{ padding: '10px 16px', fontSize: 12, color: '#999' }}>Searching…</div>}
                    {results.map(product => (
                      <div key={product._id} className="search-result-item" onClick={() => handleSelect(product)}>
                        <img src={getImageUrl(product.imageUrl)} alt={product.name} className="search-result-img" loading="lazy" />
                        <div className="search-result-info">
                          <div className="search-result-name">{product.name}</div>
                          <div className="search-result-cat">{product.categoryId?.name}</div>
                        </div>
                        <span className="search-result-price">₹{product.discountedPrice || product.price}</span>
                      </div>
                    ))}
                    <div className="search-result-item" style={{ color: '#E53935', fontWeight: 600, fontSize: 13 }} onClick={() => handleSearch()}>
                      <Search size={14} />
                      See all results for "{query}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Search toggle icon */}
          <button
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            onClick={searchOpen ? closeSearch : openSearch}
            style={{ color: searchOpen ? '#E53935' : '#666', padding: 4 }}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Cart */}
          <button className="header-cart" onClick={() => navigate('/cart')} aria-label="Cart">
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={22} color="#E53935" />
              {itemCount > 0 && <span className="header-cart-badge">{itemCount}</span>}
            </div>
            {cartTotal > 0 && <span className="header-cart-total">₹{cartTotal}</span>}
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
