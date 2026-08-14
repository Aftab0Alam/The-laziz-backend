require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

// Path to client public images folder (works in both dev and production)
const CLIENT_IMAGES_DIR = path.join(__dirname, '..', 'client', 'public', 'images');

const app = express();

// Trust Render/Heroku reverse proxy — required for rate-limit & IP detection
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// Support comma-separated CLIENT_URL e.g. "https://a.netlify.app,https://b.netlify.app"
const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://the-laziz.netlify.app',          // Netlify frontend (fallback)
  'https://the-laziz-frontend.onrender.com', // Render frontend
  ...clientUrls,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / curl (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, message: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many auth attempts, please try again later.' } });

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/sliders', require('./routes/sliderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/crosssell', require('./routes/crossSellRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: '🍽 Laziz Restaurant API is running!', timestamp: new Date().toISOString() });
});

// ─── Serve food images in ALL modes (dev + production) ──────────
// This allows image URLs like http://localhost:5000/images/biryani.webp to work
// without needing the Vite dev server running.
app.use('/images', express.static(CLIENT_IMAGES_DIR, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// ─── Serve React frontend in production ─────────────────────────
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  // All non-API routes → React app (handles client-side routing)
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  // Dev: plain 404 for unknown API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });
}

// Multer / upload error handler (catches file-size, type, cloudinary errors)
app.use((err, req, res, next) => {
  if (err && err.code && err.code.startsWith('LIMIT_')) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  console.error('[Server Error]', err.message || err);
  if (err.stack) console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Laziz Restaurant Server running on port ${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
});
