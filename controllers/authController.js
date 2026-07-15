const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = async (userId, rememberMe = false, userAgent = '', ipAddress = '') => {
  const rawToken = uuidv4();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

  await RefreshToken.create({ userId, tokenHash, userAgent, ipAddress, rememberMe, expiresAt });
  return rawToken;
};

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number';
      return res.status(409).json({ success: false, message: `${field} already registered` });
    }

    const user = await User.create({ name, email, phone, passwordHash: password, isVerified: true });

    const accessToken = generateAccessToken(user);
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip;
    const refreshToken = await generateRefreshToken(user._id, false, userAgent, ipAddress);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { accessToken, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, profileImageUrl: user.profileImageUrl } },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isLocked()) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${remainingMin} minutes.` });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip;
    const refreshToken = await generateRefreshToken(user._id, rememberMe, userAgent, ipAddress);
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { accessToken, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, profileImageUrl: user.profileImageUrl, addresses: user.addresses, favourites: user.favourites } },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// REFRESH TOKEN
exports.refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const storedToken = await RefreshToken.findOne({ tokenHash, isRevoked: false });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(storedToken.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    storedToken.lastUsedAt = new Date();
    await storedToken.save();

    const accessToken = generateAccessToken(user);
    return res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await RefreshToken.deleteOne({ tokenHash });
    }
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// LOGOUT ALL DEVICES
exports.logoutAll = async (req, res) => {
  try {
    await RefreshToken.deleteMany({ userId: req.user._id });
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET USER ADDRESSES
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    return res.status(200).json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADD ADDRESS
exports.addAddress = async (req, res) => {
  try {
    const { label, customLabel, recipientName, phone, street, landmark, area, city, state, postalCode, isDefault } = req.body;
    if (!recipientName || !phone || !street || !area || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'All required address fields must be filled' });
    }

    const user = await User.findById(req.user._id);

    // If this is the first address or explicitly set as default, clear others
    const shouldBeDefault = isDefault || user.addresses.length === 0;
    if (shouldBeDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    user.addresses.push({ label, customLabel, recipientName, phone, street, landmark, area, city, state, postalCode, isDefault: shouldBeDefault });
    await user.save();

    return res.status(201).json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// UPDATE ADDRESS
exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addrId);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    const { label, customLabel, recipientName, phone, street, landmark, area, city, state, postalCode, isDefault } = req.body;

    // If setting as default, clear all others first
    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    if (label !== undefined) addr.label = label;
    if (customLabel !== undefined) addr.customLabel = customLabel;
    if (recipientName !== undefined) addr.recipientName = recipientName;
    if (phone !== undefined) addr.phone = phone;
    if (street !== undefined) addr.street = street;
    if (landmark !== undefined) addr.landmark = landmark;
    if (area !== undefined) addr.area = area;
    if (city !== undefined) addr.city = city;
    if (state !== undefined) addr.state = state;
    if (postalCode !== undefined) addr.postalCode = postalCode;
    if (isDefault !== undefined) addr.isDefault = isDefault;

    await user.save();
    return res.status(200).json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE ADDRESS
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addrId);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    const wasDefault = addr.isDefault;
    addr.deleteOne();

    // If deleted address was default, make the first remaining one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.status(200).json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// TOGGLE FAVOURITE
exports.toggleFavourite = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const isFav = user.favourites.some(id => id.toString() === productId);

    if (isFav) {
      // Remove
      await User.findByIdAndUpdate(req.user._id, { $pull: { favourites: productId } });
      return res.status(200).json({ success: true, data: { isFavourite: false } });
    } else {
      // Add
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { favourites: productId } });
      return res.status(200).json({ success: true, data: { isFavourite: true } });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET FAVOURITES (populated)
exports.getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favourites',
      select: 'name slug imageUrl price discountedPrice isAvailable isBestSeller averageRating totalReviews',
    });
    return res.status(200).json({ success: true, data: { favourites: user.favourites } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

